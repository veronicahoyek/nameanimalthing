window.addEventListener("load", async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const roomCode = urlParams.get("roomCode");

  const response = await fetch(`/api/waitingroom?roomCode=${roomCode}`);
  const data = await response.json();

  console.log(data);
  document.querySelector("h2").textContent = `Room #${data.roomCode}`;

  data.players.forEach((player) => {
    const userAvatarDiv = document.createElement("div");
    userAvatarDiv.className = "user-avatar";

    const img = document.createElement("img");
    img.src = "../ressources/pfp.png";
    img.alt = `User Avatar ${player.username}`;

    const p = document.createElement("p");
    p.textContent = player.username;

    userAvatarDiv.appendChild(img);
    userAvatarDiv.appendChild(p);

    document.querySelector(".user-grid").appendChild(userAvatarDiv);

    if (data.isCreator) {
      document.querySelector(".button").style.display = "block";
    } else {
      document.querySelector(".button").style.display = "none";
    }
  });
});
