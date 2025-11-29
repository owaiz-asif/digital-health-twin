"use client"

import { useEffect, useState } from "react"

type Props = {
  affectedRegion: string
  scores: {
    cardiac: number
    respiratory: number
    infection: number
    stress: number
    neurological: number
  }
}

const REGION_MAP: Record<string, string[]> = {
  head: ["head", "brain", "neurological"],
  chest: ["chest", "heart", "cardiac", "lungs", "respiratory"],
  torso: ["torso", "stomach", "liver", "infection", "stress"],
  arms: ["arms", "limbs"],
  legs: ["legs", "limbs"],
  full: ["full", "body", "general"],
}

function getRegionFromAnalysis(region: string): string {
  const normalizedRegion = region.toLowerCase()
  for (const [bodyPart, keywords] of Object.entries(REGION_MAP)) {
    if (keywords.some((keyword) => normalizedRegion.includes(keyword))) {
      return bodyPart
    }
  }
  return "chest" // default
}

function getGlowColor(scores: Props["scores"]): string {
  const maxScore = Math.max(...Object.values(scores))
  if (maxScore < 30) return "#10b981" // emerald
  if (maxScore < 60) return "#f59e0b" // amber
  return "#ef4444" // red
}

export function HumanBodySvg({ affectedRegion, scores }: Props) {
  const [activeRegion, setActiveRegion] = useState<string>("chest")
  const [glowIntensity, setGlowIntensity] = useState(0)

  useEffect(() => {
    setActiveRegion(getRegionFromAnalysis(affectedRegion))

    // Animate glow
    const interval = setInterval(() => {
      setGlowIntensity((prev) => (prev + 0.05) % 1)
    }, 50)

    return () => clearInterval(interval)
  }, [affectedRegion])

  const glowColor = getGlowColor(scores)
  const pulseOpacity = 0.3 + Math.sin(glowIntensity * Math.PI * 2) * 0.3

  return (
    <svg viewBox="0 0 200 400" className="w-full max-w-[300px] h-auto" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <linearGradient id="bodyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#334155" />
          <stop offset="100%" stopColor="#1e293b" />
        </linearGradient>
        <radialGradient id="glowGradient" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={glowColor} stopOpacity={pulseOpacity} />
          <stop offset="100%" stopColor={glowColor} stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Background silhouette */}
      <g fill="url(#bodyGradient)" stroke="#475569" strokeWidth="1">
        {/* Head */}
        <ellipse
          cx="100"
          cy="40"
          rx="30"
          ry="35"
          className={activeRegion === "head" ? "animate-pulse" : ""}
          fill={activeRegion === "head" ? glowColor : "url(#bodyGradient)"}
          fillOpacity={activeRegion === "head" ? 0.6 : 1}
          filter={activeRegion === "head" ? "url(#glow)" : ""}
        />

        {/* Neck */}
        <rect x="90" y="70" width="20" height="20" rx="5" />

        {/* Torso */}
        <path
          d="M60 90 Q50 95 45 130 L45 200 Q45 220 60 230 L80 240 L120 240 L140 230 Q155 220 155 200 L155 130 Q150 95 140 90 Z"
          className={activeRegion === "torso" ? "animate-pulse" : ""}
          fill={activeRegion === "torso" ? glowColor : "url(#bodyGradient)"}
          fillOpacity={activeRegion === "torso" ? 0.6 : 1}
          filter={activeRegion === "torso" ? "url(#glow)" : ""}
        />

        {/* Chest highlight area */}
        <ellipse
          cx="100"
          cy="140"
          rx="35"
          ry="40"
          fill={activeRegion === "chest" ? glowColor : "transparent"}
          fillOpacity={activeRegion === "chest" ? pulseOpacity : 0}
          filter={activeRegion === "chest" ? "url(#glow)" : ""}
        />

        {/* Heart indicator */}
        <circle
          cx="85"
          cy="130"
          r="12"
          fill={scores.cardiac > 30 ? "#ef4444" : "#475569"}
          fillOpacity={scores.cardiac > 30 ? pulseOpacity + 0.3 : 0.5}
          filter={scores.cardiac > 30 ? "url(#glow)" : ""}
        />

        {/* Left Arm */}
        <path
          d="M45 95 Q25 100 20 130 L15 200 Q10 210 15 220 L20 225 Q25 230 30 225 L35 200 L40 130 Q42 115 45 95"
          className={activeRegion === "arms" ? "animate-pulse" : ""}
          fill={activeRegion === "arms" ? glowColor : "url(#bodyGradient)"}
          fillOpacity={activeRegion === "arms" ? 0.6 : 1}
        />

        {/* Right Arm */}
        <path
          d="M155 95 Q175 100 180 130 L185 200 Q190 210 185 220 L180 225 Q175 230 170 225 L165 200 L160 130 Q158 115 155 95"
          className={activeRegion === "arms" ? "animate-pulse" : ""}
          fill={activeRegion === "arms" ? glowColor : "url(#bodyGradient)"}
          fillOpacity={activeRegion === "arms" ? 0.6 : 1}
        />

        {/* Left Leg */}
        <path
          d="M70 235 L60 320 Q55 360 60 380 L70 385 Q80 388 85 380 L90 320 L85 245"
          className={activeRegion === "legs" ? "animate-pulse" : ""}
          fill={activeRegion === "legs" ? glowColor : "url(#bodyGradient)"}
          fillOpacity={activeRegion === "legs" ? 0.6 : 1}
        />

        {/* Right Leg */}
        <path
          d="M115 245 L110 320 Q105 360 110 380 L120 385 Q130 388 135 380 L140 320 L130 235"
          className={activeRegion === "legs" ? "animate-pulse" : ""}
          fill={activeRegion === "legs" ? glowColor : "url(#bodyGradient)"}
          fillOpacity={activeRegion === "legs" ? 0.6 : 1}
        />
      </g>

      {/* Pulse rings for affected area */}
      {activeRegion === "chest" && (
        <>
          <circle
            cx="100"
            cy="140"
            r="50"
            fill="none"
            stroke={glowColor}
            strokeWidth="2"
            strokeOpacity={pulseOpacity * 0.5}
          />
          <circle
            cx="100"
            cy="140"
            r="65"
            fill="none"
            stroke={glowColor}
            strokeWidth="1"
            strokeOpacity={pulseOpacity * 0.3}
          />
        </>
      )}

      {activeRegion === "head" && (
        <>
          <circle
            cx="100"
            cy="40"
            r="45"
            fill="none"
            stroke={glowColor}
            strokeWidth="2"
            strokeOpacity={pulseOpacity * 0.5}
          />
        </>
      )}

      {/* Region labels */}
      <g className="text-xs" fill="#94a3b8">
        <text x="100" y="45" textAnchor="middle" className="text-[10px]">
          {activeRegion === "head" && "●"}
        </text>
        <text x="100" y="145" textAnchor="middle" className="text-[10px]">
          {activeRegion === "chest" && "●"}
        </text>
      </g>
    </svg>
  )
}
