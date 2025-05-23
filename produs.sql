-- SELECT grantee, privilege_type
-- FROM information_schema.role_table_grants
-- WHERE table_name = 'produs';

-- select * from produs;

REVOKE ALL PRIVILEGES ON TABLE produs FROM catalin;
GRANT ALL PRIVILEGES ON TABLE produs TO catalin;
GRANT ALL PRIVILEGES ON DATABASE tw TO catalin ;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO catalin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO catalin;
GRANT USAGE ON SCHEMA public TO catalin;
GRANT SELECT, INSERT, UPDATE, DELETE ON produs TO catalin;
GRANT CONNECT ON DATABASE tw TO catalin;

drop table if exists produs;
DROP TYPE IF EXISTS categ_produs;
DROP TYPE IF EXISTS tipuri_produse;
drop type if exists brand;


CREATE TYPE categ_produs AS ENUM( 'electrica','acustica','clasica','combo','cabinet','pene','corzi','huse','straps','cablu');
CREATE TYPE tipuri_produse AS ENUM('chitara', 'amplificator', 'accesoriu');
create type brand as enum('fender','gibson','prs','squire','ibanez','marshall','orange','blackstar','boss');



CREATE TABLE IF NOT EXISTS produs (
   id serial PRIMARY KEY,
   nume VARCHAR(50) UNIQUE NOT NULL,
   descriere TEXT,
   pret NUMERIC(8,2) NOT NULL check (pret>0),  
   tip_produs tipuri_produse not null,
   categorie categ_produs not null,
   brand brand, --caracteristica care poate sa aiba doar o singura valoare pentru o entitate (dint-un set de valori)
   greutate numeric(4,2) not null check(greutate>0), --in kilograme
   cablu_inclus boolean default false,
   materiale varchar [], --plastic, mai multe tipuri de lemn, textil(huse si straps), etc
   imagine VARCHAR(300),
   rating numeric(2,1) CHECK (rating BETWEEN 0 AND 5),
   data_adaugare TIMESTAMP DEFAULT current_timestamp,
   pentru_stangaci boolean
);

create table if not exists seturi(
	id serial primary key,
	nume_set varchar(50) unique not null,
	descriere_set TEXT
);

create table if not exists asociere_set(
	id serial primary key,
	id_set integer references seturi(id) on delete cascade,
	id_produs integer references produs(id) on delete cascade
);

insert into seturi (nume_set, descriere_set)
values('Fender Tone Essetials', 'Combinația perfectă pentru tonul clasic Fender: chitara Fender Player II Stratocaster în nuanța Aquatone Blue și cablul Fender Original Series de 10ft pentru un sunet clar și autentic.'),
('Orange Practice Pack','Ideal pentru sesiuni de practică oriunde: amplificatorul portabil Orange Crush Mini de 3W și cablul Orange de 10ft – compact, puternic și gata de rock.'),
('Ibanez Begginer Kit', 'Un start excelent pentru chitariști începători: chitara Ibanez GIO HSS în finisaj Metallic Light Blue și un pachet de 12 pene pentru stil și confort la cântat.'),
('Fender Acoustic Starter Set', 'Ton cald și rafinat într-un stil acustic autentic: chitara FenderConcert All-Mahogany și un pachet de 12 pene – perfectă pentru orice stil și nivel.'),
('PRS x Marshall Mini Rig', 'Putere și rafinament într-un pachet compact: chitara PRS SE Silver Sky by John Mayer alături de amplificatorul Marshall MS2 – sunet mare, dimensiune mică.');

select * from seturi;
select * from produs;

insert into asociere_set (id_set, id_produs)
values (1,4),(1,5),(2,11),(2,12),(3,1),(3,6),(4,1),(4,2),(5,3),(5,7);


insert into produs (nume,descriere,pret,tip_produs,categorie,brand,greutate, cablu_inclus,materiale,imagine,rating,pentru_stangaci)
values 
('Pachet 12 pene',
E'This variety pack includes a range of different picks. Catering more for electric players, this pack includes:
\tUltex Sharp 2.0mm
\tTortex Standard .88mm
\tTortex Standard 1.0mm
\tTortex Standard 1.14mm
\tTortex III .88mm
\tTortex III 1.0mm
\tTortex Flex 1.0mm
\tTortex Jazz III XL 1.14mm
\tGator Grip .96mm
\tGator Grip 1.14mm
\tMax Grip Jazz III  Nylon
\tMax Grip Jazz III Stiffo',37.5,'accesoriu','pene',null,0.03,false,'{"plastic"}','12picks.jpg',3.9,null),

('FenderConcert All-Mahogany Acoustic Guitar','The FA-135 highlights Fender tone and style for a guitar that was made to take the stage. Quality laminate construction with a modern Fender 3+3 headstock and Viking bridge create a great-sounding instrument that’s easy to play. Beginners and developing players will appreciate the nato neck that gives the guitar a lively tone and smooth, easy playing feel.

Key Features
Concert Body - The medium size of a Concert body makes it extremely comfortable for players of all sizes. It''s size and shape make it incredibly articulate - ideal for fingerpicking, but great for strumming chords too!
Mahogany Body - Mahogany is known for its warmth and rich midrange. This will give plenty of note separation and definition.
Walnut Fingerboard  - Walnut is velvety smooth to the touch, much like Rosewood. This makes the guitar feel luxurious and inviting to play.
Rolled Fingerboard Edges - This gives the neck a more comfortable, played-in feel - like a comfy pair of old jeans.',645,'chitara','acustica','fender',3.74,false,'{"mahogany","walnut"}','acustica.jpg',4.1,true),

('Marshall MS2 Micro Stack Amp','The Marshall MS-2 MICRO AMP is the ultimate in portable battery/mains operated micro amps, packing full Marshall tone into a tiny case measuring just 14 x 11 x 6cm.',144.95,'amplificator','combo','marshall',0.34,false,null,'amp_mini_marshall.jpg',3.7,null),

('Fender Original Series Instrument Cable 10''','Fender Original Series cables were designed by combining solid construction—featuring spiral shielding and durable nickel-plated connectors—with inimitable Fender styling to create a high-performance, reliable choice for your cable needs in the studio and on stage.',49.99,'accesoriu','cablu','fender',0.45,true,null,'cable_fender_blue.jpg',5.0,null),

('Fender Player II Stratocaster Aquatone Blue','The Fender Player II Stratocaster puts Fender’s most iconic electric guitar design in the hands of anyone seeking a professional-grade Fender Strat at an affordable price point. With its classic looks, 2-Point Synchronized Tremolo with Bent Steel Saddles and ClassicGear vintage-style tuners this Fender Stratocaster is built ready for stage and studio.

Its ensemble of Fender Player II Alnico V Single-Coil Stratocaster pickups offer the full range of famed Strat sounds, from its bell-like glassy neck tones to its quacky in-between positions and its cutting bridge pickup chime, this Strat has it covered. Partnered with its effortless feeling satin-finished Modern C neck with rolled fingerboard edges and its classic wood combination of Alder and Maple you won''t want to put this Fender Player II Stratocaster down!',3395,'chitara','electrica','fender',3.5,true,'{"plastic","maple","alder","metal"}','fstrat.jpg',4.6,true),

('Ibanez GIO HSS Guitar Metallic Light Blue','The GIO series was developed for players who want Ibanez quality, but are working with a limited budget. Subject to many of the same rigorous inspection standards and warranty coverage as other Ibanez guitars, GIO guitars offer the best sound, style and playability of anything in their class.

This principled approach has not only put better guitars in the hands of new players—it’s been responsible for launching numerous new musical careers around the world.

The GRX40 features a poplar body fitted with a Maple GRX neck that features a Jatoba fretboard, medium frets and white dot inlays. The T-106 tremolo bridge is a simple but effective tremolo bridge for beginners. Electronics include three Infinity R pickups with a 5-way selector switch for a variety of tonal options, right at your fingertips.',800,'chitara','electrica','ibanez',3.6,false,null,'ibanez.jpg',4.9,false),

('PRS John Mayer SE Silver Sky', 'The John Mayer SE Silver Sky is an affordable version of the modern blues-pop master''s best-selling PRS signature guitar that was first introduced in 2018. Strongly resembling Mayer''s USA model with its elegant double-cutaway body, inverted PRS headstock and trio of single-coil pickups — the PRS SE Silver Sky Maple is a versatile workhorse designed to provide similarly exquisite tones and familiar playability, but at a far more accessible price-point!', 3145,'chitara','electrica','prs',3.24,true,null,'prs.jpg',5.0,true),

('Fender Weighless 2 inch Monogrammed Strap', 'Fender WeighLess straps take the weight off your shoulders and let you focus on your playing. Made of a polyester webbing, the WeighLess strap lets your instrument sit comfortably against your body without digging in. Spandex inside the strap provides some give, so as to not feel the full weight on one shoulder. You''re not just sacrificing looks for comfort either thanks to the stylish "F" logo design.',89.95,'accesoriu','straps','fender',0.4,false,'{"plastic","poliester"}','strap2.jpg',2.3,null),

('Fender Telecaster Aqua Marine Metallic','Start your guitar journey the right way with the Fender Standard series Telecaster. Built upon the classic looks, feel and tone of one of one of Fender''s most iconic electric guitars the Standard series Tele offers an affordable instrument that’s packed full of premium appointments that’s designed to ensure your musical journey sets off on the right foot.

With its Poplar body with Maple neck and fingerboard this Tele is resonant and musical. Tuning and intonation feel stable and trouble-free thanks to its thought-out Fender hardware and plugged in, this Tele projects authentic Fender tones thanks to its duo of Fender ceramic pickups. Thanks to its satin-finished, modern C-shaped neck the Fender Standard series Telecaster feels elegant and fast and offers an inspirational playing experience that you’ll never want to put away.',2495,'chitara','electrica','fender',3.9,true,null,'tele.jpg',4.7,true),

('Blackstar Debut 15w Practice Amp','Blackstar''s new Debut Series practice amplifiers are designed for beginners who want exceptional guitar tone straight out of the starting block. Incredibly easy to dial-in, these analogue amps boast classy aesthetics and even sport some premium features that you''d find on high-end Blackstar amps - including a built-in ''Tape'' echo effect, Blackstar''s flexible ''Infinite Shape Feature'' (ISF) and a speaker-emulated output.

The Blackstar 15E is the biggest in the Debut range, and with stereo 3" linear speakers and 15w of power - it''s more than loud enough for the home!',399.95,'amplificator','combo','blackstar',4.6,false,'{"metal","textil","plastic","lemn"}','amp_blackstar.jpg',3.2,null),

('Orange Crush Mini 3W Amp','While the Orange brand might make you think of colossal eye-catching stacks making a racket on stage, they''re arguably just as well known for their more compact offerings. Pioneers of the lunchbox amp, they''ve made it part of their mission to cram all of that vitamin-C into smaller enclosures - say hello to the Crush Mini!

The Crush Mini is built on the popular formula of its predecessor, the Crush Micro. With several small tweaks this little amp has huge potential, both in terms of sound and practicality - its the ideal, portable practice amp with a healthy amount of attitude! ',224.95,'amplificator','combo','orange',0.9,false,null,'amp_orange.jpg',1.2,null),

('Orange Crush 10ft Instrument Cable','British manufacturer Orange are among the most reputable manufacturers of amplification in the world. It’s only fitting, then, that they’ve decided to start making pro-grade cables to match!

Orange guitar cables use the highest-grade copper-free conductors, and all connectors are genuine 1/4” Neutrik designs – hand-soldered and gold-plated to boot. Insulation and a tough woven outer sleeve ensures that they’re as durable as they are noise-free.',59.95,'accesoriu','cablu','orange',0.36,true,null,'cable_orange.jpg',3.8,null),

('Valencia Classical Guitar','Valencia Guitars were found in Australia in 1972 with a vision to provide student guitarists with affordable, easy-to-play, and comfortable guitars. The Valencia VC202NA lives up to that vision with its beginner friendly design and low price point.',425,'chitara','clasica',null,2.46,false,'{"spruce","mahogany"}','clasica.jpg',4.1,true),

('Boss Katana 50w Guitar Amp Combo','The BOSS KATANA Gen 3 range is here with another amp character, evolved tube logic, improved tone storage and an updated app to once again take its spot as the go-to amplifier for the modern guitarist. This amplifier is a compact 50-watt combo with a custom 12-inch speaker with evolved Tube Logic sound, 12 amp characters, onboard BOSS effects, an incredible app and more. With the additon of the BOSS BT-DUAL Blueooth Adapter, you can literally remote edit your settings and playback from your phone!',1245,'amplificator','combo','boss',11.6,true,null,'amp_boss.jpg',5.0,null),

('Fender Champion II 50w Amplifier Combo','Champion II delivers world-renowned Fender clean and overdrive tones plus an assortment of British and modern distortion flavours. From jazz to country, blues to metal, it’s easy to dial up the right sound. There’s also a built-in effects selection including reverb, delay/echo, chorus, tremolo, Vibratone and more. Delay times and tremolo speeds can easily be set with the TAP button to match song tempos.

Whether you’re looking for your first practice amp, or affordable, powerful stage gear for playing in a band, there’s a Champion II amp that’s ideal for you—simple to use and versatile enough for any style of guitar playing.

Other features include auxiliary input for easy connection to external devices, headphone output for private practice, rear-panel USB port and more.',999.95,'amplificator','combo','fender',8.6,true,'{"plastic","textil","metal"}','amp_fender.jpg',4.0,null),

('Epiphone Aged Vintage Sunburst Gloss', 'Epiphone''s Inspired by Gibson range is a stunning homage to some of the most famous guitars ever made. Better yet, you get all the iconic features that made the original instruments great at a price that won''t have you counting pennies.

There''s a reason so many big name players flocked to the J-45: it proved to be a workhorse in every sense, thanks to unwavering reliability and flexible dynamics. It possesses most of the power of the Gibson Hummingbird but produces a slightly more delicate top end.',3745,'chitara','acustica','gibson',2.3,false,null,'gibson.jpg',3.6,false);

-- ('Fender Standard Stratocaster Sunburst','Start your guitar journey the right way with the Fender Standard series Stratocaster. Built upon the classic looks, feel and tone of one of one of Fender''s most iconic electric guitars.',2495,'chitara','electrica','fender',3.1,false,null,'fstandard.jpg'),

-- ('Gibson ES-335 Electric Guitar Cherry','The Gibson ES-339 is a modern classic designed for those seeking the tone and look of an ES-335, but desire a slightly smaller, lighter instrument.',4000,'chitara','electrica','gibson',3.49,true,null,'gib.jpg'),

-- ('PRS SE CE24 Charcoal Mahogany','The PRS CE has become a stable range in the PRS line-up, giving you a snappy response and deeply dynamic tones.',1995,'chitara','electrica','prs',3.37,true,null,'prsch.jpg');