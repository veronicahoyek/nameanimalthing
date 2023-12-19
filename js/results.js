document.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);
  const roomCode = urlParams.get("roomCode");

  // Make an AJAX request to the /api/getresults endpoint
  fetch(`/api/getresults?roomCode=${roomCode}`)
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        const playerResponses = data.playerResponses;

        // Get the container element in the results.html file
        const container = document.querySelector(".players-results");

        // Clear the container
        container.innerHTML = "";

        // Loop through the playerResponses and create HTML elements to display the data
        playerResponses.forEach((response) => {
          const playerElement = document.createElement("div");
          playerElement.classList.add("player-result");

          const playerNameElement = document.createElement("span");
          playerNameElement.classList.add("player-name");
          playerNameElement.textContent = response.player;

          const totalGradeElement = document.createElement("span");
          totalGradeElement.classList.add("total-grade");

          // Calculate the sum of grades for the player
          const grades = response.totalGrade.grades;
          let sum = 0;
          grades.forEach((grade) => {
            sum += parseInt(grade.grade);
          });

          totalGradeElement.textContent = sum;

          // Append the playerNameElement and totalGradeElement to the playerElement
          playerElement.appendChild(playerNameElement);
          playerElement.appendChild(totalGradeElement);

          // Append the playerElement to the container
          container.appendChild(playerElement);

          // Check if the current player is the user and if they won the game
          if (response.player === "username" && sum > 0) {
            // Update the user's information
            fetch("/api/updateuser", {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ won: true }),
            })
              .then((response) => response.json())
              .then((data) => {
                if (data.success) {
                  console.log("User updated successfully");
                } else {
                  console.log("Error updating user: " + data.message);
                }
              })
              .catch((error) => {
                console.log("Error updating user: " + error);
              });
          }
        });
      } else {
        console.log("Error: " + data.message);
      }
    })
    .catch((error) => {
      console.log("Error: " + error);
    });
});
