"use client"

import type React from "react"

import { useState, useRef, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ImageIcon, X, Upload, FileImage, Loader2 } from "lucide-react"

type Props = {
  onImageSelect: (imageData: string | null) => void
  selectedImage: string | null
}

export function ImageUpload({ onImageSelect, selectedImage }: Props) {
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const processFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) {
        alert("Please upload an image file (JPEG, PNG, etc.)")
        return
      }

      // Max 10MB
      if (file.size > 10 * 1024 * 1024) {
        alert("Image size must be less than 10MB")
        return
      }

      setIsProcessing(true)

      try {
        const reader = new FileReader()
        reader.onloadend = () => {
          const base64 = reader.result as string
          onImageSelect(base64)
          setIsProcessing(false)
        }
        reader.onerror = () => {
          alert("Failed to read image file")
          setIsProcessing(false)
        }
        reader.readAsDataURL(file)
      } catch {
        alert("Failed to process image")
        setIsProcessing(false)
      }
    },
    [onImageSelect],
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)

      const file = e.dataTransfer.files[0]
      if (file) {
        processFile(file)
      }
    },
    [processFile],
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) {
        processFile(file)
      }
    },
    [processFile],
  )

  const handleRemove = useCallback(() => {
    onImageSelect(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }, [onImageSelect])

  return (
    <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <FileImage className="h-5 w-5 text-cyan-400" />
          <span className="text-sm font-medium text-slate-200">Medical Scan Upload</span>
          <span className="text-xs text-slate-500">(Optional)</span>
        </div>

        {selectedImage ? (
          <div className="relative">
            <div className="relative rounded-lg overflow-hidden border border-slate-600 bg-slate-900">
              <img
                src={selectedImage || "/placeholder.svg"}
                alt="Uploaded medical scan"
                className="w-full h-48 object-contain"
              />
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 h-8 w-8"
                onClick={handleRemove}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-emerald-400 mt-2 flex items-center gap-1">
              <ImageIcon className="h-3 w-3" />
              Image ready for AI analysis
            </p>
          </div>
        ) : (
          <div
            className={`
              border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all
              ${
                isDragging
                  ? "border-cyan-400 bg-cyan-500/10"
                  : "border-slate-600 hover:border-slate-500 hover:bg-slate-700/30"
              }
            `}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
          >
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />

            {isProcessing ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 text-cyan-400 animate-spin" />
                <p className="text-sm text-slate-400">Processing image...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Upload className="h-8 w-8 text-slate-500" />
                <p className="text-sm text-slate-400">Drag & drop or click to upload</p>
                <p className="text-xs text-slate-500">MRI, X-Ray, CT Scan, ECG, etc.</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
