"use client"

import { useState } from "react"
import { VitalsForm } from "./vitals-form"
import { HealthResults } from "./health-results"
import { ChatInterface } from "./chat-interface"
import { HistoryPanel } from "./history-panel"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Activity, MessageCircle, History, FileText } from "lucide-react"

export type HealthAnalysis = {
  scores: {
    cardiac: number
    respiratory: number
    infection: number
    stress: number
    neurological: number
  }
  affectedRegion: string
  explanation: string
  precautions: string[]
  seekHelpWhen: string
  doctorQuestions: string[]
  disclaimer: string
  vitals: {
    heartRate: number
    systolic: number
    diastolic: number
    spo2: number
    temperature: number
  }
  symptoms: string[]
  timestamp: string
  blockchainHash?: string
  imageAnalysis?: string | null
}

export function HealthDashboard() {
  const [activeTab, setActiveTab] = useState("analyze")
  const [analysisResult, setAnalysisResult] = useState<HealthAnalysis | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const handleAnalysisComplete = (result: HealthAnalysis) => {
    setAnalysisResult(result)
    setActiveTab("results")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <header className="border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Activity className="h-8 w-8 text-cyan-400" />
              <div className="absolute -top-1 -right-1 h-3 w-3 bg-emerald-400 rounded-full animate-pulse" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Digital Health Twin</h1>
              <p className="text-sm text-slate-400">AI-Powered Health Analysis System</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-slate-800/50 border border-slate-700/50 p-1">
            <TabsTrigger
              value="analyze"
              className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400"
            >
              <Activity className="h-4 w-4 mr-2" />
              Analyze
            </TabsTrigger>
            <TabsTrigger
              value="results"
              className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400"
              disabled={!analysisResult}
            >
              <FileText className="h-4 w-4 mr-2" />
              Results
            </TabsTrigger>
            <TabsTrigger value="chat" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
              <MessageCircle className="h-4 w-4 mr-2" />
              Chat
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400"
            >
              <History className="h-4 w-4 mr-2" />
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="analyze" className="mt-6">
            <VitalsForm
              onAnalysisComplete={handleAnalysisComplete}
              isAnalyzing={isAnalyzing}
              setIsAnalyzing={setIsAnalyzing}
            />
          </TabsContent>

          <TabsContent value="results" className="mt-6">
            {analysisResult && <HealthResults analysis={analysisResult} />}
          </TabsContent>

          <TabsContent value="chat" className="mt-6">
            <ChatInterface analysisContext={analysisResult} />
          </TabsContent>

          <TabsContent value="history" className="mt-6">
            <HistoryPanel onLoadAnalysis={setAnalysisResult} />
          </TabsContent>
        </Tabs>
      </main>

      <footer className="border-t border-slate-700/50 bg-slate-900/80 py-4 mt-auto">
        <div className="container mx-auto px-4 text-center text-sm text-slate-500">
          <p>This tool is for informational purposes only and does not constitute medical advice.</p>
          <p>Always consult a healthcare professional for medical concerns.</p>
        </div>
      </footer>
    </div>
  )
}
