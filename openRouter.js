import OpenAI from "openai";
import { prompt2 } from "./prompts.js";
import dotenv from "dotenv";
import { parseAIJSON } from "./util/helper.js";

dotenv.config();

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPEN_ROUTER_KEY,
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
  return parseAIJSON(completion.choices[0].message.content);
}
