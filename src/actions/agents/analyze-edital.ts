'use server'

import OpenAI from 'openai';

// Agent 2 (Enhanced): Global Analysis & Lote Splitting
export async function analyzeEditalStructure(text: string) {
  if (!process.env.OPENAI_API_KEY) {
    return { success: false, error: 'OpenAI API Key is not configured' };
  }

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const prompt = `
    You are an expert legal document analyzer specializing in Brazilian auction notices ("editais").
    
    Your task is to analyze the provided text and:
    1. Identify Global Information: 
       - Bank/Seller Name (e.g., Caixa, Banco do Brasil, Santander, Justice Court, etc.)
       - Auction Dates & Times (1st Auction, 2nd Auction dates) -> MUST be an array of strings, e.g. ["1º Leilão: 10/10/2023 às 10h", "2º Leilão: 20/10/2023 às 10h"]
       - Auction Location/Website (Where it will happen)
       - Auctioneer Name
       - Edital Number
       - General Rules summary
    2. Identify and Split "Lotes": The text contains multiple items/businesses for sale, called "Lotes". 
       You must identify each one and extract the raw text describing it.

    Return the result strictly as a JSON object with the following structure:
    {
      "globalInfo": {
        "bankName": "string",
        "auctionDate": ["string", "string"],
        "auctionLocation": "string (URL or address)",
        "auctioneer": "string",
        "generalRules": "string (summary)",
        "editalNumber": "string"
      },
      "lotes": [
        {
          "id": "string (e.g., '1', '01', 'A')",
          "rawContent": "string (EXACT COPY of the text describing this lote, preserving all uppercase letters, line breaks and formatting. DO NOT summarize or alter.)"
        }
      ]
    }
    
    Text content:
    ${text.substring(0, 100000)}
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
    console.error('Error analyzing edital structure:', error);
    return { success: false, error: 'Failed to analyze edital structure' };
  }
}
