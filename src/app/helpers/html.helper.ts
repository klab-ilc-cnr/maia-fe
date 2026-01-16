import { decode } from 'html-entities';

/**
 * Helper class for HTML manipulation utilities
 */
export class HtmlHelper {
  /**
   * Rimuove i tag HTML e decodifica le entità HTML da una stringa
   * @param htmlString {string | undefined | null} stringa contenente HTML
   * @returns {string} testo pulito senza tag HTML
   */
  static stripHtml(htmlString: string | undefined | null): string {
    if (!htmlString) return '';
    
    try {
      // Decodifica le entità HTML (es. &lt; -> <, &gt; -> >)
      // Gestisce anche il caso di doppia codifica
      let decoded = decode(htmlString);
      
      // Se dopo la decodifica ci sono ancora entità HTML, prova a decodificare di nuovo
      if (decoded.includes('&lt;') || decoded.includes('&gt;') || decoded.includes('&amp;')) {
        decoded = decode(decoded);
      }
      
      // Rimuove tutti i tag HTML
      const textOnly = decoded.replace(/<[^>]*>/g, '');
      
      // Decodifica eventuali entità HTML rimanenti nel testo (es. &nbsp; -> spazio)
      return decode(textOnly).trim();
    } catch (error) {
      // In caso di errore, restituisce la stringa originale senza tag HTML
      return htmlString.replace(/<[^>]*>/g, '').trim();
    }
  }
}
