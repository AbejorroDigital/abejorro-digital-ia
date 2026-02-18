/**
 * Actualiza la función appendMessage para un scroll más robusto
 */
export function appendMessage(role, content) {
    const chatBox = document.getElementById('chatBox');
    const wrapper = document.createElement('div');
    wrapper.className = `flex gap-3 md:gap-6 mb-6 ${role === 'user' ? 'justify-end' : 'animate-fade-in'}`;

    // ... (mismo código de formateo que ya tienes) ...
    let formattedContent;
    if (role === 'ai') {
        formattedContent = formatResponse(content);
    } else {
        formattedContent = content.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }

    wrapper.innerHTML = `
        ${role === 'ai' ? '<div class="w-10 h-10 md:w-12 md:h-12 rounded-full bg-yellow-500 flex items-center justify-center flex-shrink-0 shadow-xl border-2 border-black/10"><i class="fas fa-bee text-black text-lg"></i></div>' : ''}
        <div class="relative group max-w-[88%] md:max-w-[80%]">
            <div class="${role === 'user' ? 'bg-yellow-500 text-black rounded-2xl rounded-tr-none font-medium' : 'bg-gray-800/80 border border-yellow-500/10 rounded-2xl rounded-tl-none'} p-5 text-sm leading-relaxed shadow-2xl">
                <div class="content-area w-full clear-both space-y-4">${formattedContent}</div>
            </div>
            ${role === 'ai' ? `
                <button onclick="window.copyToClipboard(this)" class="copy-btn-ai absolute -bottom-7 right-2 text-[10px] text-gray-500 hover:text-yellow-500 flex items-center gap-1.5 transition-all font-bold uppercase tracking-wider">
                    <i class="fas fa-copy"></i> COPIAR RESPUESTA
                </button>
            ` : ''}
        </div>
    `;

    chatBox.appendChild(wrapper);

    // SCROLL MEJORADO: Usamos scrollIntoView para asegurar que el mensaje sea visible
    wrapper.scrollIntoView({ behavior: 'smooth', block: 'end' });

    return {
        content: wrapper.querySelector('.content-area'),
        button: wrapper.querySelector('.copy-btn-ai')
    };
}
