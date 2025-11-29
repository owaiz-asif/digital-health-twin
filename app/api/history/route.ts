import { NextResponse } from "next/server"
import { getAnalysisHistory, deleteAnalysis, saveAnalysis } from "@/lib/storage"

export async function GET() {
  try {
    const history = getAnalysisHistory()
    return NextResponse.json({ history })
  } catch (error) {
    console.error("History fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const analysis = await request.json()
    const id = saveAnalysis(analysis)
    return NextResponse.json({ success: true, id })
  } catch (error) {
    console.error("Save history error:", error)
    return NextResponse.json({ error: "Failed to save analysis" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "ID required" }, { status: 400 })
    }

    const success = deleteAnalysis(id)
    return NextResponse.json({ success })
  } catch (error) {
    console.error("Delete history error:", error)
    return NextResponse.json({ error: "Failed to delete analysis" }, { status: 500 })
  }
}
