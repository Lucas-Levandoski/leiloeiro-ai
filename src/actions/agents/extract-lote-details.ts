'use server'

import OpenAI from 'openai';

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
    28. Risk Analysis (Identify potential risks such as "Ocupado", "Ações Judiciais", "Dívidas", "Problemas na Matrícula", etc. Return a short explanation of why it is risky in Portuguese (pt-BR).)
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
        { role: "system", content: "You are a helpful assistant that extracts structured data. Respond with valid JSON only. Always use Portuguese (pt-BR) for descriptions and analysis." },
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
