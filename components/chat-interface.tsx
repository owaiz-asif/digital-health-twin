"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { MessageCircle, Send, Loader2, Bot, User } from "lucide-react"
import type { HealthAnalysis } from "./health-dashboard"

type Message = {
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

type Props = {
  analysisContext: HealthAnalysis | null
}

export function ChatInterface({ analysisContext }: Props) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hello! I'm your Digital Health Twin assistant. I can help answer questions about your health analysis, explain medical terms, or provide general wellness guidance. How can I help you today?",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      role: "user",
      content: input,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: input,
          context: analysisContext,
          history: messages.slice(-10), // Last 10 messages for context
        }),
      })

      if (!response.ok) throw new Error("Chat failed")

      const data = await response.json()

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.response,
          timestamp: new Date(),
        },
      ])
    } catch (error) {
      console.error("Chat error:", error)
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "I apologize, but I encountered an error processing your request. Please try again.",
          timestamp: new Date(),
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm h-[600px] flex flex-col">
      <CardHeader className="border-b border-slate-700/50">
        <CardTitle className="text-white flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-cyan-400" />
          Health Assistant Chat
        </CardTitle>
        {analysisContext && (
          <p className="text-sm text-slate-400">Context: Your recent health analysis is available for reference</p>
        )}
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        <div className="flex-1 overflow-auto p-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div key={index} className={`flex gap-3 ${message.role === "user" ? "flex-row-reverse" : ""}`}>
                <div
                  className={`flex items-center justify-center h-8 w-8 rounded-full shrink-0 ${
                    message.role === "user" ? "bg-cyan-500/20" : "bg-purple-500/20"
                  }`}
                >
                  {message.role === "user" ? (
                    <User className="h-4 w-4 text-cyan-400" />
                  ) : (
                    <Bot className="h-4 w-4 text-purple-400" />
                  )}
                </div>
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    message.role === "user" ? "bg-cyan-500/20 text-slate-100" : "bg-slate-700/50 text-slate-200"
                  }`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                  <p className="text-xs text-slate-500 mt-1">{message.timestamp.toLocaleTimeString()}</p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-purple-500/20 shrink-0">
                  <Bot className="h-4 w-4 text-purple-400" />
                </div>
                <div className="bg-slate-700/50 rounded-2xl px-4 py-3">
                  <Loader2 className="h-4 w-4 animate-spin text-purple-400" />
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="p-4 border-t border-slate-700/50">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSend()
            }}
            className="flex gap-2"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your health analysis..."
              className="flex-1 bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500"
              disabled={isLoading}
            />
            <Button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="bg-cyan-500 hover:bg-cyan-600 text-white"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  )
}
