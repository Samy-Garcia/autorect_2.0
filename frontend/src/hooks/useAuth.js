import { useContext } from "react";
import { AuthContext } from "../contexts/authContext";

// Hook personalizado para usar el contexto de autenticación
export const useAuth = () => useContext(AuthContext);
