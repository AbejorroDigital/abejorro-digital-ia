/**
 * Configuración global corregida.
 * Se eliminan los prefijos de Hugging Face para compatibilidad con Groq.
 */
export const STARTUP_CONFIG = {
    API_KEY: import.meta.env.VITE_API_KEY,
    // Eliminamos "meta-llama/" y usamos el ID reconocido por Groq
    MODEL_ID: import.meta.env.VITE_MODEL_ID || "llama-4-scout-17b", 
    API_URL: "https://api.groq.com/openai/v1/chat/completions"
};
