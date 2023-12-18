const socket = io();

socket.on("gameCreated", (gameData) => {
    const { code, categories } = gameData;

    // Display room code
    document.getElementById("room-code").innerText = code;

    // Display categories with input fields
    const categoryFields = document.getElementById("category-fields");
    categories.forEach((category) => {
        const label = document.createElement("label");
        label.innerText = category;
        const input = document.createElement("input");
        input.setAttribute("type", "text");
        input.setAttribute("name", category.toLowerCase()); // Use category name as input name/id
        input.setAttribute("placeholder", `Enter ${category}`);
        label.appendChild(input);
        categoryFields.appendChild(label);
    });

    // Enable submit button (if needed)
    const submitButton = document.getElementById("submit-answer");
    submitButton.removeAttribute("disabled");
});
