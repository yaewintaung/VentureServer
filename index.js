import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import cors from "cors";
import TelegramBot from "node-telegram-bot-api";
import cron from "node-cron";

import fs from "fs";
import { GenerateOpenRouter } from "./openRouter.js";
import GenerateTasks, { NormalResponseMistral } from "./mistral.js";
import { ulid } from "ulid";

const userDataFile = "./data/userData.json";
const bot_token = process.env.BOT_TOKEN;
const url = process.env.WEB_URL;

if (!fs.existsSync(userDataFile)) fs.writeFileSync(userDataFile, "[]");

const app = express();
const bot = new TelegramBot(bot_token);
const webhookPath = `/bot${bot_token}`;
bot.setWebHook(`${url}${webhookPath}`);

app.use(cors());
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// app.get("/home", express.static(path.join(__dirname, "public")));

function loadMemory() {
  if (!fs.existsSync(userDataFile)) return [];
  const fileData = fs.readFileSync(userDataFile, "utf8");
  try {
    return JSON.parse(fileData || "[]");
  } catch {
    return [];
  }
}
function saveMemory(data) {
  try {
    fs.writeFileSync(userDataFile, JSON.stringify(data, null, 2));
  } catch (err) {
    console.log(err);
  }
}

app.post(webhookPath, (req, res) => {
  if (!req.body) {
    console.error("❌ Empty update received");
    return res.sendStatus(400);
  }

  try {
    bot.processUpdate(req.body);
  } catch (err) {
    console.error("Error processing update:", err);
  }

  res.sendStatus(200);
  res.sendStatus(200);
});

app.post("/generate-tasks", async (req, res) => {
  const { topic, model } = req.body;

  try {
    let tasks;
    switch (model) {
      case "mistral":
        console.log("mistral");
        tasks = await GenerateTasks(topic, "mistral");
        break;
      case "gemma3:12b":
        console.log("gemma3:12b");
        tasks = await GenerateTasks(topic, "gemma3:12b");
        break;
      case "gpt-4o":
        console.log("gpt-4o");
        tasks = await GenerateOpenRouter(topic);
        break;
      case "deepseek-r1:8b":
        console.log("deepseek-r1:8b");
        tasks = await GenerateTasks(topic, "deepseek-r1:8b");
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
  const user_data = req.body;
  const user_list = loadMemory();
  const existing_user = user_list.find((u) => u.email === user_data.email);

  if (existing_user != null || existing_user != undefined) {
    return res.status(400).json({ error: "user already exist" });
  } else {
    user_data.id = ulid();
    user_list.push(user_data);
    saveMemory(user_list);
  }

  res.json({ message: "created", user_data });
});

app.post("/create-task", async (req, res) => {
  const { user_id, group_id, title, date } = req.body;
  if (!user_id || !group_id || !title)
    return res.status(400).json({ error: "Missing data" });
  const user_list = loadMemory();
  const existing_user = user_list.find((u) => u.id === user_id);
  if (existing_user) {
    const group = existing_user.groups.find((g) => g.id === group_id);
    if (!group) return res.status(404).json({ error: "Group not found" });
    const subTask = { id: ulid(), title, task: [] };
    if (Array.isArray(group.subTasks)) {
      group.subTasks.push(subTask);
    } else {
      group.subTasks = [];
      group.subTasks.push(subTask);
    }
    saveMemory(user_list);
    res.status(201).json({ message: "task have been added" });
  } else {
    res.status(404).json({ error: "user not found" });
  }
});

app.post("/set-ai-tasks", async (req, res) => {
  const { user_id, ai_group } = req.body;
  if (!ai_group.group_title || !Array.isArray(ai_group.subTasks)) {
    return res.status(400).json({ error: "Invalid task group format" });
  }
  const data = loadMemory();

  let user = data.find((u) => u.id === user_id);
  if (!user) {
    res.status(404).json({ message: "user not found" });
  }
  const group = {
    id: ulid(),
    group_title: ai_group.group_title,
    accepted: false,
    subTasks: ai_group.subTasks.map((sub) => ({
      id: ulid(),
      title: sub.title,
      tasks: sub.tasks.map((task) => ({
        id: ulid(),
        title: task.title,
        completed: task.completed || false,
        date: task.date || new Date().toISOString().split("T")[0],
      })),
    })),
  };

  if (Array.isArray(user.groups)) {
    user.groups.push(group);
  } else {
    user.groups = [];
    user.groups.push(group);
  }
  saveMemory(data);

  res.status(201).json(group);
});

app.post("/set-accept-group", (req, res) => {
  try {
    const { user_id, group_id } = req.body;
    const data = loadMemory();
    const existing_user = data.find((u) => u.id == user_id);
    if (existing_user == undefined) {
      return res.status(404).json({ error: "existing_ser not found" });
    }
    const { groups, ...user } = existing_user;
    const group = groups.find((g) => g.id == group_id);
    if (!group) {
      return res.status(404).json({ error: "group not found" });
    }

    group.accepted = true;
    saveMemory(data);
    res.status(200).json({ message: "group accepted", group });
  } catch (error) {
    console.log(error);
  }
});

app.delete("/delete-group/:user_id/:group_id", (req, res) => {
  try {
    const { user_id, group_id } = req.params;
    const data = loadMemory();
    let existing_user = data.find((u) => u.id == user_id);
    if (existing_user == undefined) {
      return res.status(404).json({ error: "existing_ser not found" });
    }
    let { groups, ...user } = existing_user;
    groups = groups.filter((g) => g.id !== group_id);
    existing_user.groups = groups;
    saveMemory(data);
    res.status(200).json({ message: "group deleted" });
  } catch (error) {
    console.log(error);
  }
});

app.put("/update-group/:user_id/:group_id", async (req, res) => {
  try {
    const { new_group } = req.body;
    const { user_id, group_id } = req.params;
    const data = loadMemory();
    let existing_user = data.find((u) => u.id == user_id);
    if (existing_user == undefined) {
      return res.status(404).json({ error: "existing_ser not found" });
    }
    // const { groups, ...user } = existing_user;
    let group = existing_user.groups.find((g) => g.id == group_id);
    if (!group) {
      return res.status(404).json({ error: "group not found" });
    }

    const update_group = {
      id: group.id,
      group_title: group.group_title,
      accepted: false,
      subTasks: new_group.subTasks.map((sub) => ({
        id: ulid(),
        title: sub.title,
        tasks: sub.tasks.map((task) => ({
          id: ulid(),
          title: task.title,
          completed: task.completed || false,
          date: task.date || new Date().toISOString().split("T")[0],
        })),
      })),
    };

    existing_user.groups = existing_user.groups.map((g) =>
      g.id === group_id ? update_group : g
    );

    saveMemory(data);

    res.status(201).json(update_group);
  } catch (error) {
    console.log(error);
  }
});

app.post("/create-group", async (req, res) => {
  const { user_id, group_title } = req.body;
  if (!user_id || !group_title)
    return res.status(400).json({ error: "Missing data" });

  const data = loadMemory();

  let user = data.find((u) => u.id === user_id);
  if (!user) {
    res.status(404).json({ message: "user not found" });
  }

  const group = { id: ulid(), group_title, subTasks: [] };
  if (Array.isArray(user.groups)) {
    user.groups.push(group);
  } else {
    user.groups = [];
    user.groups.push(group);
  }
  saveMemory(data);

  res.status(201).json(group);
});

app.post("/user-login", async (req, res) => {
  const { email } = req.body;
  const user_list = loadMemory();
  const existing_user = user_list.find((u) => u.email === email);
  if (existing_user) {
    res.status(201).json({ message: "logged in!", user: existing_user });
  } else {
    res.status(404).json({ error: "user not found" });
  }
});

app.get("/user/:user_id", (req, res) => {
  const { user_id } = req.params;
  const data = loadMemory();
  const existing_user = data.find((u) => u.id == user_id);
  if (existing_user == undefined) {
    return res.status(404).json({ error: "existing_ser not found" });
  }
  const { groups, ...user } = existing_user;
  res.status(200).json({ user });
});

app.get("/groups/:user_id", (req, res) => {
  const { user_id } = req.params;
  const data = loadMemory();
  const existing_user = data.find((u) => u.id == user_id);
  if (existing_user == undefined) {
    return res.status(404).json({ error: "existing_ser not found" });
  }
  const { groups, ...user } = existing_user;
  let sortedTasks;
  if (Array.isArray(groups)) {
    sortedTasks = groups.sort((a, b) => b.id.localeCompare(a.id));
  } else {
    sortedTasks = [];
  }
  res.status(200).json({ groups: sortedTasks });
});

app.get("/groups/:user_id/:group_id", (req, res) => {
  const { user_id, group_id } = req.params;
  const data = loadMemory();
  const existing_user = data.find((u) => u.id == user_id);
  if (existing_user == undefined) {
    return res.status(404).json({ error: "existing_ser not found" });
  }
  const { groups, ...user } = existing_user;
  const group = groups.find((g) => g.id == group_id);
  if (!group) {
    return res.status(404).json({ error: "group not found" });
  }
  res.status(200).json({ group });
});

const now = new Date();

const newTime = new Date(now);
newTime.setMinutes(newTime.getMinutes() + 1);

const tasks = [
  {
    title: "Submit report",
    dueDate: newTime,
    triggered: false,
  },
];

const opts = {
  parse_mode: "Markdown",
  reply_markup: {
    inline_keyboard: [
      [{ text: "✅ Done", callback_data: "done_task" }],
      [{ text: "🕒 Snooze", callback_data: "snooze_task" }],
    ],
  },
};

const done_task = () => {
  console.log("done");
};

const userStates = {};
const users = {};

app.post(`/bot${bot_token}`, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;

  bot.sendMessage(chatId, "👋 Welcome! Please enter your email:");

  userStates[chatId] = { step: "awaiting_user_email" };
});

bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (text.startsWith("/start")) return;
  const state = userStates[chatId];

  if (state?.step === "awaiting_user_email") {
    const data = loadMemory();
    const user = data.find((u) => u.email == text);
    if (!user || user.chatId != null) {
      bot.sendMessage(chatId, `❎ Wrong credential`);
      delete userStates[chatId];
      return;
    } else {
      user.chatId = chatId.toString();
      bot.sendMessage(
        chatId,
        `✅ You are authenticated with email - "${text}"`
      );

      delete userStates[chatId];
      saveMemory(data);
    }
  } else {
    bot.sendChatAction(chatId, "typing");
    const data = loadMemory();
    const user = data.find((u) => u.chatId == chatId);
    if (!user) {
      return bot.sendMessage(chatId, "user not found");
    }
    const content = await NormalResponseMistral(user, text, "mistral");

    bot.sendMessage(chatId, content);
  }
});

cron.schedule("* * * * *", () => {
  // check every minute
  const now = new Date();
  tasks.forEach((task) => {
    const diff = task.dueDate - now;
    if (!task.triggered && diff <= 50 * 1000 && diff > 0) {
      // bot.sendMessage(
      //   1893030957,
      //   `⚡ Task due: ${
      //     task.title
      //   } \n due date: ${task.dueDate.toDateString()}`,
      //   opts
      // );
      task.triggered = true;
    }
  });
});

const PORT = 8080;
app.listen(PORT, () =>
  console.log(`✅ Server running on http://localhost:${PORT}`)
);
