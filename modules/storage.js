/**
 * Módulo para la persistencia de datos en LocalStorage.
 */

const STORAGE_KEY = 'abejorro_history';

/**
 * Carga el historial de chats desde LocalStorage.
 * @returns {Array} Array de objetos de chat.
 */
export function loadHistory() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (e) {
        console.error("Error cargando historial:", e);
        return [];
    }
}

/**
 * Guarda el historial completo en LocalStorage.
 * @param {Array} history - El array completo de chats.
 */
export function saveHistory(history) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch (e) {
        console.error("Error guardando historial:", e);
    }
}

/**
 * Actualiza o crea un chat en el historial.
 * @param {Array} currentHistory - El historial actual.
 * @param {number} chatId - ID del chat a actualizar.
 * @param {string} userText - Texto del usuario.
 * @param {string} aiResponse - Respuesta de la IA.
 * @returns {Array} El historial actualizado.
 */
export function updateChatInHistory(currentHistory, chatId, userText, aiResponse) {
    // Clonar para evitar mutar referencias directas si fuera necesario
    // En este caso simple, trabajamos sobre el array.
    const index = currentHistory.findIndex(c => c.id === chatId);
    const newMessage = { role: 'user', content: userText, ai: aiResponse };

    if (index > -1) {
        currentHistory[index].messages.push(newMessage);
        // Generar título si es un chat nuevo sin título
        if (currentHistory[index].title.includes("Nueva")) {
            currentHistory[index].title = userText.substring(0, 25) + (userText.length > 25 ? "..." : "");
        }
    } else {
        currentHistory.unshift({
            id: chatId,
            title: userText.substring(0, 25) + (userText.length > 25 ? "..." : ""),
            messages: [newMessage]
        });
    }

    saveHistory(currentHistory);
    return currentHistory;
}

/**
 * Elimina un chat del historial.
 * @param {Array} currentHistory - El historial actual.
 * @param {number} id - ID del chat a eliminar.
 * @returns {Array} El historial actualizado.
 */
export function deleteChatFromHistory(currentHistory, id) {
    const newHistory = currentHistory.filter(c => c.id !== id);
    saveHistory(newHistory);
    return newHistory;
}
