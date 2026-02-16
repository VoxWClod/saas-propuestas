/**
 * Utility functions for downloading proposals in different formats
 */

/**
 * Download a .docx file from base64 string
 */
export function downloadAsDocx(file64: string, fileName: string) {
    try {
        // Decode base64 to binary
        const binaryString = atob(file64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }

        // Create blob and download
        const blob = new Blob([bytes], {
            type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        });

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${fileName}.docx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Error downloading DOCX:', error);
        throw new Error('No se pudo descargar el archivo DOCX');
    }
}

/**
 * Convert HTML to DOCX and download
 */
export async function downloadHtmlAsDocx(htmlContent: string, fileName: string) {
    try {
        // Get library from window (loaded via script tag in index.html)
        // @ts-ignore
        const htmlDocx = window.htmlDocx;

        if (!htmlDocx) {
            throw new Error('La librería html-docx.js no está cargada. Recarga la página.');
        }

        // PRE-PROCESSING: Remove !important as it breaks some DOCX parsers
        let processedHtml = htmlContent.replace(/!important/g, '');

        // FIX: Force text-align: left globally for DOCX
        // Word justification creates huge gaps on short lines.
        processedHtml = processedHtml.replace(/text-align:\s*justify/g, 'text-align: left');

        // Ensure strong tags are safe (optional but good practice)
        processedHtml = processedHtml.replace(/<strong>/g, '<b>').replace(/<\/strong>/g, '</b>');

        // Wrap HTML with proper document structure and basic styles
        const fullHtml = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: 'Arial', sans-serif; font-size: 11pt; line-height: 1.5; color: #000000; }
                    h1 { text-align: center; font-size: 18pt; margin-bottom: 1em; }
                    h2 { font-size: 16pt; margin-top: 1em; margin-bottom: 0.5em; text-align: left; }
                    h3 { font-size: 14pt; margin-top: 1em; margin-bottom: 0.5em; text-align: left; }
                    p { margin: 0.5em 0; text-align: left; } /* FORCE LEFT ALIGNMENT */
                    ul, ol { margin-left: 0; padding-left: 20px; }
                    li { margin-bottom: 0.25em; text-align: left; }
                    b, strong { font-weight: bold; }
                    a { color: #0000FF; text-decoration: underline; }
                </style>
            </head>
            <body>
                ${processedHtml}
            </body>
            </html>
        `;

        // Convert HTML to DOCX
        const docx = htmlDocx.asBlob(fullHtml);

        // Download
        const url = URL.createObjectURL(docx);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${fileName}.docx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Error converting HTML to DOCX:', error);
        throw new Error('No se pudo generar el archivo DOCX: ' + (error as Error).message);
    }
}

/**
 * Download HTML content as PDF using html2pdf.js
 * Note: Requires html2pdf.js to be installed
 */
export async function downloadAsPDF(htmlContent: string, fileName: string) {
    try {
        // Dynamic import of html2pdf
        const html2pdf = (await import('html2pdf.js')).default;

        // Create a temporary div with the content
        const element = document.createElement('div');
        element.innerHTML = htmlContent;
        element.style.fontFamily = 'Arial, sans-serif';
        element.style.fontSize = '11pt';
        element.style.lineHeight = '1.6';
        element.style.color = '#000000';
        element.style.padding = '40px';

        // Configure PDF options
        const opt = {
            margin: [20, 20, 20, 20], // 2cm margins
            filename: `${fileName}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'mm', format: 'letter', orientation: 'portrait' },
            pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
        };

        // Generate and download PDF
        // @ts-ignore
        await html2pdf().set(opt).from(element).save();
    } catch (error) {
        console.error('Error downloading PDF:', error);
        throw new Error('No se pudo generar el archivo PDF. Asegúrate de que html2pdf.js esté instalado.');
    }
}
