const topicInput = document.getElementById("topic");
const generateBtn = document.getElementById("generate");
const taskList = document.getElementById("task-list");
let model = "mistral";

generateBtn.addEventListener("click", async () => {
  const topic = topicInput.value.trim();
  if (!topic) return alert("Please enter a topic!");

  taskList.innerHTML = "<li>Generating tasks...</li>";

  try {
    const res = await fetch("/generate-tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic, model: model }),
    });
    const data = await res.json();

    taskList.innerHTML = "";
    data.tasks.forEach((task) => {
      console.log(task);

      const li = document.createElement("li");
      li.innerHTML = `<input type="checkbox"> <span>${task.title}</span>`;
      li.querySelector("input").addEventListener("change", (e) => {
        li.classList.toggle("completed", e.target.checked);
      });
      taskList.appendChild(li);
    });
  } catch (error) {
    taskList.innerHTML = "<li>⚠️ Failed to generate tasks</li>";
  }
});

document.addEventListener("DOMContentLoaded", () => {
  const selectBox = document.getElementById("color-select");

  selectBox.addEventListener("change", (event) => {
    const selectedValue = event.target.value;
    model = selectedValue;
  });
});
