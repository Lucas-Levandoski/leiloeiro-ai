'use server'

import OpenAI from 'openai';

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
