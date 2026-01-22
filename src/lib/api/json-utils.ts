/**
 * JSON parsing and repair utilities for AI responses
 */

/**
 * Repair truncated JSON by closing unclosed brackets and braces
 */
export function repairTruncatedJSON(jsonStr: string): string {
  let repaired = jsonStr.trim();
  let openBraces = 0;
  let openBrackets = 0;
  let inString = false;
  let escapeNext = false;

  // Track braces/brackets while respecting string boundaries
  for (const char of repaired) {
    if (escapeNext) {
      escapeNext = false;
      continue;
    }
    if (char === "\\") {
      escapeNext = true;
      continue;
    }
    if (char === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;

    if (char === "{") openBraces++;
    if (char === "}") openBraces--;
    if (char === "[") openBrackets++;
    if (char === "]") openBrackets--;
  }

  // Close unclosed string
  if (inString) {
    repaired += '"';
  }

  // Remove trailing commas or colons
  repaired = repaired.replace(/,\s*$/, "");
  if (/[,:][\s]*$/.test(repaired)) {
    repaired = repaired.replace(/[,:]\s*$/, "");
  }

  // Close unclosed brackets and braces
  while (openBrackets > 0) {
    repaired += "]";
    openBrackets--;
  }
  while (openBraces > 0) {
    repaired += "}";
    openBraces--;
  }

  return repaired;
}

/**
 * Extract JSON from AI response that may contain markdown code blocks
 */
export function extractJSON(content: string): string {
  // Try to extract from markdown code block first
  const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    return jsonMatch[1].trim();
  }

  // Try to extract raw JSON object
  const rawJsonMatch = content.match(/\{[\s\S]*\}/);
  if (rawJsonMatch) {
    return rawJsonMatch[0];
  }

  // Return original if no JSON found
  return content;
}

/**
 * Parse AI response with automatic repair for truncated JSON
 */
export function parseAIResponseJSON<T>(content: string): T {
  const jsonStr = extractJSON(content);

  try {
    return JSON.parse(jsonStr);
  } catch {
    // Try to repair and parse again
    const repaired = repairTruncatedJSON(jsonStr);
    try {
      return JSON.parse(repaired);
    } catch {
      throw new Error("Failed to parse AI response as JSON");
    }
  }
}
