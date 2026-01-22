import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const anthropicKey = process.env.STORIQ_ANTHROPIC_KEY;
  const googleKey = process.env.GOOGLE_API_KEY;
  const defaultProvider = process.env.AI_PROVIDER;

  let provider: string | null = null;
  let isConfigured = false;

  if (defaultProvider === "google" && googleKey) {
    provider = "Google Gemini";
    isConfigured = true;
  } else if (anthropicKey) {
    provider = "Anthropic Claude";
    isConfigured = true;
  } else if (googleKey) {
    provider = "Google Gemini";
    isConfigured = true;
  }

  return NextResponse.json({
    isConfigured,
    provider,
    source: isConfigured ? "server" : null,
  });
}
