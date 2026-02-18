/**
 * Configuración global corregida con el ID exacto de la colmena.
 */
export const STARTUP_CONFIG = {
    API_KEY: import.meta.env.VITE_API_KEY,
    // Usamos el ID exacto que devolvió tu consulta a la API de Groq
    MODEL_ID: import.meta.env.VITE_MODEL_ID || "meta-llama/llama-4-scout-17b-16e-instruct", 
    API_URL: "https://api.groq.com/openai/v1/chat/completions"
};
