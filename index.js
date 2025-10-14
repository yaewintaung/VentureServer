import ollama from "ollama";
import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import cors from "cors";

import fs from "fs";
import { GenerateOpenRouter } from "./openRouter.js";

const userDataFile = "./data/userData.json";

if (!fs.existsSync(userDataFile)) fs.writeFileSync(userDataFile, "{}");

const app = express();

app.use(cors());
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, "public")));

function loadMemory() {
  return JSON.parse(fs.readFileSync(userDataFile, "utf-8"));
}
function saveMemory(data) {
  fs.writeFileSync(userDataFile, JSON.stringify(data, null, 2));
}

const GenerateTasks = async (topic) => {
  const response = await ollama.chat({
    model: "mistral",
    messages: [
      {
        role: "system",
        content: `You are a productivity assistant. 
        notes: if your prompt is not a task type prompt return [{task:"error"}]
        Generate this format [{task:"value"}]
        Output must be only json object array
         (with no extra words in your answer) 
        of 5 daily small tasks titles (short text possible)  by the user's prompt
        `,
      },
      {
        role: "user",
        content: `${topic}`,
      },
    ],
  });
  const content = response.message.content;
  console.log(content);

  return JSON.parse(content);
};

app.post("/generate-tasks", async (req, res) => {
  const { topic, model } = req.body;

  try {
    let tasks;
    switch (model) {
      case "mistral":
        tasks = await GenerateTasks(topic);
        console.log("mistral-");

        break;
      case "gpt-4o":
        tasks = await GenerateOpenRouter(topic);
        console.log("gpt-4o hi");

        break;

      default:
        break;
    }

    res.json({ topic, tasks });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate tasks" });
  }
});

app.post("/create-user", async (req, res) => {
  const { user_data } = req.body;
});

const PORT = 3000;
app.listen(PORT, () =>
  console.log(`✅ Server running on http://localhost:${PORT}`)
);
