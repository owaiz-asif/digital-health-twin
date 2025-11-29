"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Heart, Thermometer, Wind, Activity, Brain, AlertCircle, Loader2 } from "lucide-react"
import { ImageUpload } from "./image-upload"
import type { HealthAnalysis } from "./health-dashboard"

const SYMPTOMS = [
  { id: "chest_pain", label: "Chest Pain", category: "cardiac" },
  { id: "shortness_breath", label: "Shortness of Breath", category: "respiratory" },
  { id: "palpitations", label: "Heart Palpitations", category: "cardiac" },
  { id: "dizziness", label: "Dizziness", category: "neurological" },
  { id: "fatigue", label: "Fatigue", category: "stress" },
  { id: "headache", label: "Headache", category: "neurological" },
  { id: "fever", label: "Fever", category: "infection" },
  { id: "cough", label: "Cough", category: "respiratory" },
  { id: "nausea", label: "Nausea", category: "stress" },
  { id: "sweating", label: "Excessive Sweating", category: "stress" },
  { id: "muscle_pain", label: "Muscle Pain", category: "infection" },
  { id: "confusion", label: "Confusion", category: "neurological" },
  { id: "anxiety", label: "Anxiety", category: "stress" },
  { id: "insomnia", label: "Insomnia", category: "stress" },
  { id: "sore_throat", label: "Sore Throat", category: "infection" },
]

type Props = {
  onAnalysisComplete: (result: HealthAnalysis) => void
  isAnalyzing: boolean
  setIsAnalyzing: (value: boolean) => void
}

export function VitalsForm({ onAnalysisComplete, isAnalyzing, setIsAnalyzing }: Props) {
  const [vitals, setVitals] = useState({
    heartRate: 72,
    systolic: 120,
    diastolic: 80,
    spo2: 98,
    temperature: 98.6,
  })
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([])
  const [saveConsent, setSaveConsent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  const handleSymptomToggle = (symptomId: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(symptomId) ? prev.filter((s) => s !== symptomId) : [...prev, symptomId],
    )
  }

  const handleAnalyze = async () => {
    setIsAnalyzing(true)
    setError(null)

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vitals,
          symptoms: selectedSymptoms,
          saveConsent,
          imageData: selectedImage,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.details || "Analysis failed")
      }

      const result = await response.json()
      onAnalysisComplete(result)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to analyze. Please try again."
      setError(errorMessage)
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Vitals Input Card */}
      <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Activity className="h-5 w-5 text-cyan-400" />
            Vital Signs
          </CardTitle>
          <CardDescription className="text-slate-400">Enter your current vital measurements</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Heart Rate */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-slate-200 flex items-center gap-2">
                <Heart className="h-4 w-4 text-red-400" />
                Heart Rate (BPM)
              </Label>
              <span className="text-cyan-400 font-mono text-lg">{vitals.heartRate}</span>
            </div>
            <Slider
              value={[vitals.heartRate]}
              onValueChange={([value]) => setVitals((prev) => ({ ...prev, heartRate: value }))}
              min={40}
              max={180}
              step={1}
              className="[&_[role=slider]]:bg-cyan-400"
            />
            <div className="flex justify-between text-xs text-slate-500">
              <span>40</span>
              <span className="text-emerald-400">60-100 normal</span>
              <span>180</span>
            </div>
          </div>

          {/* Blood Pressure */}
          <div className="space-y-3">
            <Label className="text-slate-200 flex items-center gap-2">
              <Activity className="h-4 w-4 text-purple-400" />
              Blood Pressure (mmHg)
            </Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs text-slate-400">Systolic</Label>
                <Input
                  type="number"
                  value={vitals.systolic}
                  onChange={(e) => setVitals((prev) => ({ ...prev, systolic: Number(e.target.value) }))}
                  className="bg-slate-900/50 border-slate-600 text-white"
                  min={70}
                  max={200}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-slate-400">Diastolic</Label>
                <Input
                  type="number"
                  value={vitals.diastolic}
                  onChange={(e) => setVitals((prev) => ({ ...prev, diastolic: Number(e.target.value) }))}
                  className="bg-slate-900/50 border-slate-600 text-white"
                  min={40}
                  max={130}
                />
              </div>
            </div>
            <p className="text-xs text-slate-500">Normal: 120/80 mmHg</p>
          </div>

          {/* SpO2 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-slate-200 flex items-center gap-2">
                <Wind className="h-4 w-4 text-blue-400" />
                SpO2 (%)
              </Label>
              <span className="text-cyan-400 font-mono text-lg">{vitals.spo2}%</span>
            </div>
            <Slider
              value={[vitals.spo2]}
              onValueChange={([value]) => setVitals((prev) => ({ ...prev, spo2: value }))}
              min={80}
              max={100}
              step={1}
              className="[&_[role=slider]]:bg-cyan-400"
            />
            <div className="flex justify-between text-xs text-slate-500">
              <span>80%</span>
              <span className="text-emerald-400">95-100% normal</span>
              <span>100%</span>
            </div>
          </div>

          {/* Temperature */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-slate-200 flex items-center gap-2">
                <Thermometer className="h-4 w-4 text-orange-400" />
                Temperature (°F)
              </Label>
              <span className="text-cyan-400 font-mono text-lg">{vitals.temperature.toFixed(1)}°F</span>
            </div>
            <Slider
              value={[vitals.temperature]}
              onValueChange={([value]) => setVitals((prev) => ({ ...prev, temperature: value }))}
              min={95}
              max={105}
              step={0.1}
              className="[&_[role=slider]]:bg-cyan-400"
            />
            <div className="flex justify-between text-xs text-slate-500">
              <span>95°F</span>
              <span className="text-emerald-400">97.8-99.1°F normal</span>
              <span>105°F</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Symptoms Card */}
      <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-400" />
            Symptoms
          </CardTitle>
          <CardDescription className="text-slate-400">Select any symptoms you are experiencing</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {SYMPTOMS.map((symptom) => (
              <div
                key={symptom.id}
                className={`flex items-center space-x-3 p-3 rounded-lg border transition-all cursor-pointer ${
                  selectedSymptoms.includes(symptom.id)
                    ? "bg-cyan-500/20 border-cyan-500/50"
                    : "bg-slate-900/30 border-slate-700/50 hover:border-slate-600"
                }`}
                onClick={() => handleSymptomToggle(symptom.id)}
              >
                <Checkbox
                  checked={selectedSymptoms.includes(symptom.id)}
                  onCheckedChange={() => handleSymptomToggle(symptom.id)}
                  className="border-slate-500 data-[state=checked]:bg-cyan-500 data-[state=checked]:border-cyan-500"
                />
                <span className="text-sm text-slate-200">{symptom.label}</span>
              </div>
            ))}
          </div>

          {selectedSymptoms.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-700/50">
              {selectedSymptoms.map((id) => {
                const symptom = SYMPTOMS.find((s) => s.id === id)
                return symptom ? (
                  <Badge key={id} variant="secondary" className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30">
                    {symptom.label}
                  </Badge>
                ) : null
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="lg:col-span-2">
        <ImageUpload selectedImage={selectedImage} onImageSelect={setSelectedImage} />
      </div>

      {/* Consent and Submit - full width */}
      <Card className="lg:col-span-2 bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-slate-200">Save Analysis History</Label>
              <p className="text-xs text-slate-500">Store this analysis for future reference</p>
            </div>
            <Switch checked={saveConsent} onCheckedChange={setSaveConsent} />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-400 text-sm">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          <Button
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold py-6"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Analyzing Health Data...
              </>
            ) : (
              <>
                <Activity className="h-5 w-5 mr-2" />
                Analyze My Health
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
