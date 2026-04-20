import bcrypt from "bcryptjs";
import users from "../models/users.js";
import { signAccessToken, signRefreshToken } from "../shared/jwt.js";

const MAX_ATTEMPTS = 5;
const BLOCK_DURATION_MS = 5 * 60 * 1000;

/**
 * Resultado de intento de login.
 * @typedef {{ ok: true, token: string, user: object }
 *          | { ok: false, status: 'not_found'|'blocked'|'wrong_password', message: string }} LoginResult
 */

/**
 * Busca el usuario, valida la contraseña y gestiona el bloqueo por intentos.
 * No sabe nada de HTTP — devuelve un objeto de resultado que el controlador interpreta.
 *
 * @param {string} email
 * @param {string} password
 * @returns {Promise<LoginResult>}
 */
export const attemptLogin = async (email, password) => {
  const user = await users.findOne({ email });

  if (!user) {
    return { ok: false, status: "not_found", message: "Usuario no encontrado" };
  }

  if (isBlocked(user)) {
    return { ok: false, status: "blocked", message: "Cuenta bloqueada temporalmente" };
  }

  const passwordMatch = await bcrypt.compare(password, user.password);

  if (!passwordMatch) {
    await registerFailedAttempt(user);
    const blocked = isBlocked(user);
    return {
      ok: false,
      status: blocked ? "blocked" : "wrong_password",
      message: blocked
        ? "Cuenta bloqueada por múltiples intentos fallidos"
        : "Contraseña incorrecta",
    };
  }

  await resetAttempts(user);

  const tokenPayload = { id: user._id, userType: user.userType || "usuario" };
  const accessToken  = signAccessToken(tokenPayload);
  const refreshToken = signRefreshToken(tokenPayload);

  return {
    ok: true,
    accessToken,
    refreshToken,
    user: {
      id: user._id,
      email: user.email,
      name: user.name,
      lastName: user.lastName,
      userType: user.userType || "usuario",
    },
  };
};

const isBlocked = (user) =>
  Boolean(user.timeOut && user.timeOut > Date.now());

const registerFailedAttempt = async (user) => {
  user.loginAttemps = (user.loginAttemps || 0) + 1;

  if (user.loginAttemps >= MAX_ATTEMPTS) {
    user.timeOut = Date.now() + BLOCK_DURATION_MS;
    user.loginAttemps = 0;
  }

  await user.save();
};

const resetAttempts = async (user) => {
  user.loginAttemps = 0;
  user.timeOut = null;
  await user.save();
};


