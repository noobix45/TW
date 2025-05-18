window.addEventListener("DOMContentLoaded", function () {
    const select = document.getElementById("theme-select");
    if (select) {
        select.addEventListener("change", function () {
            const temaAleasa = this.value;
            document.body.setAttribute("data-theme", temaAleasa);
            localStorage.setItem("tema", temaAleasa);
        });
    }
});