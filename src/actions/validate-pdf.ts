'use server'

const PDFParser = require('pdf2json');

export async function validatePDFPageCount(formData: FormData): Promise<{ success: boolean, pageCount?: number, error?: string }> {
  const file = formData.get('file') as File;
  
  if (!file) {
    return { success: false, error: 'Nenhum arquivo enviado' };
  }

  if (file.type !== 'application/pdf') {
    return { success: false, error: 'O arquivo deve ser um PDF' };
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Using require means we might not have types, so we cast to any for the parser
    const pageCount = await new Promise<number>((resolve, reject) => {
        const pdfParser = new PDFParser();
        
        pdfParser.on("pdfParser_dataError", (errData: any) => {
            reject(new Error(errData.parserError));
        });

        pdfParser.on("pdfParser_dataReady", (pdfData: any) => {
            // pdfData.Pages is an array of pages or sometimes pdfData.formImage.Pages depending on version/options
            // But usually the structure is { Pages: [...] } for raw parsing
            // Let's check both potential structures to be safe, though standard usage gives formImage
            const pages = pdfData.Pages || (pdfData.formImage && pdfData.formImage.Pages);
            if (Array.isArray(pages)) {
                resolve(pages.length);
            } else {
                // Fallback: try to find any array that looks like pages or just default to 0 if structure is unexpected
                resolve(0);
            }
        });

        pdfParser.parseBuffer(buffer);
    });
    
    return { success: true, pageCount };
  } catch (error) {
    console.error('Error parsing PDF for page count:', error);
    return { success: false, error: 'Falha ao processar o PDF' };
  }
}
