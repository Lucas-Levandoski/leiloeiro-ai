'use server'

import OpenAI from 'openai';

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
