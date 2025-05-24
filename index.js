const express = require("express");
const path = require("path");
const fs = require("fs");
const sharp = require("sharp");
const sass = require("sass");
const pg = require("pg");
const { generateKey } = require("crypto");

// const AccesBD=require("./module_proprii/accesbd.js")
// AccesBD.getInstanta().select({tabel:"produs",campuri:["*"]},function(err,rez){
//     console.log("----------------AccesBD-------------------");
//     console.log(err);
//     console.log(rez)
// })

const Client=pg.Client;

client=new Client({ //instanta a uni clinet de baze de date
    database:"tw",
    user:"catalin",
    password:"catalin",
    host:"localhost",
    port:5432
})

client.connect()


app = express();

app.use("/resurse",express.static(path.join(__dirname,'resurse')));
app.use("/node_modules",express.static(path.join(__dirname,"node_modules")));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

obGlobal = {
    obErori:null,
    obImagini:null,
    folderScss: path.join(__dirname,"resurse/scss"),
    folderCss: path.join(__dirname,"resurse/css"),
    folderBackup: path.join(__dirname,"backup"),
    optiuniMeniu:null,
    categorii:null,
    produse:null,
    oferte:null,
    seturi:null,
    produseIeftine:null
}

client.query("select * from unnest(enum_range(null::tipuri_produse))", function(err, rezultat){
    console.log(err);
    console.log(rezultat);
    obGlobal.optiuniMeniu=rezultat.rows;
});

client.query("select * from produs", function(err, rezultat ){
    console.log(err)
    console.log("select * from produs:")
    console.log(rezultat)
    obGlobal.produse = rezultat.rows;
});

queryseturi = client.query(`SELECT 
    s.id, 
    s.nume_set, 
    s.descriere_set, 
    json_agg(json_build_object(
      'id', p.id,
      'nume', p.nume,
      'imagine', p.imagine,
      'pret',p.pret
    )) AS produse
  FROM seturi s
  JOIN asociere_set a ON s.id = a.id_set
  JOIN produs p ON a.id_produs = p.id
  GROUP BY s.id`, function(err,rezultat){
    if(err){
        console.error("Eroare la query seturi: ",err);
    }
    else{
        obGlobal.seturi = rezultat.rows;
        console.log("global seturi: ",obGlobal.seturi);
    }
  });

  client.query(`
    SELECT DISTINCT ON (categorie) * 
    FROM produs 
    ORDER BY categorie, pret ASC
`, function(err, rezultat) {
    if (err) {
        console.error("Eroare la query produse ieftine: ", err);
    } else {
        obGlobal.produseIeftine = rezultat.rows;
        console.log("Produse ieftine pe categorii:", obGlobal.produseIeftine);
    }
});


client.query("select * from unnest(enum_range(null::categ_produs))", function(err, rezultat ){
    console.log(err)    
    console.log("select * from unnest:")
    console.log(rezultat)
    obGlobal.categorii = rezultat.rows;

    genereazaOferta();
    setInterval(genereazaOferta, T * 60000);

    console.log("Oferte",obGlobal.oferte);
})

const caleFisierOferte = path.join(__dirname, "resurse/json/oferte.json");
const T=1;
const T2=2;

function incarcaOferteInitiale(){
    try{
        let oferteJson = JSON.parse(fs.readFileSync(caleFisierOferte));
        let acum = new Date();

        oferteJson.oferte = oferteJson.oferte.filter(off=>{
            return (acum-new Date(off["data-finalizare"])) < T2 *60000;
        });
        oferteJson.oferte = oferteJson.oferte.map(off => ({
            ...off,
            "data-incepere": new Date(off["data-incepere"]),
            "data-finalizare": new Date(off["data-finalizare"])
        }));
        fs.writeFileSync(caleFisierOferte,JSON.stringify(oferteJson,null,2));
    }catch(e){
        console.warn("Fisierul oferte.json nu exista, se va crea unul");
        obGlobal.oferte = [];
        fs.writeFileSync(caleFisierOferte, JSON.stringify({ oferte: [] }, null, 2));
    }
}
incarcaOferteInitiale();


function genereazaOferta(){
    console.log("obGlobal categorii", obGlobal.categorii)
    const categorii = obGlobal.categorii?.map(c => c.unnest); //incarca categorii
    console.log("categorii",categorii);
    if(!categorii || categorii.length ==0)
    {
        console.warn("Nu exista categorii in obGlobal.");
        return;
    }

    let oferteJson; // citeste fisierul curent de oferte
    try{
        oferteJson = JSON.parse(fs.readFileSync(caleFisierOferte));
    }catch(e){
        console.warn("Fisierul oferte.json nu exista. Se va crea unul nou");
        oferteJson = {oferte: []};
    }

    let ultimaCategorie = oferteJson.oferte.length > 0 ? oferteJson.oferte[0].categorie : null;
    let categoriiDisponibile = categorii.filter(c => c != ultimaCategorie);

    if(categoriiDisponibile.length == 0) //toate categoriile disponibile diferite de ultima)
    {
        console.warn("Nu exista cateogrii diferite de ultima oferta");
        return;
    }
    let categorieAleasa = categoriiDisponibile[Math.floor(Math.random() * categoriiDisponibile.length)];

    const reduceri = [5,10,15,20,25,30,35,40,45,50];
    const reducere = reduceri[Math.floor(Math.random() * reduceri.length)]; //reducerea

    const dataIncepere = new Date();
    const dataFinalizare = new Date(dataIncepere.getTime() + T2 * 60000);

    const ofertaNoua = {
        categorie: categorieAleasa,
        reducere: reducere,
        "data-incepere": dataIncepere,
        "data-finalizare": dataFinalizare
    }; //oferta noua

    oferteJson.oferte.unshift(ofertaNoua); //adauga oferta

    const acum = new Date();
    oferteJson.oferte = oferteJson.oferte.filter(off => {
        return new Date(off["data-finalizare"]) > acum;
    }); //elimina oferte vechi


    fs.writeFileSync(caleFisierOferte,JSON.stringify(oferteJson,null,2));
    obGlobal.oferte = oferteJson.oferte;
    console.log("Oferta generata: ", ofertaNoua);
}


vect_foldere=["temp","backup","temp1"]
for(let folder of vect_foldere){
    let caleFolder=path.join(__dirname,folder)
    if(!fs.existsSync(caleFolder)){
        fs.mkdirSync(caleFolder)
    }
}

function salveazaBackup(caleFisier){
    let timestamp = Date.now();
    let numeFisCssNoExt = path.basename(caleFisier, ".css");
    let numeBackup = `${numeFisCssNoExt}_${timestamp}.css`;

    //calea catre backup
    let caleBackup = path.join(obGlobal.folderBackup, "resurse/css"); 
    //salvez backup
    fs.copyFileSync(caleFisier,path.join(caleBackup,numeBackup));

    //verific daca sunt mai mult de 15 fisiere le sterg pe cele mai vechi
    let fisiereBackup = fs.readdirSync(caleBackup);
    if(fisiereBackup.length > 15){
        //sortez dupa data
        fisiereBackup.sort((a,b) => fs.statSync(path.join(caleBackup,b)).mtimeMs - fs.statSync(path.join(caleBackup,a)).mtimeMs);

        //sterf fisiere vechi
        while (fisiereBackup.length > 15){
            let fisierDeSters = fisiereBackup.pop();
            fs.unlinkSync(path.join(caleBackup,fisierDeSters));
        }
    }
}

function compileazaScss(caleScss, caleCss){
    try{
        console.log('Compilare SCSS: ', caleScss);
        console.log("cale:",caleCss);
        if(!caleCss){

            let numeFisExt=path.basename(caleScss); //numele fiserului dintr-o cale cu tot cu extensie // folder1/folder2/ceva.txt => basename  = ceva.txt
            let numeFis=numeFisExt.split(".")[0]   /// "a.scss"  -> ["a","scss"]
            caleCss=numeFis+".css";
        }
        
        if (!path.isAbsolute(caleScss))
            caleScss=path.join(obGlobal.folderScss,caleScss )
        if (!path.isAbsolute(caleCss))
            caleCss=path.join(obGlobal.folderCss,caleCss )
        

        let caleBackup=path.join(obGlobal.folderBackup, "resurse/css");
        if (!fs.existsSync(caleBackup)) {
            fs.mkdirSync(caleBackup,{recursive:true})
        }
        
        // la acest punct avem cai absolute in caleScss si  caleCss

        // let numeFisCss=path.basename(caleCss);
        // if (fs.existsSync(caleCss)){
        //     let timestamp = Date.now();
        //     let numeFisCssNoExt = path.basename(caleCss,".css")
        //     let numeBackup = `${numeFisCssNoExt}_${timestamp}.css`;
        //     fs.copyFileSync(caleCss, path.join(obGlobal.folderBackup, "resurse/css",numeBackup ))// +(new Date()).getTime()
        // }

        salveazaBackup(caleCss);

        rez=sass.compile(caleScss, {"sourceMap":true});
        fs.writeFileSync(caleCss,rez.css)
        console.log("Compilare SCSS",rez);
    }
    catch(err){
        console.error("Eroare la compilare scss to css:", err.message);
    }
}
//compileazaScss("a.scss");
//compilare la pornirea serverului
vFisiere=fs.readdirSync(obGlobal.folderScss);
for( let numeFis of vFisiere ){
    if (path.extname(numeFis)==".scss"){
        compileazaScss(numeFis);
    }
}

let timeoutCompilare = {};  //debounce pentru compilare
fs.watch(obGlobal.folderScss, function(eveniment, numeFis){
    console.log(eveniment, numeFis);
    if (eveniment=="change" || eveniment=="rename"){
        let caleCompleta=path.join(obGlobal.folderScss, numeFis);
        if (fs.existsSync(caleCompleta)){

            if (timeoutCompilare[numeFis]){ //daca exista deja un timeout il sterg
                clearTimeout(timeoutCompilare[numeFis]);
            }
            timeoutCompilare[numeFis] = setTimeout(() => { //dupa ce modific un fisier asteapta 100ms
                compileazaScss(caleCompleta);
                delete timeoutCompilare[numeFis]; //dupa ce compiileaza sterge timerul
            }, 500);
            // compileazaScss(caleCompleta);
        }
    }
})

function initErori(){
    let continut = fs.readFileSync(path.join(__dirname,"resurse/json/erori.json")).toString("utf-8");
    
    obGlobal.obErori=JSON.parse(continut)
    
    obGlobal.obErori.eroare_default.imagine=path.join(obGlobal.obErori.cale_baza, obGlobal.obErori.eroare_default.imagine)
    for (let eroare of obGlobal.obErori.info_erori){
        eroare.imagine=path.join(obGlobal.obErori.cale_baza, eroare.imagine)
    }
    console.log(obGlobal.obErori)

}
initErori();


function initImagini(){
    //citeste continutul din directorul galerie sincron, programul asteapta sa termine citirea
    var continut= fs.readFileSync(path.join(__dirname,"resurse/json/galerie.json")).toString("utf-8");

    obGlobal.obImagini=JSON.parse(continut); //din format json in format obiect java script
    let vImagini=obGlobal.obImagini.imagini;

    let caleAbs=path.join(__dirname,obGlobal.obImagini.cale_galerie);
    let caleAbsMediu=path.join(__dirname,obGlobal.obImagini.cale_galerie, "mediu");
    if (!fs.existsSync(caleAbsMediu))
        fs.mkdirSync(caleAbsMediu,{recursive: true});

    //for (let i=0; i< vErori.length; i++ )
    for (let imag of vImagini){
        if(imag.hof){
            imag.cale_relativa=path.join("/", obGlobal.obImagini.cale_galerie, imag.cale_relativa );
            console.log(imag.cale_relativa);
        } //nu vreau sa redimensionez daca imaginile nu sunt din galerie si sunt pentru hof
        else{
        [numeFis, ext]=imag.cale_relativa.split(".");
        let caleFisAbs=path.join(caleAbs,imag.cale_relativa);
        let caleFisMediuAbs=path.join(caleAbsMediu, numeFis+".webp");

        const dirMediu = path.dirname(caleFisMediuAbs);
        if (!fs.existsSync(dirMediu))
            fs.mkdirSync(dirMediu, { recursive: true });

        sharp(caleFisAbs).resize(200).toFile(caleFisMediuAbs);

        imag.fisier_mediu=path.join("/", obGlobal.obImagini.cale_galerie, "mediu",numeFis+".webp" );
        imag.cale_relativa=path.join("/", obGlobal.obImagini.cale_galerie, imag.cale_relativa );
        
        console.log(imag.fisier_mediu);
        console.log(imag.cale_relativa);
        }
    }
    console.log(obGlobal.obImagini)
}
initImagini();


function afisareEroare(res, identificator, titlu, text, imagine){
    let eroare= obGlobal.obErori.info_erori.find(function(elem){ 
                        return elem.identificator==identificator
                    });
    if(eroare){
        if(eroare.status)
            res.status(identificator) //pagina incarcata corect status 200
        var titluCustom=titlu || eroare.titlu;
        var textCustom=text || eroare.text;
        var imagineCustom=imagine || eroare.imagine;


    }
    else{
        var err=obGlobal.obErori.eroare_default
        var titluCustom=titlu || err.titlu;
        var textCustom=text || err.text;
        var imagineCustom=imagine || err.imagine;


    }
    res.render("pagini/eroare", { //transmit obiectul locals
        titlu: titluCustom,
        text: textCustom,
        imagine: imagineCustom
})

}

console.log("Folderul proiectului", __dirname);
console.log("Cale catre fisier index.js", __filename);
console.log("Folderul de lucru",process.cwd());

console.log("categorii=",obGlobal.categorii);
console.log("produse global=",obGlobal.produse);

app.use("/*",function(req,res,next){
    console.log("optiuniMeniu=",obGlobal.optiuniMeniu);
    res.locals.optiuniMeniu=obGlobal.optiuniMeniu;
    next();
})

app.get("/favicon.ico",function(req,res){
    res.sendFile(path.join(__dirname,"resurse/imagini/ico/favicon.ico"));
})

app.get(["/","/home","/index"],function(req,res){
    let ofertaCurenta = null;

    if (obGlobal.oferte && obGlobal.oferte.length > 0) {
        ofertaCurenta = obGlobal.oferte[0];
    }

    res.render("pagini/index",{
        imagini: obGlobal.obImagini.imagini,
        ip: req.ip,
        oferta: ofertaCurenta
    });
})

app.get("/api/oferta", function(req, res) {
    const caleOferte = path.join(__dirname, "resurse/json/oferte.json");

    let ofertaCurenta = null;
    try {
        const oferteJson = JSON.parse(fs.readFileSync(caleOferte));
        const acum = new Date();

        ofertaCurenta = oferteJson.oferte.find(oferta => {
            const inceput = new Date(oferta["data-incepere"]);
            const final = new Date(oferta["data-finalizare"]);
            return inceput <= acum && acum <= final;
        }) || null;
    } catch (e) {
        console.warn("Eroare la citirea ofertelor:", e);
    }

    res.json({ oferta: ofertaCurenta });
});

app.get("/extra",function(req,res){ 
    res.render("pagini/extra",{
        imagini:obGlobal.obImagini.imagini
    });
});

app.get("/galerie",function(req,res){ 
    res.render("pagini/galerie",{
        imagini:obGlobal.obImagini.imagini
    });
});

app.get("/cerere", function(req, res){
    res.send("<p style = 'color:green;'> Bună ziua! </p>");
});


app.get("/fisier", function(req, res){
    res.sendfile(path.join(__dirname, "package.json"));
});

app.get("/abc", function(req, res, next){
    res.write("Data curenta: ");
    next();
});

app.get("/abc", function(req, res, next){
    res.write((new Date() + ""));
    res.end();
});

app.get("/produse", function(req, res) {
    console.log(req.query)
    console.log("Ruta /produse apelată la:", new Date().toISOString());
    console.log("oferte din global in produse",obGlobal.oferte);
    
    let conditii = [];
    let valori = [];
    let idx = 1;

    if (req.query.tip) {
        conditii.push(`tip_produs = $${idx++}`);
        valori.push(req.query.tip);
    }

    if (req.query.categ_produs) {
        conditii.push(`categorie = $${idx++}`);
        valori.push(req.query.categ_produs);
    }

    if (req.query.brand) {
        conditii.push(`brand = $${idx++}`);
        valori.push(req.query.brand);
    }

    let conditieQuery = conditii.length > 0 ? " WHERE " + conditii.join(" AND ") : "";

    let queryOptiuni = "select * from unnest(enum_range(null::categ_produs))";
    client.query(queryOptiuni, function(err, rezOptiuni) {
        if (err) {
            console.log(err);
            afisareEroare(res, 2);
            return;
        }

        let queryProduse = "select * from produs" + conditieQuery;
        client.query(queryProduse, valori, function(err, rez) {
            if (err) {
                console.log(err);
                afisareEroare(res, 2);
                return;
            }

            const luni = ["Ianuarie", "Februarie", "Martie", "Aprilie", "Mai", "Iunie", "Iulie", "August", "Septembrie", "Octombrie", "Noiembrie", "Decembrie"];
            const zile = ["Duminica", "Luni", "Marti", "Miercuri", "Joi", "Vineri", "Sambata"];

            for (let prod of rez.rows) {
                prod.pret = Number(prod.pret);
                const d = new Date(prod.data_adaugare);
                prod.data_formatata_ro = `${d.getDate()} ${luni[d.getMonth()]} ${d.getFullYear()} [${zile[d.getDay()]}]`;
                prod.data_datetime = d.toISOString().split("T")[0];
            }
            let queryPret = "select min(pret) as pret_min, max(pret) as pret_max from produs";
            client.query(queryPret, function(err, rezPret) {
                if (err) {
                    console.log(err);
                    afisareEroare(res, 2);
                    return;
                }

                let pretMin = rezPret.rows[0].pret_min;
                let pretMax = rezPret.rows[0].pret_max;

                

                const toateOfertele = obGlobal.oferte || [];
                console.log("toate ofertele", toateOfertele);
                const now = new Date();

                const oferteActive = toateOfertele.filter(o => { //oferte active
                return new Date(o['data-incepere']) <= now && new Date(o['data-finalizare']) >= now;
                });

                const oferteUnice = [];
                const categoriiVazute = new Set();

                for (const oferta of oferteActive) {
                const categorie = oferta.categorie;
                if (!categoriiVazute.has(categorie)) {
                    categoriiVazute.add(categorie);
                    oferteUnice.push(oferta);
                }
                }


                console.log("uni");
                console.log(oferteUnice); //toate ofertele o singura data

                const produseIeftineSet = new Set();
                for (let p of obGlobal.produseIeftine) {
                    produseIeftineSet.add(p.id);
                }
                
                res.render("pagini/produse", {
                    produse: rez.rows,
                    optiuni: rezOptiuni.rows,
                    pretMin: pretMin,
                    pretMax: pretMax,
                    oferte: oferteUnice,
                    produseIeftine: produseIeftineSet
                });
            });
        });
    });
});


app.get("/produs/:id", function(req, res){
    console.log(req.params);
    client.query(`select * from produs where id = ${req.params.id}`, function(err, rez){
        if (err){
            console.log(err);
            afisareEroare(res, 2);
        }
        else{
            if (rez.rowCount==0){
                afisareEroare(res, 404);
            }
            else{

                const luni = [
                    "Ianuarie", "Februarie", "Martie", "Aprilie", "Mai", "Iunie",
                    "Iulie", "August", "Septembrie", "Octombrie", "Noiembrie", "Decembrie"
                ];
                const zile = [
                    "Duminica", "Luni", "Marti", "Miercuri", "Joi", "Vineri", "Sambata"
                ];
                
                    const d = new Date(rez.rows[0].data_adaugare);
                
                    const zi = d.getDate();
                    const luna = luni[d.getMonth()];
                    const an = d.getFullYear();
                    const ziSapt = zile[d.getDay()];
                
                    rez.rows[0].data_formatata_ro = `${zi} ${luna} ${an} [${ziSapt}]`;
                
                    // pentru time datetime
                    rez.rows[0].data_datetime = d.toISOString().split("T")[0];

                    let idProdus = parseInt(req.params.id);
                    let seturiCuProdus = obGlobal.seturi.filter(set=>
                        set.produse.some(p=>p.id == idProdus)
                    )
                    console.log("seturicuProdus",seturiCuProdus);
                res.render("pagini/produs", {prod: rez.rows[0], seturi_cu_produs: seturiCuProdus});
            }
        }
    })
})

app.get("/seturi",function(req,res){
    res.render("pagini/seturi",{seturi:obGlobal.seturi});
});

app.get(/^\/resurse\/[a-zA-Z0-9_\/]*$/, function(req, res, next) {
    afisareEroare(res,403);
});

app.get("/*.ejs",function(req,res,next){
    afisareEroare(res,400);
})

app.get("/*",function(req,res,next){
    try{
    res.render("pagini"+req.url,function(err,rezultatRandare){
        if(err){
            if(err.message.startsWith("Failed to lookup view")){
                afisareEroare(res,404);
            }
        }
        else{
            afisareEroare(res);
        }
    });
}
catch(errRandare){
    if(errRandare.message.startsWith("Cannot find module")){
        afisareEroare(res,404);
    }
    else{
        afisareEroare(res);
    }
}
})



app.listen(8080);
console.log("Serverul a pornit");
