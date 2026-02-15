/**
 * Configuración global de la aplicación.
 * Maneja las variables de entorno para seguridad.
 */
export const STARTUP_CONFIG = {
    API_KEY: import.meta.env.VITE_API_KEY,
    MODEL_ID: import.meta.env.VITE_MODEL_ID || "Qwen/Qwen3-Coder-Next",
    API_URL: "https://router.huggingface.co/v1/chat/completions"
};
