'use server'

const PDFParser = require('pdf2json');

// Agent 1: PDF to Text (OCR/Extraction)
export async function extractTextFromPDF(formData: FormData) {
  const file = formData.get('file') as File;
  
  if (!file) {
    return { success: false, error: 'No file uploaded' };
  }

  if (file.type !== 'application/pdf') {
    return { success: false, error: 'File must be a PDF' };
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Promisify the event-based pdf2json
    const text = await new Promise<string>((resolve, reject) => {
        const pdfParser = new PDFParser(null, 1); // 1 = text content
        
        pdfParser.on("pdfParser_dataError", (errData: any) => {
            reject(new Error(errData.parserError));
        });

        pdfParser.on("pdfParser_dataReady", (pdfData: any) => {
            // pdf2json returns raw content, usually simpler to rely on its raw text output mode
            // But 'getRawTextContent' is reliable
            try {
                const rawText = pdfParser.getRawTextContent();
                resolve(rawText);
            } catch (e) {
                reject(e);
            }
        });

        pdfParser.parseBuffer(buffer);
    });
    
    // Basic cleaning
    const cleanedText = text.trim();
    
    if (cleanedText.length === 0) {
      return { success: false, error: 'No text extracted. The PDF might be an image/scanned document.' };
    }

    return { success: true, text: cleanedText };
  } catch (error) {
    console.error('Error parsing PDF:', error);
    return { success: false, error: 'Failed to parse PDF' };
  }
}
