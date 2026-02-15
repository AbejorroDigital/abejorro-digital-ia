import DOMPurify from 'dompurify';
import { marked } from 'marked';

// Configurar renderer personalizado para marked
const renderer = new marked.Renderer();

// Custom code block renderer para mantener el estilo y botón de copia
renderer.code = function (code, language) {
    const id = 'code-' + Math.random().toString(36).substr(2, 9);
    // Asegurar que language no sea undefined
    const lang = language || 'TEXTO';

    return `
        <div class="code-block my-4 rounded-lg overflow-hidden border border-gray-700 bg-[#0d0d0d]">
            <div class="code-header flex justify-between items-center px-4 py-2 bg-[#1a1a1a] border-b border-gray-700 text-yellow-500 text-xs font-mono">
                <span class="font-black tracking-widest uppercase">${lang}</span>
                <span class="copy-btn cursor-pointer hover:text-white transition-colors font-bold" onclick="window.copyCode(event, '${id}')">
                    <i class="fas fa-clone mr-1"></i> COPIAR
                </span>
            </div>
            <pre id="${id}" class="p-4 overflow-x-auto text-gray-300 font-mono text-sm leading-relaxed whitespace-pre"><code>${code}</code></pre>
        </div>
    `;
};

// Configurar marked con el renderer
marked.use({
    renderer: renderer,
    gfm: true, // GitHub Flavored Markdown
    breaks: false // Evitar saltos de línea forzados por retornos de carro
});

/**
 * Formatea la respuesta del modelo usando Marked y DOMPurify.
 * @param {string} text - El texto crudo de la respuesta.
 * @returns {string} HTML formateado y saneado.
 */
export function formatResponse(text) {
    if (!text) return "";

    // 1. Parsear Markdown a HTML
    const rawHtml = marked.parse(text);

    // 2. Sanear HTML para evitar XSS
    // Permitimos atributos específicos necesarios para el resaltado y estructura
    const cleanHtml = DOMPurify.sanitize(rawHtml, {
        ADD_ATTR: ['target', 'onclick', 'id', 'class'], // onclick necesario para el botón de copia (aunque idealmente sería event delegation, mantenemos compatibilidad con window.copyCode)
        ADD_TAGS: ['i', 'button'] // Etiquetas necesarias para los iconos y botones
    });

    return cleanHtml;
}

/**
 * Copia el contenido de un bloque de código al portapapeles.
 * @param {Event} e - El evento del click.
 * @param {string} id - El ID del elemento pre.
 */
export function copyCode(e, id) {
    const element = document.getElementById(id);
    if (!element) return;

    const text = element.innerText;
    navigator.clipboard.writeText(text);
    const btn = e.currentTarget;
    const originalContent = btn.innerHTML;

    btn.innerHTML = '<i class="fas fa-check text-green-500"></i> COPIADO';
    setTimeout(() => btn.innerHTML = originalContent, 2000);
}

/**
 * Copia el contenido de un mensaje de AI al portapapeles.
 * @param {HTMLElement} btn - El botón que disparó el evento.
 */
export function copyToClipboard(btn) {
    // Buscar el contenedor del mensaje.
    // Estructura: button -> div (group) -> [div (mensaje), button]
    const group = btn.closest('.group');
    if (!group) return;

    // El contenido está en .content-area dentro del primer hijo del group o buscando por clase
    const contentArea = group.querySelector('.content-area');
    if (contentArea) {
        const text = contentArea.innerText; // Copia texto plano
        navigator.clipboard.writeText(text);
        const originalContent = btn.innerHTML;

        btn.innerHTML = '<i class="fas fa-check"></i> COPIADO';
        setTimeout(() => btn.innerHTML = originalContent, 2000);
    }
}
