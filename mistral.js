import ollama from "ollama";
import { prompt2 } from "./prompts.js";
import { parseAIJSON } from "./util/helper.js";

const GenerateTasks = async (topic, model) => {
  const response = await ollama.chat({
    model: model,
    messages: [
      {
        role: "system",
        content: `${prompt2}`,
      },
      {
        role: "user",
        content: `
          Now, generate tasks for this user goal: "${topic}"

        `,
      },
    ],
  });
  const content = response.message.content;
  console.log(content);

  return JSON.parse(content);
};

export function formatUserTasksForAI(user) {
  if (!user || !Array.isArray(user.groups)) return "No groups found.";

  let output = `User: ${user.username}\nEmail: ${user.email}\n\nTask Overview:\n`;

  for (const group of user.groups) {
    output += `\n📘 Group: ${group.group_title}\n`;

    if (!group.subTasks?.length) {
      output += "  (No subtasks)\n";
      continue;
    }

    for (const sub of group.subTasks) {
      output += `  📂 SubTask: ${sub.title}\n`;

      if (!sub.tasks?.length) {
        output += "    (No tasks)\n";
        continue;
      }

      for (const task of sub.tasks) {
        const date = new Date(task.date).toLocaleDateString();
        output += `    - ${task.title} [${
          task.completed ? "✅ Done" : "❌ Pending"
        } | Date: ${date}]\n`;
      }
    }
  }

  return output.trim();
}

export const NormalResponseMistral = async (user, prompt, model) => {
  const response = await ollama.chat({
    model: model,
    messages: [
      {
        role: "system",
        content: `
        this is all user information in this system -
          user: ${formatUserTasksForAI(user)}

          you have to answer by this user data to questions,
          if user is undefined just say you are not authenticated
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
  const content = response.message.content;
  return content;
};

export default GenerateTasks;
