import { sendMessageToAI, warmupModelService } from './modules/api.js';
import { deleteChatFromHistory, loadHistory, updateChatInHistory } from './modules/storage.js';
import * as UI from './modules/ui.js';
import { copyCode, copyToClipboard, formatResponse } from './modules/utils.js';
// import './style.css'; // Removed: CSS is imported in HTML via link tag

// Exponer funciones globales NECESARIAS para utils.js (copyCode, copyToClipboard son llamadas desde HTML generado dinámicamente)
window.copyCode = copyCode;
window.copyToClipboard = copyToClipboard;

// Ya no exponemos funciones de lógica de negocio al objeto window
// window.toggleSidebar = ... ELIMINADO

// Estado global
let currentChatId = Date.now();
let chatHistory = [];

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    chatHistory = loadHistory();
    UI.renderHistory(chatHistory, currentChatId, loadChat, deleteChat);

    if (chatHistory.length > 0) {
        loadChat(chatHistory[0].id);
    } else {
        createNewChat();
    }

    setupEventListeners();
});

function setupEventListeners() {
    const userInput = document.getElementById('userInput');

    // Auto-resize
    userInput.addEventListener('input', function () {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
    });

    // Enter para enviar
    userInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    });

    // Vinculación de eventos por ID (reemplaza atributos inline del HTML)
    document.getElementById('sendBtn')?.addEventListener('click', handleSendMessage);
    document.getElementById('warmupBtn')?.addEventListener('click', handleWarmup);

    // Mobile Menu & Sidebar
    document.getElementById('mobileMenuBtn')?.addEventListener('click', UI.toggleSidebar);
    document.getElementById('mobileNewChatBtn')?.addEventListener('click', createNewChat);
    document.getElementById('desktopNewChatBtn')?.addEventListener('click', createNewChat);
    document.getElementById('sidebarCloseBtn')?.addEventListener('click', UI.toggleSidebar);
    document.getElementById('sidebarOverlay')?.addEventListener('click', UI.toggleSidebar);

    // System Prompt
    document.getElementById('systemPromptToggleBtn')?.addEventListener('click', UI.toggleSystemPrompt);
    document.getElementById('mobileSystemPromptToggleBtn')?.addEventListener('click', UI.toggleSystemPrompt);
    document.getElementById('systemPromptCloseBtn')?.addEventListener('click', UI.toggleSystemPrompt);
}

function createNewChat() {
    currentChatId = Date.now();
    UI.clearChatUI();
    if (window.innerWidth < 768) {
        document.getElementById('sidebar').classList.remove('open');
        document.getElementById('sidebarOverlay').classList.add('hidden');
    }
    UI.renderHistory(chatHistory, currentChatId, loadChat, deleteChat);
}

function loadChat(id) {
    currentChatId = id;
    const chat = chatHistory.find(c => c.id === id);
    const chatBox = document.getElementById('chatBox');
    chatBox.innerHTML = '';

    if (chat && chat.messages) {
        chat.messages.forEach(msg => {
            UI.appendMessage('user', msg.content);
            UI.appendMessage('ai', formatResponse(msg.ai));
        });
    }
    UI.renderHistory(chatHistory, currentChatId, loadChat, deleteChat);
}

function deleteChat(id) {
    chatHistory = deleteChatFromHistory(chatHistory, id);
    if (currentChatId === id) {
        createNewChat();
    } else {
        UI.renderHistory(chatHistory, currentChatId, loadChat, deleteChat);
    }
}

async function handleWarmup() {
    UI.updateConnectionStatus('warming');
    const success = await warmupModelService();
    if (success) {
        UI.updateConnectionStatus('ready');
    } else {
        UI.updateConnectionStatus('error');
    }
}

async function handleSendMessage() {
    const input = document.getElementById('userInput');
    const systemInput = document.getElementById('systemInput');
    const sendBtn = document.getElementById('sendBtn');
    const text = input.value.trim();

    if (!text || sendBtn.disabled) return;

    const systemPrompt = systemInput.value.trim();
    input.value = '';
    input.style.height = 'auto';
    input.disabled = true;
    sendBtn.disabled = true;

    UI.appendMessage('user', text);
    const loadingState = UI.showLoadingMessage();

    // 1. CONSTRUCCIÓN DEL CONTEXTO (Memoria Activa)
    const messages = [];
    const baseSystemInstruction = "Responde exclusivamente en el idioma del usuario (Español por defecto). PROHIBIDO, bajo cualquier concepto, usar caracteres de alfabetos no latinos (como mandarín, chino, japonés, cirílico, etc.). Si detectas tokens extraños, ignóralos y mantén la pureza del español académico. Los términos técnicos deben ser en su formato estándar (English). Tu salida debe ser perfectamente formateada en Markdown.";

    // Añadir System Prompt
    const fullSystemPrompt = systemPrompt ? `${baseSystemInstruction} ${systemPrompt}` : baseSystemInstruction;
    messages.push({ role: "system", content: fullSystemPrompt });

    // Cargar historial del chat actual
    const currentChat = chatHistory.find(c => c.id === currentChatId);
    if (currentChat && currentChat.messages) {
        // Tomamos los últimos 14 mensajes (para dejar espacio al mensaje actual y no exceder límites)
        const recentMessages = currentChat.messages.slice(-7); // 7 pares = 14 mensajes
        recentMessages.forEach(msg => {
            messages.push({ role: "user", content: msg.content });
            if (msg.ai) {
                messages.push({ role: "assistant", content: msg.ai });
            }
        });
    }

    // Añadir el mensaje actual del usuario
    messages.push({ role: "user", content: text });

    try {
        const content = await sendMessageToAI(messages);
        loadingState.content.innerHTML = formatResponse(content);

        // Activar el botón de copiado
        if (loadingState.button) {
            loadingState.button.classList.remove('opacity-0', 'pointer-events-none');
        }

        // Actualizar historial persistente
        chatHistory = updateChatInHistory(chatHistory, currentChatId, text, content);
        UI.renderHistory(chatHistory, currentChatId, loadChat, deleteChat);

    } catch (error) {
        loadingState.content.innerHTML = `<div class="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs">
            <i class="fas fa-exclamation-triangle mr-2"></i> Error: No se pudo contactar con la colmena digital. (${error.message})
        </div>`;
    } finally {
        input.disabled = false;
        sendBtn.disabled = false;
        input.focus();
    }
}
