// Simple in-memory storage with localStorage persistence for history

import type { HealthAnalysis } from "@/components/health-dashboard"

type StoredAnalysis = HealthAnalysis & { id: string }

// Server-side in-memory storage
const memoryStorage: Map<string, StoredAnalysis> = new Map()

export function saveAnalysis(analysis: HealthAnalysis): string {
  const id = `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  const storedAnalysis: StoredAnalysis = { ...analysis, id }
  memoryStorage.set(id, storedAnalysis)
  return id
}

export function getAnalysisHistory(): StoredAnalysis[] {
  return Array.from(memoryStorage.values()).sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  )
}

export function getAnalysisById(id: string): StoredAnalysis | undefined {
  return memoryStorage.get(id)
}

export function deleteAnalysis(id: string): boolean {
  return memoryStorage.delete(id)
}

export function clearHistory(): void {
  memoryStorage.clear()
}
