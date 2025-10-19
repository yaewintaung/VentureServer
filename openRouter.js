import OpenAI from "openai";
import { generalTextPrompt, prompt2 } from "./prompts.js";
import dotenv from "dotenv";
import { parseAIJSON } from "./util/helper.js";
import { formatUserTasksForAI } from "./mistral.js";

dotenv.config();

export async function GenerateOpenRouter(topic, model, key) {
  try {
    const openai = new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: key,
    });

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
  } catch (error) {
    console.log(error.message);
  }
}

export const NormalResponseOpenRouter = async (user, prompt, model, key) => {
  try {
    const openai = new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: key,
    });
    const completion = await openai.chat.completions.create({
      model: model,
      messages: [
        {
          role: "system",
          content: generalTextPrompt(user),
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
  } catch (error) {
    console.log(error.message);
  }
};
