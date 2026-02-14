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

// Agent 3: Lote Detail Extraction
export async function extractLoteDetails(loteText: string, globalContext?: any) {
  if (!process.env.OPENAI_API_KEY) {
    return { success: false, error: 'OpenAI API Key is not configured' };
  }

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const prompt = `
    You are a real estate data specialist.
    Analyze the text for a specific "Lote" (Lot) from an auction.
    
    Extract the following details:
    1. City
    2. State (UF)
    3. Type (Casa, Apartamento, Terreno, Comercial, Veículo, etc.)
    4. Size/Area (if applicable)
    5. Address
    6. Price (Initial bid or valuation)
    7. Auction Prices (Extract specific prices for "1º Leilão", "2º Leilão", etc. if available)
    8. Full Description (The EXACT RAW TEXT of the description. Do not rewrite, summarize or fix typos. Keep uppercase letters.)
    
    Also extract these specific optional properties if available:
    9. Street Name (Logradouro)
    10. Number
    11. Complement (Casa X, Apto Y, etc.)
    12. Neighborhood (Bairro)
    13. Zip Code (CEP)
    14. Lot Number (Lote)
    15. Block (Quadra)
    16. Condominium Name
    17. Subdivision Name (Loteamento)
    18. Parking Spaces (Vagas de garagem)
    19. Private Area (Área privativa)
    20. Total Area (Área total)
    21. Land Area (Área de terreno)
    22. Ideal Fraction (Fração ideal)
    23. Registry ID (Matrícula)
    24. Registry Office (Cartório / RI)
    25. City Registration ID (Inscrição Municipal / IPTU)
    26. Occupancy Status (Ocupado/Desocupado)
    27. Legal Actions (List of legal processes mentioned)
    28. Risk Analysis (Identify potential risks such as "Ocupado", "Ações Judiciais", "Dívidas", "Problemas na Matrícula", etc. Return a short explanation of why it is risky.)
    29. Risk Level (Classify the risk level as "high", "medium", or "low".)
        - "high": Occupied, has active legal actions blocking sale, debts higher than value, or major structural issues.
        - "medium": Minor debts, registration issues that can be solved, or lack of clear information.
        - "low": Vacant (Desocupado), clear documents, no major debts.

    Construct a "title" for this Lote using the pattern: "Lote {number} - {Type} {City} {State}".
    If the number is not in the text, use a generic identifier.
    
    Return JSON:
    {
      "title": "string",
      "city": "string",
      "state": "string",
      "type": "string",
      "size": "string",
      "address": "string",
      "price": "string",
      "estimatedPrice": "string",
      "auction_prices": [
        { "label": "string (e.g. 1º Leilão)", "value": "string (e.g. R$ 100.000,00)" }
      ],
      "description": "string (The EXACT RAW TEXT from the source)",
      "address_street": "string or null",
      "address_number": "string or null",
      "address_complement": "string or null",
      "address_zip": "string or null",
      "neighborhood": "string or null",
      "lot": "string or null",
      "block": "string or null",
      "condominium_name": "string or null",
      "subdivision_name": "string or null",
      "parking_spaces": "string or null",
      "area_private": "string or null",
      "area_total": "string or null",
      "area_land": "string or null",
      "ideal_fraction": "string or null",
      "registry_id": "string or null",
      "registry_office": "string or null",
      "city_registration_id": "string or null",
      "occupancy_status": "string or null",
      "legal_actions": ["string"],
      "risk_analysis": "string or null",
      "risk_level": "high" | "medium" | "low"
    }

    Lote Text:
    ${loteText}
  `;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are a helpful assistant that extracts structured data. Respond with valid JSON only." },
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
    console.error('Error extracting lote details:', error);
    return { success: false, error: 'Failed to extract lote details' };
  }
}

// Agent 4: Matricula Extraction
export async function extractMatriculaData(text: string) {
  if (!process.env.OPENAI_API_KEY) {
    return { success: false, error: 'OpenAI API Key is not configured' };
  }

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const prompt = `
    You are a legal expert in Brazilian real estate registry documents (Matrículas de Imóveis).
    Analyze the provided text from a "Matrícula" and extract the following information.
    
    For boolean fields (checkboxes), return true if the condition is present/mentioned in the document, false otherwise.
    For text fields, extract the specific information requested.

    Fields to extract:
    1. Penhora judicial (Boolean: is there any "Penhora" recorded?)
    2. Arresto (Boolean: is there any "Arresto" recorded?)
    3. Usufruto (Boolean: is there any "Usufruto" recorded?)
    4. Cláusulas restritivas (Boolean: are there any restrictive clauses like "Inalienabilidade", "Impenhorabilidade", "Incomunicabilidade"?)
    5. Indisponibilidade (Boolean: is there any "Indisponibilidade" recorded?)
    6. Registro de Alienação Fiduciária (String: List all "Alienação Fiduciária" registrations (e.g., "R-5", "R-10"). If none, return null.)
    7. Contrato identificado (String: Extract any specific contract number mentioned related to debts/liens. If none, return null.)
    8. Banco credor identificado (String: Name of the bank/creditor if mentioned in liens/debts. If none, return null.)
    9. CPF dos devedores (String: List of CPFs of debtors found. If none, return null.)
    10. Data do 1º leilão (String: Extract date if mentioned in an "Averbação" (AV). If none, return null.)
    11. Data do 2º leilão (String: Extract date if mentioned in an "Averbação" (AV). If none, return null.)
    12. Indicação expressa de procedimento extrajudicial (Boolean: Is it explicitly mentioned that the procedure is extrajudicial?)

    Return result strictly as JSON:
    {
      "penhora_judicial": boolean,
      "arresto": boolean,
      "usufruto": boolean,
      "clausulas_restritivas": boolean,
      "indisponibilidade": boolean,
      "alienacao_fiduciaria": "string or null",
      "contrato": "string or null",
      "credor": "string or null",
      "cpf_devedores": "string or null",
      "data_primeiro_leilao": "string or null",
      "data_segundo_leilao": "string or null",
      "procedimento_extrajudicial": boolean
    }

    Text content:
    ${text.substring(0, 50000)}
  `;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are a helpful assistant that extracts structured data from legal documents. Respond with valid JSON only." },
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
    console.error('Error extracting matricula data:', error);
    return { success: false, error: 'Failed to extract matricula data' };
  }
}

// Agent 5: Risk Analysis
export async function analyzeRisk(loteDetails: any, matriculaData: any) {
  if (!process.env.OPENAI_API_KEY) {
    return { success: false, error: 'OpenAI API Key is not configured' };
  }

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const prompt = `
    You are a real estate risk assessment expert.
    Analyze the risk of acquiring this property based on the Lote Details and the Matricula (Registry) Analysis.
    
    Lote Details:
    ${JSON.stringify(loteDetails, null, 2).substring(0, 10000)}
    
    Matricula Analysis:
    ${JSON.stringify(matriculaData, null, 2)}
    
    Task:
    1. Evaluate the overall risk level (high, medium, low).
    2. Provide a detailed risk analysis explanation.
    
    Risk Criteria:
    - High Risk: Occupied property (Ocupado), active legal actions (penhora, arresto, indisponibilidade) that are not cleared, large debts, structural issues.
    - Medium Risk: Minor debts, unclear occupancy, solvable registration issues.
    - Low Risk: Vacant (Desocupado), clear title, no major debts.
    
    Return JSON:
    {
        "risk_level": "high" | "medium" | "low",
        "risk_analysis": "string"
    }
  `;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are a helpful assistant that evaluates real estate risk. Respond with valid JSON only." },
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
    console.error('Error analyzing risk:', error);
    return { success: false, error: 'Failed to analyze risk' };
  }
}

