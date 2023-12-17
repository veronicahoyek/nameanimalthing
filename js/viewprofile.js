fetch("/user")
  .then((response) => response.json())
  .then((data) => {
    if (data.success) {
      // Populate the page with the user data
      document.getElementById("username").value = data.user.username;
      document.getElementById("email").value = data.user.email;
      // Other fields...
    } else {
      console.error(data.message);
    }
  })
  .catch((error) => console.error("Error:", error));
