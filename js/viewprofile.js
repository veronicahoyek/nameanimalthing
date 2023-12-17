let originalUsername, originalEmail;

fetch("/api/user")
  .then((response) => response.json())
  .then((user) => {
    originalUsername = user.username;
    originalEmail = user.email;

    document.getElementById("username").value = originalUsername;
    document.getElementById("email").value = originalEmail;
    document.getElementById("profile-pic").src =
      user.profilePic || "../ressources/pfp.png";
    document.getElementById("games-played").innerText = user.gamesPlayed || 0;
    document.getElementById("games-won").innerText = user.gamesWon || 0;
    document.getElementById("games-lost").innerText = user.gamesLost || 0;
    document.getElementById("winning-percentage").innerText =
      user.winningPercentage || "0%";
  })
  .catch((error) => console.error("Error:", error));

document.querySelectorAll(".edit-button").forEach((button) => {
  button.addEventListener("click", (event) => {
    const input = event.target.parentElement.querySelector("input");
    input.disabled = !input.disabled;

    if (!input.disabled) {
      event.target.textContent = "Save";
    } else {
      event.target.textContent = "Edit";

      const username = document.getElementById("username").value;
      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;

      const requestBody = {};

      if (username !== originalUsername && username !== "") {
        requestBody.username = username;
      }

      if (email !== originalEmail && email !== "") {
        requestBody.email = email;
      }

      if (password !== "********" && password !== "") {
        requestBody.password = password;
      }

      if (Object.keys(requestBody).length > 0) {
        fetch("/api/user", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        })
          .then((response) => response.json())
          .then((data) => {
            if (data.success) {
              alert(data.message);
            } else {
              console.error("Error:", data.message);
            }
          })
          .catch((error) => console.error("Error:", error));
      } else {
        alert("No changes made");
      }
    }
  });
});
