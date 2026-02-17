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
    
    // Parse page range if provided
    const pageRangeStr = formData.get('pages') as string;
    let pageRangeSet: Set<number> | null = null;
    
    if (pageRangeStr && pageRangeStr.trim()) {
        pageRangeSet = new Set<number>();
        const parts = pageRangeStr.split(',');
        for (const part of parts) {
            const trimmed = part.trim();
            if (trimmed.includes('-')) {
                const [start, end] = trimmed.split('-').map(Number);
                if (!isNaN(start) && !isNaN(end)) {
                    for (let i = start; i <= end; i++) pageRangeSet.add(i);
                }
            } else {
                const page = Number(trimmed);
                if (!isNaN(page)) pageRangeSet.add(page);
            }
        }
    }

    // Promisify the event-based pdf2json
    const text = await new Promise<string>((resolve, reject) => {
        const pdfParser = new PDFParser(null, 1); // 1 = text content
        
        pdfParser.on("pdfParser_dataError", (errData: any) => {
            reject(new Error(errData.parserError));
        });

        pdfParser.on("pdfParser_dataReady", (pdfData: any) => {
            try {
                if (!pageRangeSet || pageRangeSet.size === 0) {
                    // Default behavior: extract all text
                    const rawText = pdfParser.getRawTextContent();
                    resolve(rawText);
                } else {
                    // Extract text only from selected pages
                    let extractedText = "";
                    const pages = pdfData.formImage.Pages;
                    
                    pages.forEach((page: any, index: number) => {
                        const pageNum = index + 1;
                        if (pageRangeSet!.has(pageNum)) {
                            // Extract text from this page
                            // Sort texts by y then x to ensure reading order
                            const texts = page.Texts.sort((a: any, b: any) => {
                                if (Math.abs(a.y - b.y) < 0.5) return a.x - b.x; // Same line
                                return a.y - b.y;
                            });
                            
                            texts.forEach((textItem: any) => {
                                textItem.R.forEach((run: any) => {
                                    extractedText += decodeURIComponent(run.T) + " ";
                                });
                            });
                            extractedText += "\n\n"; // Page separator
                        }
                    });
                    
                    resolve(extractedText);
                }
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
