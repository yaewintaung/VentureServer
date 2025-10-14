import OpenAI from "openai";

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
        content: `You are a productivity assistant. 
        Generate [{task:"value"}]
        Output must be only json array
         (with no extra words in your answer) 
        of 5 daily small tasks titles (short text possible)  by the user's prompt`,
      },
      {
        role: "user",
        content: `${topic}`,
      },
    ],
  });

  return JSON.parse(completion.choices[0].message.content);
}
