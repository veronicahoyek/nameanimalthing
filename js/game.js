// game.js
const socket = io();
const urlParams = new URLSearchParams(window.location.search);
const roomCode = urlParams.get("roomCode");

socket.emit("joinRoom", roomCode);

window.addEventListener("load", async () => {
  const response = await fetch(`/api/waitingroom?roomCode=${roomCode}`);
  const data = await response.json();

  document.querySelector(
    "#roomCode"
  ).textContent = `Game Room #${data.game.roomCode}`;
  document.querySelector("#letter").textContent = `Letter: ${
    data.game.rounds[data.game.currentRound - 1].letter
  }`;

  data.game.categories.forEach((category) => {
    const div = document.createElement("div");
    div.className = "category";

    const label = document.createElement("label");
    label.textContent = category;
    label.htmlFor = category;

    const input = document.createElement("input");
    input.type = "text";
    input.id = category;
    input.name = category;

    div.appendChild(label);
    div.appendChild(input);

    document.querySelector("#categories").appendChild(div);
  });
});

document.querySelector("#gameForm").addEventListener("submit", (event) => {
  event.preventDefault();

  const formData = new FormData(event.target);
  const answers = Object.fromEntries(formData.entries());

  fetch("/api/submitanswers", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ roomCode, answers }),
    credentials: "include",
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        // Handle success (e.g. show a message, wait for next round, etc.)
      } else {
        console.error("Failed to submit answers");
      }
    });
});

socket.on("nextRound", (data) => {
  // Handle the start of the next round (e.g. update the letter, clear the form, etc.)
});
