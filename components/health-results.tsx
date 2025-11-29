"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { HumanBodySvg } from "./human-body-svg"
import type { HealthAnalysis } from "./health-dashboard"
import {
  Heart,
  Wind,
  Thermometer,
  Brain,
  Activity,
  AlertTriangle,
  CheckCircle,
  Download,
  Shield,
  Stethoscope,
  FileText,
  Loader2,
  ImageIcon,
} from "lucide-react"

type Props = {
  analysis: HealthAnalysis
}

const SCORE_CONFIG = {
  cardiac: { icon: Heart, color: "text-red-400", bgColor: "bg-red-500/20", label: "Cardiac" },
  respiratory: { icon: Wind, color: "text-blue-400", bgColor: "bg-blue-500/20", label: "Respiratory" },
  infection: { icon: Thermometer, color: "text-orange-400", bgColor: "bg-orange-500/20", label: "Infection" },
  stress: { icon: Activity, color: "text-purple-400", bgColor: "bg-purple-500/20", label: "Stress" },
  neurological: { icon: Brain, color: "text-cyan-400", bgColor: "bg-cyan-500/20", label: "Neurological" },
}

function getRiskLevel(score: number): { label: string; color: string; bgColor: string } {
  if (score < 30) return { label: "Low", color: "text-emerald-400", bgColor: "bg-emerald-500/20" }
  if (score < 60) return { label: "Moderate", color: "text-yellow-400", bgColor: "bg-yellow-500/20" }
  return { label: "Elevated", color: "text-red-400", bgColor: "bg-red-500/20" }
}

export function HealthResults({ analysis }: Props) {
  const [isDownloading, setIsDownloading] = useState(false)

  const handleDownloadPdf = async () => {
    setIsDownloading(true)
    try {
      const response = await fetch("/api/download-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(analysis),
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `health-report-${new Date().toISOString().split("T")[0]}.html`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error("Failed to download PDF:", error)
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header with Download */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Health Analysis Report</h2>
          <p className="text-slate-400 text-sm">Generated on {new Date(analysis.timestamp).toLocaleString()}</p>
        </div>
        <Button
          onClick={handleDownloadPdf}
          disabled={isDownloading}
          variant="outline"
          className="border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/20 bg-transparent"
        >
          {isDownloading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
          Export Report
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Body Visualization */}
        <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white">Body Analysis</CardTitle>
            <CardDescription className="text-slate-400">
              Affected region: <span className="text-cyan-400 capitalize">{analysis.affectedRegion}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <HumanBodySvg affectedRegion={analysis.affectedRegion} scores={analysis.scores} />
          </CardContent>
        </Card>

        {/* Risk Scores */}
        <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Activity className="h-5 w-5 text-cyan-400" />
              Risk Assessment
            </CardTitle>
            <CardDescription className="text-slate-400">Probability scores across health categories</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(analysis.scores).map(([key, score]) => {
              const config = SCORE_CONFIG[key as keyof typeof SCORE_CONFIG]
              const risk = getRiskLevel(score)
              const Icon = config.icon

              return (
                <div key={key} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg ${config.bgColor}`}>
                        <Icon className={`h-4 w-4 ${config.color}`} />
                      </div>
                      <span className="text-slate-200">{config.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={`${risk.bgColor} ${risk.color} border-0`}>
                        {risk.label}
                      </Badge>
                      <span className="font-mono text-white w-12 text-right">{score}%</span>
                    </div>
                  </div>
                  <Progress value={score} className="h-2 bg-slate-700" />
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>

      {/* Image Analysis Card when image was analyzed */}
      {analysis.imageAnalysis && (
        <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm border-l-4 border-l-cyan-500">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-cyan-400" />
              Medical Scan Analysis
            </CardTitle>
            <CardDescription className="text-slate-400">
              AI-powered analysis of your uploaded medical image
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-4 rounded-lg bg-cyan-500/10 border border-cyan-500/30">
              <p className="text-slate-200 leading-relaxed whitespace-pre-wrap">{analysis.imageAnalysis}</p>
            </div>
            <p className="text-xs text-slate-500 mt-3">
              Note: This AI analysis is for informational purposes only. Always have medical scans reviewed by a
              qualified radiologist or healthcare provider.
            </p>
          </CardContent>
        </Card>
      )}

      {/* AI Explanation */}
      <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <FileText className="h-5 w-5 text-cyan-400" />
            AI Health Insights
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Explanation */}
          <div className="p-4 rounded-lg bg-slate-900/50 border border-slate-700/50">
            <p className="text-slate-200 leading-relaxed">{analysis.explanation}</p>
          </div>

          {/* Precautions */}
          <div>
            <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
              <Shield className="h-4 w-4 text-emerald-400" />
              Recommended Precautions
            </h4>
            <ul className="space-y-2">
              {analysis.precautions.map((precaution, index) => (
                <li key={index} className="flex items-start gap-2 text-slate-300">
                  <CheckCircle className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
                  {precaution}
                </li>
              ))}
            </ul>
          </div>

          {/* When to Seek Help */}
          <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
            <h4 className="text-amber-400 font-semibold mb-2 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              When to Seek Medical Help
            </h4>
            <p className="text-slate-300">{analysis.seekHelpWhen}</p>
          </div>

          {/* Doctor Questions */}
          <div>
            <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
              <Stethoscope className="h-4 w-4 text-blue-400" />
              Questions to Ask Your Doctor
            </h4>
            <ol className="space-y-2">
              {analysis.doctorQuestions.map((question, index) => (
                <li key={index} className="flex items-start gap-2 text-slate-300">
                  <span className="flex items-center justify-center h-5 w-5 rounded-full bg-blue-500/20 text-blue-400 text-xs shrink-0">
                    {index + 1}
                  </span>
                  {question}
                </li>
              ))}
            </ol>
          </div>

          {/* Disclaimer */}
          <div className="p-4 rounded-lg bg-slate-900/80 border border-slate-600/50 text-sm text-slate-400">
            <p className="font-semibold text-slate-300 mb-1">Important Disclaimer</p>
            <p>{analysis.disclaimer}</p>
          </div>

          {/* Blockchain Hash */}
          {analysis.blockchainHash && (
            <div className="pt-4 border-t border-slate-700/50">
              <p className="text-xs text-slate-500">
                Data Integrity Hash: <code className="text-cyan-400/70">{analysis.blockchainHash}</code>
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
