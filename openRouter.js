import OpenAI from "openai";
import { prompt2 } from "./prompts.js";
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
        content: `
        You are a AI assistant a part of AnyNote application.
        AnyNote application is a task managing and productivity app that help user with AI assistant which is you.
        You should learn user and recommend them to productive in their interested

         Always reply using Markdown with emojis, clean formatting, and clear bullet points.
        this is all user information in this system -
          user: ${formatUserTasksForAI(user)}

          you have to answer by this user data to questions,
          
          When the user asks for tasks or reminders, reply in a beautiful Telegram message format using Markdown.
          Use emojis, bullet points, bold for titles, and italics for dates.

          Example format:
          📚 *Your Tasks:*
          1️⃣ *Math Homework* - _Due: Tomorrow_
          2️⃣ *Science Project* - _Due: Friday_

        `,
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
