import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const analysis = await request.json()

    // Generate HTML content for PDF
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Digital Health Twin Report</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 40px;
      color: #333;
      line-height: 1.6;
    }
    h1 {
      color: #0891b2;
      border-bottom: 2px solid #0891b2;
      padding-bottom: 10px;
    }
    h2 {
      color: #475569;
      margin-top: 30px;
    }
    .header {
      text-align: center;
      margin-bottom: 40px;
    }
    .section {
      margin: 20px 0;
      padding: 15px;
      background: #f8fafc;
      border-radius: 8px;
    }
    .scores {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 10px;
      text-align: center;
    }
    .score-item {
      padding: 10px;
      background: white;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
    }
    .score-value {
      font-size: 24px;
      font-weight: bold;
      color: #0891b2;
    }
    .vitals {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
    }
    .vital-item {
      padding: 8px;
      background: white;
      border-radius: 4px;
    }
    ul {
      padding-left: 20px;
    }
    li {
      margin: 8px 0;
    }
    .disclaimer {
      margin-top: 40px;
      padding: 15px;
      background: #fef3c7;
      border: 1px solid #f59e0b;
      border-radius: 8px;
      font-size: 12px;
    }
    .footer {
      margin-top: 40px;
      text-align: center;
      font-size: 10px;
      color: #94a3b8;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Digital Health Twin Report</h1>
    <p>Generated: ${new Date(analysis.timestamp).toLocaleString()}</p>
  </div>

  <div class="section">
    <h2>Vital Signs</h2>
    <div class="vitals">
      <div class="vital-item"><strong>Heart Rate:</strong> ${analysis.vitals.heartRate} BPM</div>
      <div class="vital-item"><strong>Blood Pressure:</strong> ${analysis.vitals.systolic}/${analysis.vitals.diastolic} mmHg</div>
      <div class="vital-item"><strong>SpO2:</strong> ${analysis.vitals.spo2}%</div>
      <div class="vital-item"><strong>Temperature:</strong> ${analysis.vitals.temperature}°F</div>
    </div>
  </div>

  <div class="section">
    <h2>Risk Assessment Scores</h2>
    <div class="scores">
      <div class="score-item">
        <div class="score-value">${analysis.scores.cardiac}%</div>
        <div>Cardiac</div>
      </div>
      <div class="score-item">
        <div class="score-value">${analysis.scores.respiratory}%</div>
        <div>Respiratory</div>
      </div>
      <div class="score-item">
        <div class="score-value">${analysis.scores.infection}%</div>
        <div>Infection</div>
      </div>
      <div class="score-item">
        <div class="score-value">${analysis.scores.stress}%</div>
        <div>Stress</div>
      </div>
      <div class="score-item">
        <div class="score-value">${analysis.scores.neurological}%</div>
        <div>Neurological</div>
      </div>
    </div>
  </div>

  <div class="section">
    <h2>Analysis Summary</h2>
    <p><strong>Affected Region:</strong> ${analysis.affectedRegion}</p>
    <p>${analysis.explanation}</p>
  </div>

  <div class="section">
    <h2>Recommended Precautions</h2>
    <ul>
      ${analysis.precautions.map((p: string) => `<li>${p}</li>`).join("")}
    </ul>
  </div>

  <div class="section">
    <h2>When to Seek Medical Help</h2>
    <p>${analysis.seekHelpWhen}</p>
  </div>

  <div class="section">
    <h2>Questions for Your Doctor</h2>
    <ol>
      ${analysis.doctorQuestions.map((q: string) => `<li>${q}</li>`).join("")}
    </ol>
  </div>

  <div class="disclaimer">
    <strong>Important Disclaimer:</strong> ${analysis.disclaimer}
  </div>

  <div class="footer">
    <p>Data Integrity Hash: ${analysis.blockchainHash}</p>
    <p>Digital Health Twin System - For Informational Purposes Only</p>
  </div>
</body>
</html>
    `

    // Return HTML as downloadable file (browser can print to PDF)
    return new NextResponse(htmlContent, {
      headers: {
        "Content-Type": "text/html",
        "Content-Disposition": `attachment; filename="health-report-${new Date().toISOString().split("T")[0]}.html"`,
      },
    })
  } catch (error) {
    console.error("PDF generation error:", error)
    return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 })
  }
}
