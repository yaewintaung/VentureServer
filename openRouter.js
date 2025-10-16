import OpenAI from "openai";
import { prompt2 } from "./prompts.js";

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey:
    "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",
});

export async function GenerateOpenRouter(topic) {
  const completion = await openai.chat.completions.create({
    model: "openai/gpt-4o",
    messages: [
      {
        role: "system",
        content: `${prompt2}`,
      },
      {
        role: "user",
        content: `Now, generate tasks for this user goal: "${topic}"`,
      },
    ],
  });
  return JSON.parse(completion.choices[0].message.content);
}
