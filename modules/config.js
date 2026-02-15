/**
 * Configuración global de la aplicación.
 * Maneja las variables de entorno para seguridad.
 */
export const STARTUP_CONFIG = {
    API_KEY: import.meta.env.VITE_API_KEY,
    MODEL_ID: import.meta.env.VITE_MODEL_ID || "meta-llama/Llama-3.3-70B-Instruct",
    API_URL: "https://router.huggingface.co/v1/chat/completions"
};
