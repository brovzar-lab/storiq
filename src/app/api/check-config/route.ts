import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const anthropicKey = process.env.STORIQ_ANTHROPIC_KEY;
  const googleKey = process.env.GOOGLE_API_KEY;
  const defaultProvider = process.env.AI_PROVIDER;

  // Debug: log to see what's happening
  console.log("check-config: TEST_VAR:", process.env.TEST_VAR);
  console.log("check-config: ANTHROPIC_API_KEY exists:", !!anthropicKey);
  console.log("check-config: ANTHROPIC_API_KEY starts with:", anthropicKey?.substring(0, 10));
  console.log("check-config: All env keys:", Object.keys(process.env).filter(k => k.includes('ANTHROP') || k.includes('TEST')));

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
