import axios from "axios";
import { toast } from "sonner";

/**
 * Instancia centralizada de Axios para todas las peticiones al Backend.
 * Implementa interceptores de seguridad para gestión de tokens y expiración de sesión.
 */
const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3010/api",
    headers: {
        "Content-Type": "application/json",
    },
});

// Interceptor de Petición: Inyecta el token de sessionStorage automáticamente
api.interceptors.request.use(
    (config) => {
        const token = sessionStorage.getItem("token");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Interceptor de Respuesta: Gestiona el cierre de sesión proactivo (401/403)
api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        // 401: No autorizado (Token expirado o inválido) -> Redirigir al login
        if (error.response?.status === 401) {
            const isLoginPath = window.location.pathname.includes("/login");
            if (!isLoginPath) {
                sessionStorage.removeItem("token");
                sessionStorage.removeItem("user");
                window.location.href = "/login?expired=true";
            }
        }

        // 403: Prohibido (No tiene permisos) -> Solo informar, NO cerrar sesión
        if (error.response?.status === 403) {
            toast.error("No tienes permisos suficientes para realizar esta acción.");
        }
        
        return Promise.reject(error);
    }
);

export default api;
