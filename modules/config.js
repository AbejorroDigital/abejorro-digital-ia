/**
 * Configuración global de la aplicación.
 * Optimizado para el motor de inferencia LPU de Groq y Llama 4.
 */
export const STARTUP_CONFIG = {
    // Se mantiene la referencia a la variable de entorno de Vite
    API_KEY: import.meta.env.VITE_API_KEY,
    
    // Definimos el modelo específico de Llama 4 que has seleccionado
    MODEL_ID: import.meta.env.VITE_MODEL_ID || "meta-llama/Llama-4-Scout-17B-16E-Instruct",
    
    // Actualizamos la URL para que el flujo de datos se dirija a la infraestructura de Groq
    API_URL: "https://api.groq.com/openai/v1/chat/completions"
};
