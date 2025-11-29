// Gemini AI integration for health analysis
const GEMINI_API_KEY = process.env.GEMINI_API_KEY

export async function callGemini(prompt: string, imageBase64?: string): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY not configured")
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`

  const parts: Array<{ text: string } | { inline_data: { mime_type: string; data: string } }> = [{ text: prompt }]

  // Add image if provided
  if (imageBase64) {
    // Extract mime type and base64 data
    const matches = imageBase64.match(/^data:([^;]+);base64,(.+)$/)
    if (matches) {
      parts.unshift({
        inline_data: {
          mime_type: matches[1],
          data: matches[2],
        },
      })
    }
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [
        {
          parts,
        },
      ],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
      },
      safetySettings: [
        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
      ],
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error("Gemini API error:", errorText)
    throw new Error(`Gemini API error: ${response.status}`)
  }

  const data = await response.json()

  if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
    return data.candidates[0].content.parts[0].text
  }

  throw new Error("No response from Gemini")
}

export function cleanGeminiResponse(response: string): string {
  // Remove markdown code blocks if present
  let cleaned = response.trim()

  // Remove \`\`\`json or \`\`\` at the start
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.slice(7)
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.slice(3)
  }

  // Remove \`\`\` at the end
  if (cleaned.endsWith("```")) {
    cleaned = cleaned.slice(0, -3)
  }

  return cleaned.trim()
}

export function buildAnalysisPrompt(
  vitals: { heartRate: number; systolic: number; diastolic: number; spo2: number; temperature: number },
  symptoms: string[],
  scores: Record<string, number>,
  hasImage: boolean,
): string {
  return `You are an expert medical AI assistant for a Digital Health Twin application. Analyze the following health data and provide a comprehensive assessment.

PATIENT DATA:
- Heart Rate: ${vitals.heartRate} BPM
- Blood Pressure: ${vitals.systolic}/${vitals.diastolic} mmHg
- Oxygen Saturation (SpO2): ${vitals.spo2}%
- Body Temperature: ${vitals.temperature}°F
- Reported Symptoms: ${symptoms.length > 0 ? symptoms.join(", ") : "None reported"}

ML RISK SCORES:
- Cardiac Risk: ${scores.cardiac}%
- Respiratory Risk: ${scores.respiratory}%
- Infection Risk: ${scores.infection}%
- Stress Risk: ${scores.stress}%
- Neurological Risk: ${scores.neurological}%

${hasImage ? "A medical scan image has also been provided for analysis." : ""}

Please provide your response in the following JSON format (respond ONLY with valid JSON, no markdown):
{
  "explanation": "A detailed 3-4 sentence explanation of the patient's health status based on vitals, symptoms, and risk scores. Be specific about what the numbers mean.",
  "imageAnalysis": ${hasImage ? '"Detailed analysis of the provided medical image, noting any visible abnormalities, areas of concern, or normal findings. Be specific about what you observe."' : "null"},
  "precautions": ["5 specific precautions or recommendations based on the analysis"],
  "seekHelpWhen": "A clear description of warning signs that should prompt immediate medical attention",
  "doctorQuestions": ["5 specific questions the patient should ask their doctor based on this analysis"]
}`
}

export function buildChatPrompt(
  message: string,
  context?: {
    scores?: Record<string, number>
    vitals?: { heartRate: number; systolic: number; diastolic: number; spo2: number; temperature: number }
    symptoms?: string[]
    imageAnalysis?: string
  },
): string {
  return `You are a helpful and empathetic medical AI assistant for a Digital Health Twin application. You provide evidence-based health information while being careful to note that you are not a replacement for professional medical advice.

${
  context
    ? `PATIENT CONTEXT:
${
  context.vitals
    ? `- Heart Rate: ${context.vitals.heartRate} BPM
- Blood Pressure: ${context.vitals.systolic}/${context.vitals.diastolic} mmHg
- SpO2: ${context.vitals.spo2}%
- Temperature: ${context.vitals.temperature}°F`
    : ""
}
${context.symptoms?.length ? `- Symptoms: ${context.symptoms.join(", ")}` : ""}
${context.scores ? `- Risk Scores: Cardiac ${context.scores.cardiac}%, Respiratory ${context.scores.respiratory}%, Infection ${context.scores.infection}%, Stress ${context.scores.stress}%, Neurological ${context.scores.neurological}%` : ""}
${context.imageAnalysis ? `- Previous Image Analysis: ${context.imageAnalysis}` : ""}
`
    : "No previous analysis available."
}

USER MESSAGE: ${message}

Provide a helpful, conversational response that:
1. Directly addresses their question
2. References their health data when relevant
3. Provides actionable advice when appropriate
4. Reminds them to consult a healthcare professional for medical concerns
5. Is warm and supportive in tone

Keep your response concise but thorough (2-4 paragraphs max).`
}
