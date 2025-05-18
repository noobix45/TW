document.addEventListener("DOMContentLoaded", function () {
    const tema = localStorage.getItem("tema") || "light"; // default la light
    document.body.classList.add(tema);

    const select = document.getElementById("theme-select");
    if (select) {
        select.value = tema;
    }
});