/**
 * Response Processor ("The Customs")
 * Módulo especializado en la normalización y blindaje de respuestas de IA.
 * Identidad agnóstica para soportar múltiples modelos (Qwen, Kimi, etc.)
 */

export class ResponseProcessor {
    /**
     * Procesa el texto crudo de la API para garantizar integridad y seguridad.
     * @param {string} text - El texto crudo.
     * @returns {string} Texto procesado y normalizado.
     */
    static process(text) {
        if (!text) return "";

        let processed = text;

        // 0. FILTRO DE PENSAMIENTO (Kimi-K2 Thinking)
        // Eliminamos bloques de razonamiento interno para que solo el ensayo final llegue al usuario
        processed = processed.replace(/<thought>[\s\S]*?<\/thought>/gi, '').trim();
        processed = processed.replace(/<reasoning>[\s\S]*?<\/reasoning>/gi, '').trim();

        // 1. NORMALIZACIÓN DE ENTIDADES
        // Si el modelo ya escapó caracteres, los revertimos temporalmente 
        // para que nuestro parser (marked + renderer) tenga el control absoluto y uniforme.
        processed = processed
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/&amp;/g, '&');

        // 2. AUTO-CIERRE DE BLOQUES DE CÓDIGO
        const backtickCount = (processed.match(/```/g) || []).length;
        if (backtickCount % 2 !== 0) {
            processed += "\n```";
        }

        // 3. DETECCIÓN AUTOMÁTICA DE LENGUAJE
        processed = processed.replace(/```\s*\n([\s\S]*?)```/g, (match, content) => {
            if (content.trim().startsWith('<') || content.includes('<!DOCTYPE') || content.includes('</html>')) {
                return "```html\n" + content + "```";
            }
            if (content.includes('const ') || content.includes('let ') || content.includes('function') || content.includes('=>')) {
                return "```javascript\n" + content + "```";
            }
            return match;
        });

        // 4. AUTO-CIERRE DE ETIQUETAS HTML
        const tagsToClose = ['div', 'span', 'p', 'section', 'article'];
        tagsToClose.forEach(tag => {
            const openReg = new RegExp(`<${tag}[^>]*>`, 'g');
            const closeReg = new RegExp(`</${tag}>`, 'g');
            const openCount = (processed.match(openReg) || []).length;
            const closeCount = (processed.match(closeReg) || []).length;

            if (openCount > closeCount) {
                processed += `</${tag}>`.repeat(openCount - closeCount);
            }
        });

        // 5. FILTRO DE CONFLICTOS CSS (Inert by Design)
        processed = processed.replace(/class=["'](.*?)["']/g, (match, classes) => {
            const forbiddenClasses = ['code-block', 'chat-box', 'copy-btn', 'sidebar', 'header'];
            let newClasses = classes.split(' ').map(c => {
                return forbiddenClasses.includes(c) ? `ai-${c}` : c;
            }).join(' ');
            return `class="${newClasses}"`;
        });

        return processed;
    }
}
