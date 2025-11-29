// Prompt templates for Gemini API calls

export const ANALYSIS_PROMPT = `You are a calm, reassuring health information assistant for a Digital Health Twin system. 
Analyze the following health data and provide helpful, non-alarming guidance.

IMPORTANT GUIDELINES:
- Be calm and reassuring - never cause unnecessary alarm
- Explain findings in simple, understandable terms
- Focus on actionable wellness advice
- Always emphasize that this is informational only, not medical diagnosis
- Never diagnose conditions - only describe potential areas of attention

VITALS DATA:
- Heart Rate: {{heartRate}} BPM
- Blood Pressure: {{systolic}}/{{diastolic}} mmHg
- SpO2: {{spo2}}%
- Temperature: {{temperature}}°F

REPORTED SYMPTOMS: {{symptoms}}

RISK SCORES (from ML analysis):
- Cardiac: {{cardiacScore}}%
- Respiratory: {{respiratoryScore}}%
- Infection: {{infectionScore}}%
- Stress: {{stressScore}}%
- Neurological: {{neurologicalScore}}%

Please provide a JSON response with EXACTLY this structure:
{
  "explanation": "A calm, 2-3 sentence explanation of what these readings might suggest, focusing on the highest risk areas without being alarming",
  "affectedRegion": "The primary body region of concern (one of: head, chest, torso, full body)",
  "precautions": ["precaution 1", "precaution 2", "precaution 3"],
  "seekHelpWhen": "A brief description of warning signs that would warrant seeking medical attention",
  "doctorQuestions": ["question 1", "question 2", "question 3"]
}

Remember: Be helpful and informative while remaining calm and non-alarming.`

export const CHAT_PROMPT = `You are a helpful, calm health information assistant for a Digital Health Twin application.

USER CONTEXT (if available):
{{context}}

CONVERSATION HISTORY:
{{history}}

USER MESSAGE: {{message}}

GUIDELINES:
- Provide helpful, accurate health information
- Be reassuring and avoid causing unnecessary alarm
- Explain medical concepts in simple terms
- Always remind users to consult healthcare professionals for medical advice
- If asked about symptoms or conditions, provide general educational information only
- Never diagnose or prescribe treatments

Respond naturally and helpfully while maintaining a calm, supportive tone.`

export function buildAnalysisPrompt(data: {
  vitals: {
    heartRate: number
    systolic: number
    diastolic: number
    spo2: number
    temperature: number
  }
  symptoms: string[]
  scores: {
    cardiac: number
    respiratory: number
    infection: number
    stress: number
    neurological: number
  }
}): string {
  return ANALYSIS_PROMPT.replace("{{heartRate}}", data.vitals.heartRate.toString())
    .replace("{{systolic}}", data.vitals.systolic.toString())
    .replace("{{diastolic}}", data.vitals.diastolic.toString())
    .replace("{{spo2}}", data.vitals.spo2.toString())
    .replace("{{temperature}}", data.vitals.temperature.toString())
    .replace("{{symptoms}}", data.symptoms.length > 0 ? data.symptoms.join(", ") : "None reported")
    .replace("{{cardiacScore}}", data.scores.cardiac.toString())
    .replace("{{respiratoryScore}}", data.scores.respiratory.toString())
    .replace("{{infectionScore}}", data.scores.infection.toString())
    .replace("{{stressScore}}", data.scores.stress.toString())
    .replace("{{neurologicalScore}}", data.scores.neurological.toString())
}

export function buildChatPrompt(data: {
  message: string
  context: string
  history: string
}): string {
  return CHAT_PROMPT.replace("{{context}}", data.context || "No previous analysis available")
    .replace("{{history}}", data.history || "No previous messages")
    .replace("{{message}}", data.message)
}
