'use server'

import OpenAI from 'openai';

interface Discrepancy {
  field: string;
  editalValue: string;
  matriculaValue: string;
  severity: 'high' | 'medium' | 'low';
  message: string;
  isRelevant?: boolean;
}

export async function compareLoteData(loteDetails: any, matriculaData: any) {
  if (!process.env.OPENAI_API_KEY) {
    return { success: false, error: 'OpenAI API Key is not configured' };
  }

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const prompt = `
    You are a real estate auditor.
    Compare the data from an Auction Notice (Edital/Lote) with the data from the Property Registry (Matrícula).
    
    Identify any significant discrepancies that could pose a risk to the buyer.
    Ignore minor differences in formatting (e.g., "100m²" vs "100 m2", "Caixa" vs "Caixa Econômica Federal").
    Focus on:
    1. Areas (Total, Private, Land) - Check if they match within a reasonable margin.
    2. Dates of Auction - If the matricula mentions dates, do they match the edital?
    3. Matricula Number - Does the edital mention the correct matricula number?
    4. Creditor/Bank - Is the seller the same as the creditor listed in the matricula?
    5. Legal Status - If the edital says "Occupied" but matricula implies otherwise (or vice versa, though matricula usually doesn't say occupancy).
    6. Owners - Does the edital mention the same owner/debtor as the matricula?

    IMPORTANT: The "field" property in the output MUST be in Portuguese (pt-BR).
    Examples of field names: "Área Total", "Área Privativa", "Área do Terreno", "Número da Matrícula", "Proprietário", "Ocupação", "Credor", "Datas do Leilão".

    Lote Data (Edital):
    ${JSON.stringify(loteDetails, null, 2)}

    Matricula Data:
    ${JSON.stringify(matriculaData, null, 2)}

    Return a JSON object with a list of discrepancies.
    If no discrepancies are found, return an empty list.

    Output format:
    {
      "discrepancies": [
        {
          "field": "Field Name in Portuguese (e.g., Área Total)",
          "editalValue": "Value in Edital",
          "matriculaValue": "Value in Matricula",
          "severity": "high" | "medium" | "low",
          "message": "Explanation of the mismatch in Portuguese (pt-BR)"
        }
      ]
    }
  `;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are a helpful assistant that compares data. Respond with valid JSON only." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
    });

    const content = response.choices[0].message.content;
    if (!content) {
      return { success: false, error: 'No content returned from LLM' };
    }
    
    const data = JSON.parse(content);
    return { success: true, data: data.discrepancies };
  } catch (error) {
    console.error('Error comparing data:', error);
    return { success: false, error: 'Failed to compare data' };
  }
}
