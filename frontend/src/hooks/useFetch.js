const useFetch = () => {
  const SERVER_URL = "http://localhost:3000/api";

  const useLogin = async (email, password) => {
    const response = await fetch(`${SERVER_URL}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(payload.message || "Error en la autenticación");
    }

    const data = payload?.data ?? null;
    return {
      message: payload?.message || "Login exitoso",
      data,
    };
  };

  return { useLogin };
};

export default useFetch;
