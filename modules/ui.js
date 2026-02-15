import { formatResponse } from './utils.js';

/**
 * Renderiza el historial de chats en la barra lateral.
 * @param {Array} history - El historial de chats.
 * @param {number} currentChatId - ID del chat actual.
 * @param {Function} loadChatCallback - Función a ejecutar al hacer click en un chat.
 * @param {Function} deleteChatCallback - Función a ejecutar al eliminar un chat.
 */
export function renderHistory(history, currentChatId, loadChatCallback, deleteChatCallback) {
    const list = document.getElementById('historyList');
    if (history.length === 0) {
        list.innerHTML = '<div class="p-8 text-center text-gray-700 text-xs italic">La colmena está vacía</div>';
        return;
    }

    list.innerHTML = '';
    history.forEach(chat => {
        const item = document.createElement('div');
        item.className = `group relative p-3 text-[11px] rounded-xl cursor-pointer transition-all mb-1 font-bold tracking-tight ${chat.id === currentChatId ? 'bg-yellow-500/15 text-yellow-500 border border-yellow-500/30 shadow-inner' : 'text-gray-500 hover:bg-white/5 border border-transparent'}`;
        item.innerHTML = `
            <div class="truncate pr-6 uppercase"><i class="fas fa-bolt mr-2 opacity-30"></i> ${chat.title}</div>
            <button class="delete-btn absolute right-2 top-3 opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all">
                <i class="fas fa-trash"></i>
            </button>
        `;

        // Event listeners
        item.addEventListener('click', () => loadChatCallback(chat.id));
        item.querySelector('.delete-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            deleteChatCallback(chat.id);
        });

        list.appendChild(item);
    });
}

/**
 * Añade un mensaje al contenedor del chat.
 * @param {string} role - 'user' o 'ai'.
 * @param {string} content - Contenido HTML o texto del mensaje.
 * @returns {HTMLElement} El elemento donde se insertó el contenido (útil para actualizar después).
 */
export function appendMessage(role, content) {
    const chatBox = document.getElementById('chatBox');
    const wrapper = document.createElement('div');
    wrapper.className = `flex gap-3 md:gap-6 mb-6 ${role === 'user' ? 'justify-end' : 'animate-fade-in'}`;

    let formattedContent;
    if (role === 'ai') {
        formattedContent = formatResponse(content);
    } else {
        // Simple escape for user content to prevent XSS
        formattedContent = content.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }

    wrapper.innerHTML = `
        ${role === 'ai' ? '<div class="w-10 h-10 md:w-12 md:h-12 rounded-full bg-yellow-500 flex items-center justify-center flex-shrink-0 shadow-xl border-2 border-black/10"><i class="fas fa-bee text-black text-lg"></i></div>' : ''}
        <div class="relative group max-w-[88%] md:max-w-[80%]">
            <div class="${role === 'user' ? 'bg-yellow-500 text-black rounded-2xl rounded-tr-none font-medium' : 'bg-gray-800/80 border border-yellow-500/10 rounded-2xl rounded-tl-none'} p-5 text-sm leading-relaxed shadow-2xl">
                <div class="content-area w-full clear-both space-y-4" style="display: block !important; width: 100% !important; white-space: normal !important; word-break: break-word !important;">${formattedContent}</div>
            </div>
            ${role === 'ai' ? `
                <button onclick="window.copyToClipboard(this)" class="copy-btn-ai absolute -bottom-7 right-2 text-[10px] text-gray-500 hover:text-yellow-500 flex items-center gap-1.5 transition-all font-bold uppercase tracking-wider">
                    <i class="fas fa-copy"></i> COPIAR RESPUESTA
                </button>
            ` : ''}
        </div>
    `;

    // NEUTRALIZACIÓN POST-INYECCIÓN: Detectar etiquetas peligrosas que hayan escapado al parser fuera de bloques pre
    const contentArea = wrapper.querySelector('.content-area');
    if (role === 'ai' && contentArea) {
        // Buscamos formularios o estilos inyectados directamente en el flujo de la prosa
        const subForm = contentArea.querySelector('form');
        const subStyle = contentArea.querySelector('style');
        if (subForm || subStyle) {
            console.warn("Abejorro Neutralization: Se detectó intento de inyección de componentes vivos fuera de bloques de código.");
            // Si detectamos inyección viva, escapamos todo el contenido del mensaje por seguridad
            contentArea.innerText = contentArea.innerHTML;
        }
    }

    chatBox.appendChild(wrapper);

    // Sincronización de renderizado
    requestAnimationFrame(() => {
        chatBox.scrollTop = chatBox.scrollHeight;
    });

    return {
        content: wrapper.querySelector('.content-area'),
        button: wrapper.querySelector('.copy-btn-ai')
    };
}

/**
 * Muestra el indicador de carga.
 * @returns {HTMLElement} El elemento donde se insertará la respuesta.
 */
export function showLoadingMessage() {
    const chatBox = document.getElementById('chatBox');
    const wrapper = document.createElement('div');
    wrapper.className = 'flex gap-3 md:gap-6 animate-fade-in mb-6';

    wrapper.innerHTML = `
        <div class="w-10 h-10 md:w-12 md:h-12 rounded-full bg-yellow-500 flex items-center justify-center flex-shrink-0 shadow-xl border-2 border-black/10">
            <i class="fas fa-bee text-black text-lg floating-bee">🐝</i>
        </div>
        <div class="relative group max-w-[88%] md:max-w-[80%]">
            <div class="bg-gray-800/80 border border-yellow-500/10 rounded-2xl rounded-tl-none p-5 text-sm leading-relaxed shadow-2xl">
                <div class="content-area w-full clear-both space-y-4" style="display: block !important; width: 100% !important; white-space: normal !important; word-break: break-word !important;">
                    <i class="fas fa-spin text-yellow-500 floating-bee">🐝</i> 
                    <span>Zumbando a través de los datos...</span>
                </div>
            </div>
            <button onclick="window.copyToClipboard(this)" class="copy-btn-ai absolute -bottom-7 right-2 text-[10px] text-gray-500 hover:text-yellow-500 flex items-center gap-1.5 transition-all font-bold uppercase tracking-wider opacity-0 pointer-events-none">
                <i class="fas fa-copy"></i> COPIAR RESPUESTA
            </button>
        </div>
    `;

    chatBox.appendChild(wrapper);

    requestAnimationFrame(() => {
        chatBox.scrollTop = chatBox.scrollHeight;
    });

    return {
        content: wrapper.querySelector('.content-area'),
        button: wrapper.querySelector('.copy-btn-ai')
    };
}

/**
 * Limpia el chat y muestra el mensaje de bienvenida.
 */
export function clearChatUI() {
    const chatBox = document.getElementById('chatBox');
    chatBox.innerHTML = `
        <div class="flex gap-4 animate-fade-in opacity-80">
            <div class="w-12 h-12 rounded-full bg-yellow-500/10 flex items-center justify-center flex-shrink-0 border border-yellow-500/20">
                <i class="fas fa-bee text-yellow-500 text-xl">🐝</i>
            </div>
            <div class="p-1 max-w-2xl text-gray-400 text-sm italic leading-relaxed">
                <p>Frecuencia de zumbido sincronizada. El enjambre digital está operando en baja latencia. ¿Qué código o lógica procesaremos hoy?</p>
            </div>
        </div>
    `;
}

/**
 * Alterna la visibilidad de la barra lateral.
 */
export function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    sidebar.classList.toggle('open');
    overlay.classList.toggle('hidden');
}

/**
 * Alterna la visibilidad del prompt de sistema.
 */
export function toggleSystemPrompt() {
    const container = document.getElementById('systemPromptContainer');
    container.classList.toggle('open');
    if (container.classList.contains('open')) {
        document.getElementById('systemInput').focus();
    }
}

/**
 * Actualiza la UI del estado de conexión (warmup).
 * @param {string} status - 'warming', 'ready', 'error'.
 */
export function updateConnectionStatus(status) {
    const sText = document.getElementById('statusText');
    const sIcon = document.getElementById('statusIcon');
    const wBtn = document.getElementById('warmupBtn');

    if (status === 'warming') {
        sText.innerText = "CALIBRANDO FRECUENCIAS...";
        sIcon.className = "fas fa-circle status-warming";
    } else if (status === 'ready') {
        sText.innerText = "NÚCLEO ACTIVO";
        sIcon.className = "fas fa-circle status-ready text-[8px]";
        wBtn.innerHTML = '<i class="fas fa-check"></i> CONECTADO';
        wBtn.classList.replace('text-yellow-500', 'text-green-500');
        wBtn.classList.replace('bg-yellow-500/10', 'bg-green-500/10');
    } else if (status === 'error') {
        sText.innerText = "ERROR DE CONEXIÓN";
        sIcon.className = "fas fa-circle status-idle text-[8px]";
    }
}
