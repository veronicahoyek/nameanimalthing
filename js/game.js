document.addEventListener("DOMContentLoaded", () => {
    const urlParams = new URLSearchParams(window.location.search);
    const categories = urlParams.get("categories");
    const categoriesContainer = document.querySelector(".categories-container");

    if (categories) {
        const categoriesArray = categories.split(",");
        categoriesArray.forEach((category) => {
            const categoryField = document.createElement("input");
            categoryField.setAttribute("type", "text");
            categoryField.setAttribute("placeholder", category);
            categoriesContainer.appendChild(categoryField);
        });
    }
});
