import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { parseScreenplayText } from "@/lib/parser";
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";
import type { TextItem } from "pdfjs-dist/types/src/display/api";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Disable worker for serverless environment
GlobalWorkerOptions.workerSrc = "";

export async function POST(request: NextRequest) {
  try {
    const buffer = Buffer.from(await request.arrayBuffer());
    const filename = decodeURIComponent(
      request.headers.get("X-Filename") || "screenplay.pdf"
    );

    // Load PDF document using pdfjs-dist
    const uint8Array = new Uint8Array(buffer);
    const pdf = await getDocument({
      data: uint8Array,
      useSystemFonts: true,
      disableFontFace: true,
    }).promise;

    const actualPageCount = pdf.numPages;

    // Extract text from all pages
    const textParts: string[] = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .filter((item): item is TextItem => "str" in item)
        .map((item) => item.str)
        .join(" ");
      textParts.push(pageText);
    }

    const text = textParts.join("\n\n");

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
