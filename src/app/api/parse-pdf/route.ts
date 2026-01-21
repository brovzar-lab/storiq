import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { parseScreenplayText } from "@/lib/parser";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const buffer = Buffer.from(await request.arrayBuffer());
    const filename = decodeURIComponent(
      request.headers.get("X-Filename") || "screenplay.pdf"
    );

    // Dynamic import pdf-parse v1 (simpler API, no worker issues)
    const pdfParse = (await import("pdf-parse")).default;

    // Parse the PDF buffer directly
    const data = await pdfParse(buffer);
    const text = data.text;
    const actualPageCount = data.numpages || 1;

    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { message: "Could not extract text from PDF. Make sure it's a searchable PDF, not a scanned image." },
        { status: 400 }
      );
    }

    // Parse screenplay structure, passing actual page count
    const parsedData = parseScreenplayText(text, filename, actualPageCount);

    // Add metadata
    const screenplay = {
      id: uuidv4(),
      uploadedAt: new Date().toISOString(),
      ...parsedData,
    };

    // Validate we got some content
    if (screenplay.scenes.length === 0) {
      return NextResponse.json(
        {
          message:
            "Could not identify any scenes. Make sure the screenplay uses standard formatting (INT./EXT. headers).",
        },
        { status: 400 }
      );
    }

    return NextResponse.json(screenplay);
  } catch (error) {
    console.error("PDF parsing error:", error);
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Failed to parse PDF. Please try a different file.",
      },
      { status: 500 }
    );
  }
}
