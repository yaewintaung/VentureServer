export function parseAIJSON(aiResponse) {
  try {
    // Try to extract the first JSON block using regex
    const jsonMatch = aiResponse.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    if (!jsonMatch) return null;

    const jsonStr = jsonMatch[0];

    // Parse the extracted JSON
    return JSON.parse(jsonStr);
  } catch (err) {
    console.error("Failed to parse AI JSON:", err);
    return null;
  }
}
