import cron from "node-cron";

const tasks = [
  {
    title: "Submit report",
    dueDate: new Date("2025-10-14T14:30:00"),
    triggered: false,
  },
];

cron.schedule("* * * * *", () => {
  // check every minute
  const now = new Date();
  tasks.forEach((task) => {
    const diff = task.dueDate - now;
    if (!task.triggered && diff <= 30 * 1000 && diff > 0) {
      console.log(`⚡ Task due: ${task.title}`);
      task.triggered = true;
    }
  });
});
24 * 60 * 60 * 1000

