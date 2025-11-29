import { NextResponse } from "next/server"
import { analyzeHealth } from "@/lib/ml-models"
import { addBlock } from "@/lib/blockchain"
import { saveAnalysis } from "@/lib/storage"
import { callGemini, buildAnalysisPrompt, cleanGeminiResponse } from "@/lib/gemini"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { vitals, symptoms, saveConsent, imageData } = body

    // Run ML models
    const mlResults = analyzeHealth(vitals, symptoms)

    let analysisResponse
    let imageAnalysis: string | null = null

    const useAI = process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.length > 10

    if (useAI) {
      try {
        const prompt = buildAnalysisPrompt(vitals, symptoms, mlResults.scores, !!imageData)
        const geminiResponse = await callGemini(prompt, imageData || undefined)

        const cleanedResponse = cleanGeminiResponse(geminiResponse)

        try {
          const parsed = JSON.parse(cleanedResponse)

          analysisResponse = {
            explanation: parsed.explanation || generateFallbackExplanation(mlResults, vitals, symptoms),
            precautions: Array.isArray(parsed.precautions)
              ? parsed.precautions
              : generateFallbackPrecautions(mlResults.primaryCategory || "cardiac"),
            seekHelpWhen: parsed.seekHelpWhen || generateFallbackSeekHelp(mlResults.primaryCategory || "cardiac"),
            doctorQuestions: Array.isArray(parsed.doctorQuestions)
              ? parsed.doctorQuestions
              : generateFallbackQuestions(mlResults.primaryCategory || "cardiac"),
            affectedRegion: mlResults.affectedRegion,
          }
          imageAnalysis = parsed.imageAnalysis || null
        } catch (parseError) {
          // If JSON parsing fails, use the raw response as explanation
          analysisResponse = generateAnalysisResponse(mlResults, vitals, symptoms)
          // Try to extract useful text from the response
          if (geminiResponse && geminiResponse.length > 50) {
            analysisResponse.explanation = geminiResponse.substring(0, 500) + "..."
          }
        }
      } catch (aiError) {
        console.error("Gemini AI error, using fallback:", aiError)
        analysisResponse = generateAnalysisResponse(mlResults, vitals, symptoms)
      }
    } else {
      // No API key, use fallback
      analysisResponse = generateAnalysisResponse(mlResults, vitals, symptoms)
    }

    const timestamp = new Date().toISOString()

    // Create analysis result
    const analysisResult = {
      scores: mlResults.scores,
      affectedRegion: analysisResponse.affectedRegion,
      explanation: analysisResponse.explanation,
      precautions: analysisResponse.precautions,
      seekHelpWhen: analysisResponse.seekHelpWhen,
      doctorQuestions: analysisResponse.doctorQuestions,
      imageAnalysis,
      disclaimer:
        "This analysis is for informational purposes only and does not constitute medical advice. Always consult a qualified healthcare professional for medical concerns.",
      vitals,
      symptoms,
      timestamp,
      blockchainHash: "",
    }

    // Add to blockchain for data integrity
    const hash = addBlock({
      ...analysisResult,
      timestamp,
    })
    analysisResult.blockchainHash = hash

    // Save to history if consent given
    if (saveConsent) {
      saveAnalysis(analysisResult)
    }

    return NextResponse.json(analysisResult)
  } catch (error) {
    console.error("Analysis error:", error)
    return NextResponse.json({ error: "Failed to analyze health data", details: String(error) }, { status: 500 })
  }
}

function generateFallbackExplanation(
  mlResults: ReturnType<typeof analyzeHealth>,
  vitals: { heartRate: number; systolic: number; diastolic: number; spo2: number; temperature: number },
  symptoms: string[],
): string {
  const { scores } = mlResults
  const maxScore = Math.max(...Object.values(scores))
  const primaryCategory = Object.entries(scores).find(([, score]) => score === maxScore)?.[0] || "cardiac"

  const vitalAnalysis: string[] = []

  if (vitals.heartRate < 60) {
    vitalAnalysis.push("Your heart rate is below the typical resting range (bradycardia)")
  } else if (vitals.heartRate > 100) {
    vitalAnalysis.push("Your heart rate is elevated above the typical resting range (tachycardia)")
  } else {
    vitalAnalysis.push("Your heart rate is within the normal resting range")
  }

  if (vitals.systolic >= 140 || vitals.diastolic >= 90) {
    vitalAnalysis.push("Your blood pressure reading is elevated")
  } else if (vitals.systolic < 90 || vitals.diastolic < 60) {
    vitalAnalysis.push("Your blood pressure reading is lower than typical")
  } else {
    vitalAnalysis.push("Your blood pressure is within healthy ranges")
  }

  if (vitals.spo2 < 95) {
    vitalAnalysis.push("Your oxygen saturation is below the optimal range")
  } else {
    vitalAnalysis.push("Your oxygen saturation is at a healthy level")
  }

  if (vitals.temperature > 99.5) {
    vitalAnalysis.push("You may have an elevated temperature suggesting fever")
  } else if (vitals.temperature < 97) {
    vitalAnalysis.push("Your body temperature is below the typical range")
  } else {
    vitalAnalysis.push("Your body temperature is normal")
  }

  if (maxScore < 30) {
    return `Based on your health data analysis: ${vitalAnalysis.join(". ")}. Overall, your readings suggest a healthy baseline. Continue maintaining your current health practices and stay attentive to any changes in how you feel.`
  } else if (maxScore < 60) {
    return `Based on your health data analysis: ${vitalAnalysis.join(". ")}. Your readings show some areas in the ${primaryCategory} category that may benefit from monitoring. ${symptoms.length > 0 ? `The symptoms you reported (${symptoms.join(", ")}) have been factored into this assessment.` : ""} This is informational and continued monitoring is recommended.`
  } else {
    return `Based on your health data analysis: ${vitalAnalysis.join(". ")}. Your analysis indicates elevated readings in the ${primaryCategory} category with a risk score of ${maxScore}%. ${symptoms.length > 0 ? `Combined with your reported symptoms (${symptoms.join(", ")}), we recommend attention to this area.` : ""} While this tool provides informational guidance only, consider consulting with a healthcare provider for personalized advice.`
  }
}

function generateFallbackPrecautions(category: string): string[] {
  const precautionsByCategory: Record<string, string[]> = {
    cardiac: [
      "Monitor your heart rate and blood pressure regularly, especially during stress or physical activity",
      "Limit caffeine, alcohol, and high-sodium foods which can affect cardiovascular health",
      "Practice stress-reduction techniques like deep breathing, meditation, or gentle yoga",
      "Aim for 150 minutes of moderate aerobic activity per week as tolerated",
      "Keep a log of any chest discomfort, palpitations, or shortness of breath",
    ],
    respiratory: [
      "Ensure good air quality in your living and working environments",
      "Practice diaphragmatic breathing exercises to improve lung capacity",
      "Stay well hydrated to keep airways moist and functioning optimally",
      "Avoid respiratory irritants like smoke, strong fragrances, and pollutants",
      "Use a pulse oximeter to track your oxygen levels if available",
    ],
    infection: [
      "Get plenty of rest to support your immune system's recovery",
      "Stay hydrated with water, herbal teas, and electrolyte solutions",
      "Monitor your temperature every 4-6 hours while symptomatic",
      "Practice respiratory hygiene and consider isolating if you have fever",
      "Eat nutrient-rich foods to support immune function",
    ],
    stress: [
      "Prioritize 7-9 hours of quality sleep each night",
      "Take regular breaks throughout the day to decompress",
      "Engage in activities you enjoy to promote mental wellbeing",
      "Consider mindfulness practices or guided relaxation exercises",
      "Limit screen time and news consumption if it increases anxiety",
    ],
    neurological: [
      "Ensure adequate hydration as dehydration can worsen neurological symptoms",
      "Reduce screen brightness and take breaks if experiencing headaches",
      "Maintain a regular sleep schedule to support brain health",
      "Avoid triggers you've identified for headaches or dizziness",
      "Keep a symptom diary to identify patterns or triggers",
    ],
  }
  return precautionsByCategory[category] || precautionsByCategory.cardiac
}

function generateFallbackSeekHelp(category: string): string {
  const seekHelpMessages: Record<string, string> = {
    cardiac:
      "Seek immediate medical attention if you experience severe chest pain or pressure, pain radiating to arm/jaw/back, sudden shortness of breath, rapid or irregular heartbeat with dizziness, or fainting.",
    respiratory:
      "Seek immediate medical attention if you experience severe difficulty breathing, bluish discoloration of lips or fingertips, oxygen saturation below 90%, inability to speak in full sentences, or worsening symptoms despite rest.",
    infection:
      "Seek immediate medical attention if your temperature exceeds 103°F (39.4°C), you experience confusion or difficulty staying awake, have a stiff neck with fever, develop a rash that doesn't fade when pressed, or symptoms suddenly worsen.",
    stress:
      "Seek immediate medical attention if you experience chest pain, thoughts of self-harm, severe panic attacks with physical symptoms, or if stress is significantly impacting your daily functioning.",
    neurological:
      "Seek immediate medical attention if you experience sudden severe headache (worst of your life), vision changes, difficulty speaking or understanding speech, facial drooping, weakness on one side, or sudden confusion.",
  }
  return seekHelpMessages[category] || seekHelpMessages.cardiac
}

function generateFallbackQuestions(category: string): string[] {
  const doctorQuestionsByCategory: Record<string, string[]> = {
    cardiac: [
      "Based on my vital signs, should I be concerned about my cardiovascular health?",
      "What lifestyle modifications would you recommend for my heart health?",
      "Are there any screening tests you'd recommend given my readings?",
      "Could my symptoms be related to anxiety or stress affecting my heart?",
      "What warning signs should prompt me to seek emergency care?",
    ],
    respiratory: [
      "What might be causing my oxygen saturation readings?",
      "Are there breathing exercises or techniques you recommend?",
      "Should I be concerned about my respiratory symptoms?",
      "Would you recommend any pulmonary function testing?",
      "Are there environmental factors I should consider?",
    ],
    infection: [
      "Does my temperature pattern suggest a viral or bacterial infection?",
      "What symptoms would indicate I need urgent medical attention?",
      "How long should I monitor before seeking further evaluation?",
      "Are there any over-the-counter treatments you'd recommend?",
      "Should I get tested for any specific conditions?",
    ],
    stress: [
      "How might chronic stress be affecting my physical health markers?",
      "What evidence-based stress management approaches do you recommend?",
      "Could my symptoms have a stress-related component?",
      "Should I consider any mental health support resources?",
      "Are there any supplements or lifestyle changes that might help?",
    ],
    neurological: [
      "What could be causing my neurological symptoms?",
      "Are there any red flag symptoms I should watch for?",
      "Would you recommend a neurological evaluation?",
      "Could my symptoms be related to sleep, hydration, or stress?",
      "What imaging or tests might be helpful?",
    ],
  }
  return doctorQuestionsByCategory[category] || doctorQuestionsByCategory.cardiac
}

function generateAnalysisResponse(
  mlResults: ReturnType<typeof analyzeHealth>,
  vitals: { heartRate: number; systolic: number; diastolic: number; spo2: number; temperature: number },
  symptoms: string[],
) {
  const primaryCategory = mlResults.primaryCategory || "cardiac"

  return {
    explanation: generateFallbackExplanation(mlResults, vitals, symptoms),
    affectedRegion: mlResults.affectedRegion,
    precautions: generateFallbackPrecautions(primaryCategory),
    seekHelpWhen: generateFallbackSeekHelp(primaryCategory),
    doctorQuestions: generateFallbackQuestions(primaryCategory),
  }
}
