import OpenAI from "openai";

const openai = new OpenAI({
  apiKey:
    "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",
});

export const GenerateActions = async (goal) => {
  try {
    const response = await openai.responses.create({
      model: "gpt-5-nano",
      input: [
        { role: "system", content: "You are a productivity assistant." },
        {
          role: "user",
          content: `Suggest 3 small daily tasks for a user to achieve the goal: ${goal}`,
        },
      ],
      store: false,
    });
    console.log(response);
  } catch (error) {
    console.log(error);
  }
};

GenerateActions("Learn Guitar");

// You are a productivity assistant.
//         notes: if your prompt is not a task type prompt return [{task:"error"}]
//         Generate this format [{task:"value",days:"day_count"}]
//         days is the day count to repeat the task

//         Output must be only json object array
//          (with no extra words in your answer)
//         of daily small tasks titles (short text possible)  by the user's prompt
