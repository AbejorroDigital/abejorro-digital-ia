import { STARTUP_CONFIG } from './config.js';

/**
 * Envía un mensaje a la API de HuggingFace.
 * @param {Array} messages - Array de mensajes con contexto.
 * @returns {Promise<string>} Contenido de la respuesta.
 */
export async function sendMessageToAI(messages) {
    if (!STARTUP_CONFIG.API_KEY) throw new Error("API Key no configurada.");

    const response = await fetch(STARTUP_CONFIG.API_URL, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${STARTUP_CONFIG.API_KEY}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            model: STARTUP_CONFIG.MODEL_ID,
            messages: messages,
            max_tokens: 2048
        })
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error.message);

    // Asumiendo estructura estándar de OpenAI/HF
    return data.choices[0].message.content;
}

/**
 * Realiza un "ping" al modelo para calentarlo.
 * @returns {Promise<boolean>} True si fue exitoso.
 */
export async function warmupModelService() {
    try {
        const res = await fetch(STARTUP_CONFIG.API_URL, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${STARTUP_CONFIG.API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: STARTUP_CONFIG.MODEL_ID,
                messages: [{ role: "user", content: "ping" }],
                max_tokens: 5
            })
        });
        return res.ok;
    } catch (e) {
        return false;
    }
}
