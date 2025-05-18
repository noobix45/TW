window.addEventListener("DOMContentLoaded",function(){  // dupa ce incarca html nu neaprat toate resursele
    const select = document.getElementById("theme-select");
    if(select)
    {
        select.addEventListener("change",function(){
            const temaAleasa = this.value;
            document.body.classList.remove("light","dark","blue");
            document.body.classList.add(temaAleasa);
            localStorage.setItem("tema",temaAleasa);
        });
    }
});