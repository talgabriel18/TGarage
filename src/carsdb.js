import {norm} from './catalog'
// Model Caroserie Motorizări (S=Sedan V=SUV H=Hatchback K=Break C=Coupe P=Pickup | B=Benzină D=Diesel G=GPL H=Hibrid P=PHEV E=Electric)
const RAW = `Dacia|Pickup P BD;Logan S BDG;Logan MCV K BDG;Sandero H BDG;Sandero Stepway H BG;Duster V BDGH;Jogger K BGH;Spring H E;Lodgy K BD;Dokker K BD;Solenza S BD;1310 S B;Bigster V BGH
Renault|Megane Sedan S BD;Fluence S BD;Koleos V BD;Laguna H BD;Trafic K D;Clio Grandtour K BD;Modus H BD;Rafale V H;Clio H BDGH;Megane H BDHP;Megane E-Tech V E;Captur V BDGHP;Kadjar V BD;Arkana V BH;Austral V BH;Symbioz V H;Scenic K BD;Talisman S BD;Twingo H BE;Zoe H E;Espace K BDH;Kangoo K BDE;Symbol S BD
Volkswagen|Golf Variant K BDHP;Sharan K BD;Tiguan Allspace V BDHP;ID.5 V E;ID.Buzz K E;Amarok P D;Scirocco C BD;Polo Sedan S B;Golf H BDHP;Polo H BDG;Passat K BDHP;Passat Sedan S BDHP;Tiguan V BDHP;T-Roc V BD;T-Cross V B;Taigo V B;Touran K BD;Touareg V BDHP;Arteon S BDP;Jetta S BD;Caddy K BDG;Up H BE;ID.3 H E;ID.4 V E;ID.7 S E;Bora S BD
Skoda|Yeti V BD;Roomster K BD;Citigo H BG;Octavia RS S B;Octavia S BDGHP;Octavia Combi K BDGHP;Fabia H BG;Fabia Combi K BD;Rapid S BD;Scala H BG;Kamiq V BG;Karoq V BD;Kodiaq V BD;Superb S BDHP;Superb Combi K BDHP;Enyaq V E;Felicia H B
Seat|Altea K BD;Exeo S BD;Leon H BDGHP;Leon ST K BDHP;Ibiza H BG;Arona V B;Ateca V BD;Tarraco V BDP;Toledo S BD
Cupra|Formentor V BHP;Born H E;Leon H BHP;Ateca V B
Audi|A7 S BDH;A8 S BDH;A3 Sportback H BDHP;Q6 e-tron V E;e-tron V E;A2 H BD;A1 H B;A3 H BDHP;A3 Sedan S BD;A4 S BD;A4 Avant K BD;A5 C BD;A6 S BDH;A6 Avant K BDH;Q2 V BD;Q3 V BDP;Q5 V BDHP;Q7 V BDH;Q8 V BDH;TT C B;Q4 e-tron V E;e-tron GT S E
BMW|Seria 7 S BDHP;X2 V BDHP;X4 V BDHP;X7 V BDH;i5 S E;i7 S E;Z4 C B;Seria 6 GT H BD;Seria 3 Compact H BD;Seria 1 H BDP;Seria 2 C BD;Seria 3 S BDHP;Seria 3 Touring K BDHP;Seria 4 C BD;Seria 5 S BDHP;Seria 5 Touring K BDHP;X1 V BDPE;X3 V BDHP;X5 V BDHP;X6 V BDHP;i3 H E;i4 S E;iX V E
Mercedes-Benz|CLS S BDH;GLS V BDH;G-Class V BD;SLC C B;EQB V E;EQE S E;EQS S E;Clasa M V BD;Clasa R K D;Clasa A H BDHP;Clasa B K BD;Clasa C S BDHP;Clasa C Estate K BDHP;Clasa E S BDHP;Clasa E Estate K BDHP;Clasa S S BDHP;CLA S BDHP;GLA V BDHP;GLB V BD;GLC V BDHP;GLE V BDHP;EQA V E;EQC V E;Vito K D
Opel|Astra Sedan S BD;Agila H B;Karl H B;Frontera V BHE;Antara V BD;Corsa H BDE;Astra H BDHP;Astra Sports Tourer K BDHP;Insignia S BD;Mokka V BDE;Crossland V BD;Grandland V BDHPE;Zafira K BD;Combo K BDE;Vectra S BD;Meriva K BD
Ford|Focus Sedan S BD;Transit Connect K BD;Fusion H BD;Kuga Plug-in V P;Fiesta H BH;Focus H BDH;Focus Wagon K BDH;Mondeo S BDH;Kuga V BDHP;Puma V BH;EcoSport V BD;Ranger P D;Mustang C B;Mustang Mach-E V E;S-Max K BD;Galaxy K BD;C-Max K BD
Toyota|Proace K D;Corolla Cross V H;Highlander V H;GR86 C B;Aygo H B;Yaris H BH;Yaris Cross V BH;Corolla H BH;Corolla Touring Sports K BH;C-HR V BH;RAV4 V BHP;Camry S H;Prius H HP;Land Cruiser V D;Hilux P D;Auris H BDH;Avensis S BD;bZ4X V E
Hyundai|Getz H B;Accent S B;Matrix K B;ix35 V BD;Santa Fe Hybrid V H;i10 H BG;i20 H B;i30 H BDH;i30 Wagon K BD;Bayon V B;Kona V BHE;Tucson V BDHP;Santa Fe V DHP;Elantra S B;Ioniq H HE;Ioniq 5 V E;Ioniq 6 S E
Kia|Soul V BDE;Venga K BD;Carens K BD;Cerato S B;Picanto H B;Rio H B;Ceed H BDH;Ceed Sportswagon K BDH;XCeed V BDHP;Stonic V B;Sportage V BDHP;Sorento V DHP;Niro V HPE;EV6 V E;EV9 V E
Peugeot|206 H BD;207 H BDG;307 H BD;107 H B;Expert K D;208 H BDE;308 H BDHP;308 SW K BDHP;2008 V BDE;3008 V BDHP;5008 V BDHP;508 S BDHP;508 SW K BDHP;301 S BD;Rifter K BDE;Partner K BD;407 S BD
Citroen|C1 H B;C2 H BD;C4 Picasso K BD;C4 Cactus H BD;DS3 H BD;C3 H BD;C3 Aircross V BD;C4 H BDE;C5 Aircross V BDHP;C-Elysee S BD;Berlingo K BDE;C5 S BD
Fiat|Stilo H BD;Ducato K D;Sedici V BD;500L K BD;Qubo K BD;Linea S BD;500 H BE;Panda H BG;Punto H BDG;Tipo S BDG;Tipo SW K BDG;500X V BD;Doblo K BD;Bravo H BD
Nissan|Primera S BD;Almera H BD;Pathfinder V D;Murano V B;370Z C B;Micra H B;Juke V BH;Qashqai V BDH;X-Trail V BDH;Leaf H E;Ariya V E;Navara P D;Note H BD
Honda|Civic Sedan S B;Accord Tourer K BD;Jazz H H;Civic H BH;Accord S BH;CR-V V BDH;HR-V V BH;e:Ny1 V E
Mazda|Mazda5 K BD;CX-60 V BDHP;Mazda2 H BH;Mazda3 H B;Mazda6 S BD;CX-3 V BD;CX-30 V B;CX-5 V BD;MX-5 C B
Suzuki|Swift H BH;Ignis H B;Vitara V BH;S-Cross V BH;Jimny V B
Mitsubishi|Colt H B;Lancer S B;Pajero V D;ASX V BH;Outlander V BDP;Eclipse Cross V BP;L200 P D
Volvo|S40 S BD;V40 H BD;XC70 K D;XC40 V BDPE;XC60 V BDHP;XC90 V BDHP;V60 K BDHP;V90 K BDH;S60 S BHP;S90 S BDHP;C40 V E;EX30 V E
Tesla|Model 3 S E;Model Y V E;Model S S E;Model X V E
Jeep|Renegade V BDP;Compass V BDP;Wrangler V BP;Avenger V BE;Cherokee V BD
Land Rover|Range Rover Evoque V BDH;Range Rover Sport V BDHP;Discovery Sport V D;Defender V BDHP
Porsche|911 C B;Cayenne V BHP;Macan V BE;Panamera S BHP;Taycan S E
Alfa Romeo|Giulia S BD;Stelvio V BD;Giulietta H BD;Tonale V BH
Mini|Cooper H BE;Countryman V BDPE;Clubman K BD
Smart|Fortwo C BE;Forfour H BE;#1 V E
BYD|Dolphin H E;Atto 3 V E;Seal S E;Seal U V HP
MG|MG4 H E;ZS V BE;HS V BHP;MG5 K E
Polestar|Polestar 2 H E;Polestar 4 V E
Lexus|UX V HE;NX V HP;RX V H;IS S BH
Subaru|Forester V BH;Outback K B;XV V BH
Chevrolet|Spark H B;Aveo H B;Cruze S BD;Captiva V BD
Daewoo|Matiz H B;Nubira S B;Lanos S B;Tico H B
DS|DS 3 V BDE;DS 4 H BDHP;DS 7 V BDHP;DS 9 S BDP
Lancia|Ypsilon H BG;Delta H BD
Maserati|Ghibli S BDH;Levante V BDH;Grecale V BE
Jaguar|XE S BD;XF S BD;F-Pace V BDHP;E-Pace V BD;I-Pace V E;F-Type C B
Lada|Niva V B;Vesta S B;Granta S B
Saab|9-3 S BD;9-5 S BD
SsangYong|Korando V BD;Tivoli V BD;Rexton V D;Musso P D
Genesis|G70 S BD;GV70 V BDE;GV80 V BD
Cadillac|CTS S B;Escalade V B;Lyriq V E
Chrysler|300C S BD;Voyager K BD
Dodge|Challenger C B;Charger S B;RAM 1500 P B
Infiniti|Q50 S BDH;QX50 V B
Lynk & Co|01 V HP;02 V E
Leapmotor|T03 H E;C10 V E
Xpeng|G6 V E;P7 S E
Zeekr|001 S E;X V E
ORA|Funky Cat H E
Rover|75 S BD;45 H BD;25 H B`
export const DB = Object.fromEntries(RAW.split('\n').map(l => {
  const [b, ms] = l.split('|')
  return [b, ms.split(';').map(m => { const p = m.split(' '), pw = p.pop(), body = p.pop()
    return {name: p.join(' '), body: {S: 'Sedan', V: 'SUV', H: 'Hatchback', K: 'Break', C: 'Coupe', P: 'Pickup'}[body], pw: [...pw].map(x => ({B: 'Benzină', D: 'Diesel', G: 'GPL', H: 'Hibrid', P: 'PHEV', E: 'Electric'}[x]))} })]
}))
export const BRANDS = Object.keys(DB)
export const modelsOf = b => DB[b] || []
export const brandKey = b => BRANDS.find(x => norm(x) === norm(b))
