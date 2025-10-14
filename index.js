import ollama from "ollama";
import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import cors from "cors";
import { GenerateOpenRouter } from "./openRouter.js";

const app = express();

app.use(cors());
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, "public")));

const GenerateTasks = async (topic) => {
  const response = await ollama.chat({
    model: "mistral",
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
  return JSON.parse(response.message.content);
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

const PORT = 3000;
app.listen(PORT, () =>
  console.log(`✅ Server running on http://localhost:${PORT}`)
);
