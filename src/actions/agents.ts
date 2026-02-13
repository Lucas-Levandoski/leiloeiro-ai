'use server'

import OpenAI from 'openai';
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

// Agent 2: LLM Connection for Property Extraction
export async function extractPropertiesFromText(text: string) {
  if (!process.env.OPENAI_API_KEY) {
    return { success: false, error: 'OpenAI API Key is not configured' };
  }

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const prompt = `
    You are a data extraction agent.
    Extract the following properties from the provided text:
    1. Price (current price, starting bid, or main price mentioned)
    2. Estimated Price (valuation, market value, or appraisal value)

    Return the result strictly as a JSON object with the following keys:
    - price: string or number (null if not found)
    - estimatedPrice: string or number (null if not found)
    
    Text content:
    ${text.substring(0, 50000)}
  `;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are a helpful assistant that extracts structured data from text. Respond with valid JSON only." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
    });

    const content = response.choices[0].message.content;
    if (!content) {
      return { success: false, error: 'No content returned from LLM' };
    }
    
    const data = JSON.parse(content);
    return { success: true, data };
  } catch (error) {
    console.error('Error extracting properties:', error);
    return { success: false, error: 'Failed to extract properties' };
  }
}
