"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { History, Eye, Trash2, Loader2, Calendar, Shield } from "lucide-react"
import type { HealthAnalysis } from "./health-dashboard"

type HistoryEntry = HealthAnalysis & {
  id: string
}

type Props = {
  onLoadAnalysis: (analysis: HealthAnalysis) => void
}

export function HistoryPanel({ onLoadAnalysis }: Props) {
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchHistory()
  }, [])

  const fetchHistory = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/history")
      if (response.ok) {
        const data = await response.json()
        setHistory(data.history || [])
      }
    } catch (error) {
      console.error("Failed to fetch history:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const deleteEntry = async (id: string) => {
    try {
      const response = await fetch(`/api/history?id=${id}`, {
        method: "DELETE",
      })
      if (response.ok) {
        setHistory((prev) => prev.filter((entry) => entry.id !== id))
      }
    } catch (error) {
      console.error("Failed to delete entry:", error)
    }
  }

  const getMaxRisk = (scores: HealthAnalysis["scores"]) => {
    const max = Math.max(...Object.values(scores))
    const category = Object.entries(scores).find(([, v]) => v === max)?.[0]
    return { max, category }
  }

  const getRiskColor = (score: number) => {
    if (score < 30) return "bg-emerald-500/20 text-emerald-400"
    if (score < 60) return "bg-yellow-500/20 text-yellow-400"
    return "bg-red-500/20 text-red-400"
  }

  return (
    <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <History className="h-5 w-5 text-cyan-400" />
          Analysis History
        </CardTitle>
        <CardDescription className="text-slate-400">View and manage your past health analyses</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-12">
            <History className="h-12 w-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">No analysis history yet</p>
            <p className="text-sm text-slate-500 mt-1">
              Enable &quot;Save Analysis History&quot; when running an analysis
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[500px]">
            <div className="space-y-4">
              {history.map((entry) => {
                const { max, category } = getMaxRisk(entry.scores)
                return (
                  <div
                    key={entry.id}
                    className="p-4 rounded-lg bg-slate-900/50 border border-slate-700/50 hover:border-slate-600 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2 text-sm text-slate-400">
                        <Calendar className="h-4 w-4" />
                        {new Date(entry.timestamp).toLocaleString()}
                      </div>
                      <Badge className={getRiskColor(max)}>
                        {category}: {max}%
                      </Badge>
                    </div>

                    <div className="grid grid-cols-5 gap-2 mb-3">
                      {Object.entries(entry.scores).map(([key, value]) => (
                        <div key={key} className="text-center">
                          <div className="text-xs text-slate-500 capitalize">{key}</div>
                          <div className="text-sm font-mono text-slate-300">{value}%</div>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
                      <Shield className="h-3 w-3" />
                      <span className="truncate">Hash: {entry.blockchainHash?.slice(0, 20)}...</span>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/20 bg-transparent"
                        onClick={() => onLoadAnalysis(entry)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-red-500/50 text-red-400 hover:bg-red-500/20 bg-transparent"
                        onClick={() => deleteEntry(entry.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}
