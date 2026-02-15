import DOMPurify from 'dompurify';
import { marked } from 'marked';

// Configurar renderer personalizado para marked
const renderer = new marked.Renderer();

// Custom code block renderer para mantener el estilo y botón de copia
renderer.code = function (code, language) {
    const id = 'code-' + Math.random().toString(36).substr(2, 9);
    const lang = (language || 'TEXTO').toUpperCase();

    // Escapado Final de Seguridad: Asegurar que el contenido sea 100% inerte
    const finalEscape = (str) => {
        return str.replace(/[&<>"']/g, (m) => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[m]));
    };

    const safeCode = finalEscape(code);

    return `
        <div class="code-block my-6 rounded-lg overflow-hidden border border-gray-700 bg-[#0d0d0d] shadow-2xl">
            <div class="code-header flex justify-between items-center px-4 py-2 bg-[#1a1a1a] border-b border-gray-700 text-yellow-500 text-[10px] font-black tracking-widest uppercase">
                <span>${lang}</span>
                <span class="copy-btn cursor-pointer hover:text-white transition-all flex items-center gap-1.5" onclick="window.copyCode(event, '${id}')">
                    <i class="fas fa-clone"></i> COPIAR
                </span>
            </div>
            <pre id="${id}" class="p-4 overflow-x-auto text-gray-300 font-mono text-sm leading-relaxed whitespace-pre !important" style="white-space: pre !important;"><code style="font-family: 'Fira Code', monospace !important;">${safeCode}</code></pre>
        </div>
    `;
};

// Configurar marked con el renderer
marked.use({
    renderer: renderer,
    gfm: true,
    breaks: false,
    headerIds: false,
    mangle: false
});

/**
 * Pre-procesa el Markdown para cerrar bloques huérfanos y pre-escapar contenido técnico.
 * @param {string} text - El texto crudo de la IA.
 * @returns {string} Texto procesado y seguro.
 */
function preProcessMarkdown(text) {
    if (!text) return "";

    // 1. Cierre de Seguridad: Contar triple backticks para evitar fugas de CSS/Layout
    const backtickCount = (text.match(/```/g) || []).length;
    let processedText = text;
    if (backtickCount % 2 !== 0) {
        processedText += "\n```"; // Cerramos el bloque huérfano
    }

    // 2. Aislamiento Atómico: Escapar contenido dentro de bloques ``` antes de que marked lo toque
    // Esto garantiza que el parser reciba texto inerte.
    return processedText.replace(/```([\s\S]*?)```/g, (match, codeBlock) => {
        // No escapamos los ticks, solo el contenido interior
        // El renderer.code recibirá este contenido ya 'seguro'
        return "```" + codeBlock + "```";
        // Nota: marked.js llamará a renderer.code con el contenido del bloque.
        // Si escapamos AQUÍ, renderer.code recibirá entidades. 
        // Para evitar doble escapado, el renderer.code debe ser simplificado.
    });
}

/**
 * Formatea la respuesta del modelo usando Marked y DOMPurify.
 * @param {string} text - El texto crudo de la respuesta.
 * @returns {string} HTML formateado y saneado.
 */
export function formatResponse(text) {
    if (!text) return "";

    // 0. Pre-procesamiento Atómico y Cierre de Seguridad
    const safeMarkdown = preProcessMarkdown(text);

    // 0.1 Limpieza de caracteres no latinos (filtrar glifos extraños)
    const filteredText = safeMarkdown.replace(/[^\x00-\x7F\xC0-\xFF\u2010-\u2027\u2030-\u205E\u2122\u2115\u2124\u2112\u2111\u2102\u20AC]/g, '').trim();

    // 1. Parsear Markdown a HTML
    const rawHtml = marked.parse(filteredText);

    // 2. Sanear HTML para evitar XSS
    const cleanHtml = DOMPurify.sanitize(rawHtml, {
        ADD_ATTR: ['target', 'onclick', 'id', 'class', 'style'],
        ADD_TAGS: ['i', 'button']
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
