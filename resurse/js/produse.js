let produseInit =[];

window.onload = function(){

    
    let pr = document.getElementsByClassName("produs");
    produseInit=Array.from(pr);
    console.log("window loaded");
    console.log(produseInit);

    let inpPret = document.getElementById("inp-pret");
    let infoRange = document.getElementById("infoRange");

    infoRange.textContent = `(${inpPret.value})`;

    inpPret.addEventListener("input", () => {
        infoRange.textContent = `(${inpPret.value})`;
    });

    btn=document.getElementById("filtrare");
    btn.onclick=function(){
        let inpNume = document.getElementById("inp-nume").value.trim().toLowerCase(); 
        if (/^\d+$/.test(inpNume)) {
            alert("Numele produsului nu poate contine doar cifre.");
            return;
        }

        let vectRadio = document.getElementsByName("gr_rad");
        let inpRating=null;
        let minRating=null;
        let maxRating=null;
        for (let rad of vectRadio)
        {
            if (rad.checked)
            {
                inpRating = rad.value;
                if(inpRating!="toate"){
                    [minRating, maxRating] = inpRating.split(":").map(x => parseFloat(x));
                }
                break;
            }
        }
        let inpPret = document.getElementById("inp-pret").value;
        if (isNaN(inpPret) || inpPret <= 0) {
            alert("Prețul trebuie să fie un număr valid mai mare decât 0.");
            return;
        }

        let inpCategorie = document.getElementById("inp-categorie").value.trim().toLowerCase();

        let selectMultiplu = document.getElementById("inp-categorii-multiple");
        let categoriiSelectate = Array.from(selectMultiplu.selectedOptions).map(opt => opt.value.toLowerCase());

        let inpMateriale = document.getElementById("inp-materiale").value.trim().toLowerCase();
        if(/^\d+$/.test(inpMateriale)){
            alert("Materialele nu pot fi cifre.");
            return;
        }
        let materialeSelectate = inpMateriale.split(',').map(x => x.trim());
        let materialePermise = ["lemn", "mahogany", "walnut", "alder", "spruce", "metal", "plastic", "textil", "poliester"];
        let valid = materialeSelectate.every(material => materialePermise.includes(material));

        if (!valid) {
            alert("Unele dintre materialele selectate nu sunt valide.");
            return;
        }

        let inpCablu = document.getElementById("inp-cablu").checked;

        let materialeSelectate2 = {
            metal: document.querySelector('input[name="metal-opt"]:checked').value,
            plastic: document.querySelector('input[name="plastic-opt"]:checked').value,
            lemn: document.querySelector('input[name="lemn-opt"]:checked').value,
            textil: document.querySelector('input[name="textil-opt"]:checked').value
        };

        let produse = document.getElementsByClassName("produs");
        for(let prod of produse)
        {
            prod.style.display = "none";

            let nume = prod.getElementsByClassName("val-nume")[0].innerHTML.trim().toLowerCase();
            let cuvinte = nume.split(/\s+/);
            let cond1 = cuvinte.some(cuv => cuv.includes(inpNume) || distLevenshtein(cuv, inpNume) <= 2);


            let rating = parseFloat(prod.getElementsByClassName("val-rating")[0].innerHTML.trim());
            let cond2 = (inpRating=="toate" || (minRating<=rating && rating <= maxRating));

            let pret = parseFloat(prod.getElementsByClassName("val-pret")[0].innerHTML.trim());
            let cond3 = (inpPret<=pret);

            let categorie = prod.getElementsByClassName("val-categorie")[0].innerHTML.trim().toLowerCase();
            let cond4 = (inpCategorie == "toate" && categoriiSelectate.length == 0) || 
                        (inpCategorie != "toate" && inpCategorie == categorie) || 
                        (categoriiSelectate.length > 0 && categoriiSelectate.includes(categorie));


            let textCablu = prod.getElementsByClassName("val-cablu")[0].innerHTML.trim().toLowerCase();
            let cabluInclus = (textCablu === "da");
            let cond5 = (!inpCablu || cabluInclus);

            let materialeProdus = prod.getElementsByClassName("val-materiale")[0].innerHTML.trim().toLowerCase().split(',');
            let cond6 = materialeSelectate.every(material => materialeProdus.includes(material));

            // let condMateriale = true;
            let chkMateriale = document.querySelectorAll('input[name="chk-material"]:checked');

            // const materialeCategorii = {
            //     lemn: ["mahogany", "walnut", "alder", "spruce","lemn"],
            //     textil: ["poliester","textil"],
            //     metal: ["metal"],
            //     plastic: ["plastic"]
            // };

            let materialeAre = [];
            let materialeNuAre = [];

            for (let chk of chkMateriale) {
                let material = chk.value;
                let opt = materialeSelectate2[material];

                if (opt === "are") {
                    materialeAre.push(material);
                    // materialeCategorii[material].forEach(mat => materialeAre.push(mat));
                } else if (opt === "nu-are") {
                    materialeNuAre.push(material);
                    // materialeCategorii[material].forEach(mat => materialeNuAre.push(mat));
                }
            }
            let condMateriale = materialeAre.every(mat => materialeProdus.includes(mat)) &&
                    materialeNuAre.every(mat => !materialeProdus.includes(mat));
            let condFinal = cond1 && cond2 && cond3 && cond4 && cond5;

            if (inpMateriale != "") {
                condFinal = condFinal && cond6;
            }
            if (chkMateriale.length > 0) {
                condFinal = condFinal && condMateriale;
            }
            if (condFinal) {
                prod.style.display = "grid";
            }
        }
    }
    document.getElementById("resetare").onclick = function(){
        if (window.confirm("Vrei sa resetezi filtrele?")) {
        document.getElementById("inp-nume").value="";
        document.getElementById("i_rad4").checked=true;
        document.getElementById("inp-cablu").checked=false;
        let inpPret = document.getElementById("inp-pret");
        inpPret.value=0;
        document.getElementById("infoRange").textContent = `(0)`;
        document.getElementById("inp-categorie").value="toate";

        let selectMultiplu = document.getElementById("inp-categorii-multiple");
        for(let opt of selectMultiplu.options){
            opt.selected = false;
        }

        document.getElementById("inp-materiale").value = "";

        let chkMateriale = document.querySelectorAll('input[name = "chk-material"]');
        for(let chk of chkMateriale){
            chk.checked=false;
        }

        let radioMateriale = document.querySelectorAll('#filtru-materiale input[type="radio"][value="are"]');
        for(let rad of radioMateriale){
            rad.checked=true;
        }

        restoreOrder();
    }
}
    document.getElementById("sortCrescNume").onclick=function(){
        sorteaza1(1);
    }
    document.getElementById("sortDescrescNume").onclick=function(){
        sorteaza1(-1);
    }
    function sorteaza1(semn)
    {
        let produse = document.getElementsByClassName("produs");
        let vProduse = Array.from(produse);
        vProduse.sort(function(a,b){
            let pretA = parseFloat(a.getElementsByClassName("val-pret")[0].innerHTML.trim());
            let pretB = parseFloat(b.getElementsByClassName("val-pret")[0].innerHTML.trim());
            if(pretA !=pretB)
                return semn*(pretA-pretB);
            let numeA = a.getElementsByClassName("val-nume")[0].innerHTML.trim().toLowerCase();
            let numeB = b.getElementsByClassName("val-nume")[0].innerHTML.trim().toLowerCase();
            return numeA.localeCompare(numeB);
        })
        for(let prod of vProduse)
        {
            prod.parentNode.appendChild(prod);
        }
    }
    document.getElementById("sortCrescCrit").onclick=function(){
        sorteaza2(1);
    }
    document.getElementById("sortDescCrit").onclick=function(){
        sorteaza2(-1);
    }
    function sorteaza2(semn)
    {
        let produse = document.getElementsByClassName("produs");
        let vProduse = Array.from(produse);
        vProduse.sort(function(a,b){

            let greutateA = parseFloat(a.getElementsByClassName("val-greutate")[0].innerHTML.trim());
            let greutateB = parseFloat(b.getElementsByClassName("val-greutate")[0].innerHTML.trim());
            let pretA = parseFloat(a.getElementsByClassName("val-pret")[0].innerHTML.trim());
            let pretB = parseFloat(b.getElementsByClassName("val-pret")[0].innerHTML.trim());
            if(pretA !=pretB)
                return semn*(greutateA/pretA-greutateB/pretB);
            let categA = a.getElementsByClassName("val-categorie")[0].innerHTML.trim().toLowerCase();
            let categB = b.getElementsByClassName("val-categorie")[0].innerHTML.trim().toLowerCase();
            return categA.localeCompare(categB);
        })
        for(let prod of vProduse)
        {
            prod.parentNode.appendChild(prod);
        }
    }

    function restoreOrder() {
        let produseContainer = document.getElementById("grid-produse");
        while (produseContainer.firstChild) {
            produseContainer.removeChild(produseContainer.firstChild);
        }   
        for (let prod of produseInit) {
            produseContainer.appendChild(prod);
            prod.style.display = "grid";
        }
    }

    window.onkeydown=function(e){
        console.log(e);
        if(e.key=="c" && e.altKey)
        {
            let produse = document.getElementsByClassName("produs");
            sumaPreturi=0;
            for(let prod of produse)
            {
                if(prod.style.display != "none")
                {
                    let pret = parseFloat(prod.getElementsByClassName("val-pret")[0].innerHTML.trim());
                    sumaPreturi+=pret;
                }
            }
            sumaPreturi=parseFloat(sumaPreturi.toFixed(2));
            if(!document.getElementById("suma_preturi")){
                let pRezultat = document.createElement("p");
                pRezultat.innerHTML=sumaPreturi;
                pRezultat.id="suma_preturi"
                let p = document.getElementById("p-suma")
                p.parentNode.insertBefore(pRezultat, p.nextElementSibling)
                setTimeout(function(){
                    let p1 = document.getElementById("suma_preturi");
                    if(p1){
                        p1.remove();
                    }
                },2000)
            }
        }
    }
}

function distLevenshtein(a, b) {
    let dp = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));
    for (let i = 0; i <= a.length; i++) dp[i][0] = i;
    for (let j = 0; j <= b.length; j++) dp[0][j] = j;

    for (let i = 1; i <= a.length; i++) {
        for (let j = 1; j <= b.length; j++) {
            if (a[i - 1] === b[j - 1])
                dp[i][j] = dp[i - 1][j - 1];
            else
                dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
        }
    }
    return dp[a.length][b.length];

    
}