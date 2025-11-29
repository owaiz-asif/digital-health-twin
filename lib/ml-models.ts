// Lightweight ML model implementations for health risk scoring

export type VitalsInput = {
  heartRate: number
  systolic: number
  diastolic: number
  spo2: number
  temperature: number
}

export type SymptomsInput = string[]

// Random Forest-like classifier for cardiac risk
export function calculateCardiacRisk(vitals: VitalsInput, symptoms: SymptomsInput): number {
  let risk = 0

  // Heart rate analysis
  if (vitals.heartRate < 60)
    risk += 15 // Bradycardia
  else if (vitals.heartRate > 100)
    risk += 25 // Tachycardia
  else if (vitals.heartRate > 85) risk += 10 // Elevated

  // Blood pressure analysis
  const bp = vitals.systolic
  if (bp > 180)
    risk += 35 // Hypertensive crisis
  else if (bp > 140)
    risk += 25 // Stage 2 hypertension
  else if (bp > 130)
    risk += 15 // Stage 1 hypertension
  else if (bp < 90) risk += 20 // Hypotension

  // Diastolic
  if (vitals.diastolic > 120) risk += 25
  else if (vitals.diastolic > 90) risk += 15
  else if (vitals.diastolic > 80) risk += 8

  // Symptom weights
  const cardiacSymptoms = ["chest_pain", "palpitations", "shortness_breath", "dizziness"]
  for (const symptom of symptoms) {
    if (cardiacSymptoms.includes(symptom)) {
      risk += symptom === "chest_pain" ? 20 : 12
    }
  }

  return Math.min(Math.max(Math.round(risk), 0), 100)
}

// Logistic Regression-like model for stress risk
export function calculateStressRisk(vitals: VitalsInput, symptoms: SymptomsInput): number {
  let risk = 0

  // Heart rate variability proxy
  if (vitals.heartRate > 90) risk += 20
  if (vitals.heartRate > 100) risk += 15

  // BP as stress indicator
  if (vitals.systolic > 130) risk += 15
  if (vitals.diastolic > 85) risk += 10

  // Stress symptoms
  const stressSymptoms = ["anxiety", "fatigue", "insomnia", "nausea", "sweating"]
  for (const symptom of symptoms) {
    if (stressSymptoms.includes(symptom)) {
      risk += 15
    }
  }

  // Temperature slightly elevated can indicate stress
  if (vitals.temperature > 99) risk += 8

  return Math.min(Math.max(Math.round(risk), 0), 100)
}

// Respiratory risk calculation
export function calculateRespiratoryRisk(vitals: VitalsInput, symptoms: SymptomsInput): number {
  let risk = 0

  // SpO2 is primary indicator
  if (vitals.spo2 < 90)
    risk += 50 // Severe hypoxemia
  else if (vitals.spo2 < 94)
    risk += 35 // Moderate hypoxemia
  else if (vitals.spo2 < 96) risk += 15 // Mild concern

  // Respiratory symptoms
  const respiratorySymptoms = ["shortness_breath", "cough"]
  for (const symptom of symptoms) {
    if (respiratorySymptoms.includes(symptom)) {
      risk += 20
    }
  }

  // Elevated heart rate with low SpO2
  if (vitals.heartRate > 100 && vitals.spo2 < 96) {
    risk += 15
  }

  return Math.min(Math.max(Math.round(risk), 0), 100)
}

// Infection risk calculation
export function calculateInfectionRisk(vitals: VitalsInput, symptoms: SymptomsInput): number {
  let risk = 0

  // Temperature is primary indicator
  if (vitals.temperature > 103)
    risk += 45 // High fever
  else if (vitals.temperature > 101)
    risk += 30 // Fever
  else if (vitals.temperature > 99.5) risk += 15 // Low-grade fever

  // Infection symptoms
  const infectionSymptoms = ["fever", "muscle_pain", "sore_throat", "cough", "fatigue"]
  for (const symptom of symptoms) {
    if (infectionSymptoms.includes(symptom)) {
      risk += 12
    }
  }

  // Elevated heart rate with fever
  if (vitals.heartRate > 100 && vitals.temperature > 99.5) {
    risk += 10
  }

  return Math.min(Math.max(Math.round(risk), 0), 100)
}

// Neurological risk calculation
export function calculateNeurologicalRisk(vitals: VitalsInput, symptoms: SymptomsInput): number {
  let risk = 0

  // BP extremes can indicate neurological issues
  if (vitals.systolic > 180 || vitals.systolic < 80) risk += 25

  // Neurological symptoms
  const neuroSymptoms = ["headache", "dizziness", "confusion"]
  for (const symptom of symptoms) {
    if (neuroSymptoms.includes(symptom)) {
      risk += symptom === "confusion" ? 25 : 15
    }
  }

  // Low SpO2 affects brain
  if (vitals.spo2 < 92) risk += 20

  return Math.min(Math.max(Math.round(risk), 0), 100)
}

// Isolation Forest-like anomaly detection
export function detectAnomalies(vitals: VitalsInput): { isAnomaly: boolean; score: number } {
  const normalRanges = {
    heartRate: { min: 60, max: 100 },
    systolic: { min: 90, max: 140 },
    diastolic: { min: 60, max: 90 },
    spo2: { min: 95, max: 100 },
    temperature: { min: 97, max: 99.5 },
  }

  let anomalyScore = 0

  for (const [key, range] of Object.entries(normalRanges)) {
    const value = vitals[key as keyof VitalsInput]
    if (value < range.min) {
      anomalyScore += ((range.min - value) / range.min) * 100
    } else if (value > range.max) {
      anomalyScore += ((value - range.max) / range.max) * 100
    }
  }

  anomalyScore = Math.min(anomalyScore / 5, 100) // Normalize

  return {
    isAnomaly: anomalyScore > 30,
    score: Math.round(anomalyScore),
  }
}

// Main analysis function combining all models
export function analyzeHealth(vitals: VitalsInput, symptoms: SymptomsInput) {
  const scores = {
    cardiac: calculateCardiacRisk(vitals, symptoms),
    respiratory: calculateRespiratoryRisk(vitals, symptoms),
    infection: calculateInfectionRisk(vitals, symptoms),
    stress: calculateStressRisk(vitals, symptoms),
    neurological: calculateNeurologicalRisk(vitals, symptoms),
  }

  const anomaly = detectAnomalies(vitals)

  // Determine primary affected region based on highest score
  const maxScore = Math.max(...Object.values(scores))
  const primaryCategory = Object.entries(scores).find(([, score]) => score === maxScore)?.[0]

  const regionMap: Record<string, string> = {
    cardiac: "chest (heart region)",
    respiratory: "chest (lungs)",
    infection: "full body",
    stress: "torso and head",
    neurological: "head (brain)",
  }

  return {
    scores,
    anomaly,
    affectedRegion: regionMap[primaryCategory || "cardiac"],
    primaryCategory,
  }
}
