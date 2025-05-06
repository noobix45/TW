const express = require("express");
const path = require("path");
const fs = require("fs");
const sharp = require("sharp");
const sass = require("sass");
const pg = require("pg");

const Client=pg.Client;

client=new Client({ //instanta a uni clinet de baze de date
    database:"tw",
    user:"catalin",
    password:"catalin",
    host:"localhost",
    port:5432
})

client.connect()
client.query("select * from produs", function(err, rezultat ){
    console.log(err)
    console.log("select * from produs:")
    console.log(rezultat)
})
client.query("select * from unnest(enum_range(null::categ_produs))", function(err, rezultat ){
    console.log(err)    
    console.log("select * from unnest:")
    console.log(rezultat)
})

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
    folderBackup: path.join(__dirname,"backup")
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


app.get("/favicon.ico",function(req,res){
    res.sendFile(path.join(__dirname,"resurse/imagini/ico/favicon.ico"));
})

app.get(["/","/home","/index"],function(req,res){
    res.render("pagini/index",{
        imagini: obGlobal.obImagini.imagini,
        ip: req.ip
    });
})



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

app.get("/produse", function(req, res){
    console.log(req.query)
    var conditieQuery=""; // TO DO where din parametri
    if(req.query.tip){
        conditieQuery=`where tip_produs='${req.query.tip}'`;
    }


    queryOptiuni="select * from unnest(enum_range(null::categ_produs))"
    client.query(queryOptiuni, function(err, rezOptiuni){
        console.log(rezOptiuni)

        queryProduse="select * from produs"+conditieQuery;
        client.query(queryProduse, function(err, rez){
            if (err){
                console.log(err);
                afisareEroare(res, 2);
            }
            else{

                const luni = [
                    "Ianuarie", "Februarie", "Martie", "Aprilie", "Mai", "Iunie",
                    "Iulie", "August", "Septembrie", "Octombrie", "Noiembrie", "Decembrie"
                ];
                const zile = [
                    "Duminica", "Luni", "Marti", "Miercuri", "Joi", "Vineri", "Sambata"
                ];
                
                for (let prod of rez.rows) {
                    const d = new Date(prod.data_adaugare);
                
                    const zi = d.getDate();
                    const luna = luni[d.getMonth()];
                    const an = d.getFullYear();
                    const ziSapt = zile[d.getDay()];
                
                    prod.data_formatata_ro = `${zi} ${luna} ${an} [${ziSapt}]`;
                
                    // pentru time datetime
                    prod.data_datetime = d.toISOString().split("T")[0];
                }

                res.render("pagini/produse", {produse: rez.rows, optiuni:rezOptiuni.rows})
            }
        })
    });
})

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

                res.render("pagini/produs", {prod: rez.rows[0]})
            }
        }
    })
})

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
