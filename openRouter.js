import OpenAI from "openai";
import { generalTextPrompt, prompt2 } from "./prompts.js";
import dotenv from "dotenv";
import { parseAIJSON } from "./util/helper.js";
import { formatUserTasksForAI } from "./mistral.js";

dotenv.config();

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPEN_ROUTER_KEY,
});

export async function GenerateOpenRouter(topic, model) {
  const completion = await openai.chat.completions.create({
    model: model,
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

export const NormalResponseOpenRouter = async (user, prompt, model) => {
  const completion = await openai.chat.completions.create({
    model: model,
    messages: [
      {
        role: "system",
        content: generalTextPrompt(),
      },
      {
        role: "user",
        content: `
          ${prompt}
        `,
      },
    ],
  });

  const content = completion.choices[0].message.content;
  return content;
};
