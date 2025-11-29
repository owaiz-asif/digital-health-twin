import { NextResponse } from "next/server"
import { callGemini, buildChatPrompt } from "@/lib/gemini"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { message, context } = body

    let response: string

    const useAI = process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.length > 10

    if (useAI) {
      try {
        const prompt = buildChatPrompt(message, context)
        response = await callGemini(prompt)
      } catch (aiError) {
        console.error("Gemini AI error, using fallback:", aiError)
        response = generateChatResponse(message, context)
      }
    } else {
      response = generateChatResponse(message, context)
    }

    return NextResponse.json({ response })
  } catch (error) {
    console.error("Chat error:", error)
    return NextResponse.json({ error: "Failed to process chat message" }, { status: 500 })
  }
}

function generateChatResponse(
  message: string,
  context?: {
    scores?: Record<string, number>
    vitals?: { heartRate: number; systolic: number; diastolic: number; spo2: number; temperature: number }
    symptoms?: string[]
    affectedRegion?: string
  },
) {
  const lowerMessage = message.toLowerCase()

  // Knowledge base for health topics
  const healthTopics: Record<string, string> = {
    heart_rate: `Heart rate (pulse) is the number of times your heart beats per minute. A normal resting heart rate for adults ranges from 60-100 beats per minute. Athletes may have lower resting rates (40-60 bpm). Factors affecting heart rate include physical activity, emotions, medications, body size, and temperature. ${context?.vitals?.heartRate ? `Your current reading of ${context.vitals.heartRate} bpm ${context.vitals.heartRate >= 60 && context.vitals.heartRate <= 100 ? "is within the normal range." : context.vitals.heartRate < 60 ? "is below typical resting range (bradycardia)." : "is above typical resting range (tachycardia)."}` : ""}`,

    blood_pressure: `Blood pressure is measured as systolic (pressure when heart beats) over diastolic (pressure between beats). Normal is typically below 120/80 mmHg. Elevated is 120-129/<80. High blood pressure Stage 1 is 130-139/80-89. ${context?.vitals ? `Your reading of ${context.vitals.systolic}/${context.vitals.diastolic} mmHg ${context.vitals.systolic < 120 && context.vitals.diastolic < 80 ? "is in the normal range." : context.vitals.systolic >= 140 || context.vitals.diastolic >= 90 ? "indicates elevated blood pressure that should be monitored." : "is slightly elevated - lifestyle modifications may help."}` : ""}`,

    oxygen: `Blood oxygen saturation (SpO2) measures how much oxygen your blood is carrying. Normal SpO2 is typically 95-100%. Below 95% may indicate respiratory issues. Below 90% is considered low and may require medical attention. ${context?.vitals?.spo2 ? `Your SpO2 of ${context.vitals.spo2}% ${context.vitals.spo2 >= 95 ? "is at a healthy level." : context.vitals.spo2 >= 90 ? "is slightly below optimal - monitor closely." : "is concerning and you should seek medical evaluation."}` : ""}`,

    temperature: `Normal body temperature averages around 98.6°F (37°C) but can range from 97°F to 99°F. A fever is generally considered 100.4°F (38°C) or higher. Temperature can vary based on time of day, activity, and where it's measured. ${context?.vitals?.temperature ? `Your temperature of ${context.vitals.temperature}°F ${context.vitals.temperature <= 99.5 && context.vitals.temperature >= 97 ? "is within normal range." : context.vitals.temperature > 99.5 ? "suggests you may have a fever." : "is below typical range."}` : ""}`,

    stress: `Stress can significantly impact your physical health, affecting heart rate, blood pressure, and immune function. Chronic stress is associated with increased risk of heart disease, digestive issues, and mental health challenges. Management techniques include regular exercise, adequate sleep, mindfulness practices, and maintaining social connections.`,

    sleep: `Quality sleep is essential for health. Adults typically need 7-9 hours per night. Poor sleep can affect heart health, immune function, mood, and cognitive performance. Good sleep hygiene includes maintaining a consistent schedule, limiting screen time before bed, keeping your room cool and dark, and avoiding caffeine late in the day.`,

    exercise: `Regular physical activity is crucial for cardiovascular health. The American Heart Association recommends at least 150 minutes of moderate aerobic activity or 75 minutes of vigorous activity per week. Exercise helps control weight, reduce stress, improve sleep, and strengthen the heart. Always consult a healthcare provider before starting a new exercise program if you have health concerns.`,

    diet: `A heart-healthy diet includes plenty of fruits, vegetables, whole grains, lean proteins, and healthy fats. Limit sodium, added sugars, and saturated fats. The DASH diet and Mediterranean diet are both associated with improved cardiovascular outcomes. Staying hydrated is also important for overall health.`,
  }

  // Determine which topic the user is asking about
  let response = ""

  if (lowerMessage.includes("heart") || lowerMessage.includes("pulse") || lowerMessage.includes("bpm")) {
    response = healthTopics.heart_rate
  } else if (
    lowerMessage.includes("blood pressure") ||
    lowerMessage.includes("bp") ||
    lowerMessage.includes("systolic") ||
    lowerMessage.includes("diastolic")
  ) {
    response = healthTopics.blood_pressure
  } else if (
    lowerMessage.includes("oxygen") ||
    lowerMessage.includes("spo2") ||
    lowerMessage.includes("o2") ||
    lowerMessage.includes("saturation")
  ) {
    response = healthTopics.oxygen
  } else if (lowerMessage.includes("temperature") || lowerMessage.includes("fever") || lowerMessage.includes("temp")) {
    response = healthTopics.temperature
  } else if (lowerMessage.includes("stress") || lowerMessage.includes("anxiety") || lowerMessage.includes("worried")) {
    response = healthTopics.stress
  } else if (
    lowerMessage.includes("sleep") ||
    lowerMessage.includes("tired") ||
    lowerMessage.includes("fatigue") ||
    lowerMessage.includes("rest")
  ) {
    response = healthTopics.sleep
  } else if (
    lowerMessage.includes("exercise") ||
    lowerMessage.includes("workout") ||
    lowerMessage.includes("activity") ||
    lowerMessage.includes("fitness")
  ) {
    response = healthTopics.exercise
  } else if (
    lowerMessage.includes("diet") ||
    lowerMessage.includes("food") ||
    lowerMessage.includes("eat") ||
    lowerMessage.includes("nutrition")
  ) {
    response = healthTopics.diet
  } else if (
    lowerMessage.includes("result") ||
    lowerMessage.includes("score") ||
    lowerMessage.includes("analysis") ||
    lowerMessage.includes("mean")
  ) {
    // Explain their results
    if (context?.scores) {
      const maxScore = Math.max(...Object.values(context.scores))
      const primaryCategory = Object.entries(context.scores).find(([, score]) => score === maxScore)?.[0] || "overall"
      response = `Based on your analysis, your highest risk indicator is in the ${primaryCategory} category at ${maxScore}%. ${maxScore < 30 ? "This is a low risk level, suggesting your health markers are generally within healthy ranges." : maxScore < 60 ? "This is a moderate level that warrants monitoring but isn't immediately concerning." : "This elevated level suggests you should pay attention to this area and consider consulting with a healthcare provider."} Your other scores are: Cardiac ${context.scores.cardiac}%, Respiratory ${context.scores.respiratory}%, Infection ${context.scores.infection}%, Stress ${context.scores.stress}%, Neurological ${context.scores.neurological}%. Would you like me to explain any specific category in more detail?`
    } else {
      response =
        "I don't have any recent analysis results to explain. Please run a health analysis first by entering your vitals and symptoms on the Analyze tab."
    }
  } else if (
    lowerMessage.includes("help") ||
    lowerMessage.includes("emergency") ||
    lowerMessage.includes("serious") ||
    lowerMessage.includes("worried")
  ) {
    response =
      "If you're experiencing a medical emergency, please call emergency services (911 in the US) immediately. Warning signs that require immediate attention include: severe chest pain or pressure, difficulty breathing, sudden confusion or difficulty speaking, severe headache (worst of your life), facial drooping, or weakness on one side of the body. This health tool is for informational purposes only and is not a substitute for professional medical advice."
  } else if (lowerMessage.includes("hello") || lowerMessage.includes("hi") || lowerMessage.includes("hey")) {
    response = `Hello! I'm your Digital Health Twin assistant. I can help you understand your health analysis results, explain what different vital signs mean, and provide general health information. ${context?.scores ? "I see you've already run an analysis - feel free to ask me about your results!" : "Run a health analysis first to get personalized insights, then come back here with questions."} What would you like to know?`
  } else {
    // Default response with context awareness
    if (context?.scores) {
      const maxCategory = Object.entries(context.scores).reduce((a, b) => (a[1] > b[1] ? a : b))[0]
      response = `I can help you understand your health data. Based on your recent analysis, your primary area of focus is ${maxCategory} health. You can ask me about:\n\n• Your specific results and what they mean\n• Any of your vital signs (heart rate, blood pressure, oxygen, temperature)\n• General health topics like stress, sleep, exercise, or diet\n• When you should seek medical attention\n\nWhat would you like to know more about?`
    } else {
      response =
        "I'm here to help you understand health information. You can ask me about:\n\n• What different vital signs mean\n• General health topics (stress, sleep, exercise, diet)\n• Your analysis results (after running an analysis)\n• When to seek medical attention\n\nRun a health analysis first to get personalized insights, or ask me any general health question!"
    }
  }

  return (
    response +
    "\n\n*Note: This information is for educational purposes only and is not a substitute for professional medical advice. Always consult with a qualified healthcare provider for medical concerns.*"
  )
}
