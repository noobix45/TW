document.addEventListener("DOMContentLoaded", function () {
    const tema = localStorage.getItem("tema") || "light"; // default la light
    document.body.setAttribute("data-theme", tema);

    const select = document.getElementById("theme-select");
    if (select) {
        select.value = tema;
    }
});