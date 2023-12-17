const socket = io();

const form = document.querySelector(".create-game-form");
form.addEventListener("submit", (event) => {
  event.preventDefault();

  const rounds = document.querySelector("#rounds").value;
  const categories = Array.from(
    document.querySelectorAll('input[name="category"]:checked')
  ).map((input) => input.value);

  socket.emit("create", { rounds, categories }, (response) => {
    if (response.error) {
      alert(response.error);
    } else {
      console.log(response);
    }
  });
});
