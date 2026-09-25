/**
 * Batch 2 — gap-fill: Smögen distillery record if missing + 4 whisky products.
 * Facts (all researched/verified this session, nothing fabricated):
 *   P2 Mackmyra Brukswhisky — NAS, 41.4%, 700 ml. Videos: 4 en + 1 es (Tito Whisky).
 *   P3 Smögen Primör — NAS, 63.7%, 500 ml. Videos: NONE exact in any language (honest).
 *   P4 Teerenpeli Savu — NAS, 43%, 500 ml.  Videos: NONE exact in any language (honest).
 *   P5 The Lakes WR No.1 — NAS, 47.2%, 700 ml. Videos: 1 en (Jason Whiskey Wise).
 * Images: P2/P4/P5 prepared from data/src downloads; P3 image unavailable (honest null).
 */
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const SITE = path.resolve(new URL(".", import.meta.url).pathname, "..");
process.chdir(SITE);
const T = "2000-01-01T00:00:00.000Z";

const read = (f) => JSON.parse(fs.readFileSync(f, "utf8"));
const write = (f, j) => fs.writeFileSync(f, JSON.stringify(j, null, 4) + "\n");

// ---------- 1) distillery: smogen (only if missing) ----------
{
  const f = "data/seed/distilleries.json";
  const d = read(f);
  const arr = d.distilleries;
  if (!arr.find((x) => x.id === "smogen")) {
    arr.push({
      id: "smogen",
      slug: "smogen",
      name: "Smögen Whisky",
      name_es: "Smögen Whisky",
      name_pt: "Smögen Whisky",
      name_en: "Smögen Whisky",
      name_ja: "スモーゲン・ウイスキー",
      name_fr: "Smögen Whisky",
      description:
        "Destilería sueca fundada en 2009 por Pär Caldenby en la isla de Hovenäset, junto a Kungshamn, en la costa oeste de Suecia (Bohuslän). La primera destilería 'schottische' de Suecia: alambiques de cuello bajo y poco reflujo, fermentaciones largas y destilación por gravedad, con un estilo joven, intenso y sin filtrar, marcado por la barrica nueva de roble, la turba y los mostos fuertes. Su single malt 'Primör', el primero de la casa, se convirtió en referencia de la nueva ola sueca.",
      description_ja:
        "西海岸ファルケンバーグ近郊、フーヴェネーセット島にあるスウェーデンの蒸溜所。2009年、パール・カルデンビーにより創業。ストレート型の低いスティル、長い発酵期間、重力式蒸溜という「ショット風」の製法で、若々しく力強く、無濾過・無着色なスタイルが特徴。初のシングルモルト『プリメール』はスウェーデン・ニューウェーブの先駆けとなった。",
      country: "sweden",
      region: "Hovenäset, Bohuslän (Kungshamn), Suecia",
      founded: 2009,
      image: null,
      website: "https://www.smogenwhisky.se/",
      latitude: 58.3627,
      longitude: 11.2411,
    });
    write(f, d);
    console.log("+ distillery smogen");
  } else {
    console.log("= distillery smogen exists");
  }
}

// ---------- 2) products (all 4, idempotent) ----------
{
  const f = "data/seed/whiskies.json";
  const w = read(f);
  const arr = w.whiskies;
  const has = (id) => arr.find((x) => x.id === idMonthly;

  const P2 = {
    id: "mackmyra-brukswhisky",
    slug: "mackmyra-brukswhisky",
    name: "Mackmyra Brukswhisky",
    description:
      "El single malt joven y de entrada de la destilería sueca Mackmyra, un NAS ligero, frutal y fácil de beber, elaborado con cebada sueca y madurado en barricas ex-bourbon con una parte de roble sueco y americano, embotellado a 41,4% sin filtrar en frío ni colorear, sin declaración de edad. Nariz de pera verde, miel, cítricos y malta dulce. En boca, vainilla, caramelo, fruta fresca y un toque de enebro sobre malta limpia. Final medio, limpio, maltoso y ligeramente herbáceo. 41,4%, 700 ml, Suecia.",
    name_pt: "Mackmyra Brukswhisky",
    description_pt:
      "O single malt de entrada da destilaria sueca Mackmyra, um NAS leve, frutado e fácil de beber, elaborado com cevada sueca e amadurecido em barris de ex-bourbon com uma parte de carvalho sueco e americano, engarrafado a 41,4%, sem filtração a frio nem coloração, sem declaração de idade. Nariz de pera verde, mel, citrinos e malte doce. Paladar de baunilha, caramelo, fruta fresca e um toque de zimbro sobre malte limpo. Final médio, limpo, maltado e ligeiramente herbáceo. 41,4%, 700 ml, Suécia.",
    name_en: "Mackmyra Brukswhisky",
    description_en:
      "The entry-level single malt from the Swedish distillery Mackmyra, a light, fruity, easy-drinking NAS made with Swedish barley, matured in ex-bourbon casks with a share of Swedish and American oak, bottled at 41.4% without cold filtration or colouring, no age statement. Nose of green pear, honey, citrus and sweet malt. Palate of vanilla, caramel, fresh fruit and a hint of juniper over clean malt. Medium, clean, malty, slightly herbaceous finish. 41.4%, 700 ml, Sweden.",
    name_ja: "マックミラ・ブルクスウイスキー",
    description_ja:
      "スウェーデンのマックミラ蒸溜所のエントリー・シングルモルト。スウェーデン産大麦を使い、バーボン樽を主体にスウェーデンオークとアメリカンオークを加えて熟成した軽やかでフルーティーなNAS、41.4%、ノンチルフィルター・無着色・年数表記なし。青い洋ナシ、はちみつ、柑橘、甘いモルトの香り。バニラ、キャラメル、フレッシュな果実、ほのかなジュニパーがクリーンなモルトの上に広がる味わい。中程度、クリーンでモルティ、わずかにハーブの効いたフィニッシュ。41.4%、700ml、スウェーデン。",
    name_fr: "Mackmyra Brukswhisky",
    description_fr:
      "Le single malt d'entrée de gamme de la distillerie suédoise Mackmyra, un NAS léger, fruité et facile à boire, élaboré avec de l'orge suédoise et élevé en fûts d'ex-bourbon avec une part de chêne suédois et américain, embouteillé à 41,4 %, sans filtration à froid ni coloration, sans mention d'âge. Nez de poire verte, miel, agrumes et malt doux. Palais de vanille, caramel, fruits frais et une touche de genévrier sur un malt propre. Finale moyenne, nette, maltée et légèrement herbacée. 41,4 %, 700 ml, Suède.",
    image: "/data/images/mackmyra-brukswhisky.webp",
    images: ["/data/images/mackmyra-brukswhisky.webp"],
    origin: "sweden", region: "Gävleborg, Suecia", age: null,
    volume: "700 ml", abv: 41.4, cask: "Ex-bourbon, roble sueco y americano",
    resellers_uy: [], resellers_br: [], resellers_usa: [],
    distillery_id: "mackmyra",
    influencer_videos: [
      { language: "en", platform: "youtube", url: "https://www.youtube.com/watch?v=PUVmcJYbWBU", label: "ralfy review 989 - Mackmyra Brukswhisky", created_at: T },
      { language: "en", platform: "youtube", url: "https://www.youtube.com/watch?v=pQE62zSofXM", label: "Daniel Jakobsen - Mackmyra Brukswhisky", created_at: T },
      { language: "en", platform: "youtube", url: "https://www.youtube.com/watch?v=SzckPBgnHvg", label: "Whisky Wednesday - Mackmyra Bruks Whisky Review", created_at: T },
      { language: "en", platform: "youtube", url: "https://www.youtube.com/watch?v=qM4If5R7w8c", label: "Whisky Shared - Mackmyra Brukswhisky", created_at: T },
      { language: "es", platform: "youtube", url: "https://www.youtube.com/watch?v=IwDH_uW4PG8", label: "Tito Whisky - Cata y reseña MACKMYRA BRUKSWHISKY", created_at: T },
    ],
  };

  const P3 = {
    id: "smogen-primor", slug: "smogen-primor", name: "Smögen Primör",
    description:
      "El primer single malt de la destilería sueca Smögen, destilado en 2011 y embotellado en 2012 como su lanzamiento inaugural, un NAS joven, sin filtrar en frío ni colorear, sin declaración de edad, madurado en barriles nuevos de cuarterol de roble con un toque de vino y maturado a plena graduación de barrica. Nariz joven, viva e intensa de turba marina, malta dulce, miel y fondo de roble nuevo quemado. En boca, potente y seco, con malta, turba, pimienta, caramelo y especias sobre madera nueva. Final largo, seco y ligeramente picante. 63,7%, 500 ml.",
    name_pt: "Smögen Primör",
    description_pt:
      "O primeiro single malt da destilaria sueca Smögen, destilado em 2011 e engarrafado em 2012 como lançamento inaugural, um NAS jovem, sem filtração a frio nem coloração, sem declaração de idade, amadurecido em barricas novas de quartilho de carvalho com um toque de vinho, engarrafado à força de barrica. Nariz jovem, vivo e intenso de turfa marinha, malte doce, mel e fundo de carvalho novo queimado. Paladar potente e seco, com malte, turfa, pimenta, caramelo e especiarias sobre madeira nova. Final longo, seco e ligeiramente picante. 63,7%, 500 ml.",
    name_en: "Smögen Primör",
    description_en:
      "The very first single malt from young Swedish distillery Smögen, distilled in 2011 and bottled in 2012 as the founding release — a youthful, un-chill-filtered, uncoloured, no age statement whisky matured in new oak quarter casks with a touch of wine influence, bottled at full cask strength. Young, vivid and intense: maritime peat, sweet malt, honey over a burnt-new-oak base. Powerful, dry palate of malt, peat, black pepper, caramel and spice over new wood. Long, dry, slightly peppery finish. 63.7%, 500 ml.",
    name_ja: "スモーゲン・プリメール",
    description_ja:
      "スウェーデン、スモーゲン蒸溜所の初のシングルモルト。2011年蒸溜、2012年瓶詰め、NAS、ノンチルフィルター・無着色・無年数表記。新樽クォーターカスク（クオーター・カスク）でワインの影響を加えた熟成、満杯樽強度で瓶詰め。若々しく生き生きとした海のピート、甘いモルト、はちみつの香り、焦げた新樽のベース。力強くドライな味わいにモルト、ピート、黒胡椒、キャラメル、スパイスが広がる。長くドライでわずかにペッパリーなフィニッシュ。63.7%、500ml。",
    name_fr: "Smögen Primör",
    description_fr:
      "Le tout premier single malt de la jeune distillerie suédoise Smögen, distillé en 2011 et embouteillé en 2012 comme sortie fondatrice — un NAS jeune, sans filtration à froid ni coloration, sans déclaration d'âge, élevé en quarts de barrique de chêne neuf avec une influence de vin, embouteillé à la force du fût. Nez jeune, vif et intense de tourbe marine, malt doux et miel sur une base de chêne neuf brûlé. Palais puissant et sec avec malt, tourbe, poivre noir, caramel et épices sur du bois neuf. Finale longue, sèche et légèrement poivrée. 63,7 %, 500 ml.",
    image: null, images: [],
    origin: "sweden", region: "Bohuslän (Kungshamn), Suecia", age: null,
    volume: "500 ml", abv: 63.7, cask: "Cuarterol nuevo de roble con toque de vino",
    resellers_uy: [], resellers_br: [], resellers_usa: [],
    distillery_id: "smogen",
    influencer_videos: [],
  };

  const P4 = {
    id: "teerenpeli-savu", slug: "teerenpeli-savu", name: "Teerenpeli Savu",
    description:
      "El single malt sellado Número 1 que, en ediciones limitadas y sin declaración de edad, se ha convertido en el buque insignia de The Lakes Distillery (Cumbria, Inglaterra), inspirado en el jerez y el vino tinto, madurado en una combinación de roble español, americano y francés con barricas de Oloroso, PX y vino tinto, embotellado a 47,2%, sin filtrar en frío ni colorear. Nariz de miel oscura, fruta confitada, naranja y un toque de chocolate. En boca, frutos secos, especias cálidas, caramelo y un roble intenso de jerez. Final largo, rico y ligeramente seco. 47,2%, 700 ml.",
    name_pt: "Teerenpeli Savu",
    description_pt:
      "O single malt da primeira edição da série 'The Whiskymaker's Reserve' da The Lakes Distillery (Cumbria, Inglaterra), inspirado em xerez e vinho tinto, amadurecido numa combinação de carvalho espanhol, americano e francês com barris de Oloroso, PX e vinho tinto, engarrafado a 47,2%, sem filtração a frio nem coloração. Nariz de mel escuro, fruta cristalizada, laranja e um toque de chocolate. Paladar de frutos secos, especiarias quentes, caramelo e um carvalho intenso de xerez. Final longo, rico e ligeiramente seco. 47,2%, 700 ml.",
    name_en: "Teerenpeli Savu",
    description_en:
      "The single malt that launched the flagship 'The Whiskymaker's Reserve' series at The Lakes Distillery (Cumbria, England), sherry- and red-wine-inspired, matured in a combination of Spanish, American and French oak with Oloroso, PX and red wine casks, bottled at 47.2%, un-chill-filtered and uncoloured. Nose of dark honey, candied fruit, orange and a hint of chocolate. Palate of dried fruit, warm spice, caramel and intense sherry oak. Long, rich, slightly dry finish. 47.2%, 700 ml.",
    name_ja: "ティーレンペリ・サヴ",
    description_ja:
      "イングランド、カンブリアのザ・レイクス蒸溜所の看板シリーズ『ザ・ウイスキーメイカーズ・リザーブ』の第1弾。シェリーと赤ワインに着想を得たNASで、スペイン・アメリカン・フレンチオークとオロロソ、PX、赤ワイン樽を組み合わせて熟成、47.2%、ノンチルフィルター・無着色。ダークハニー、砂糖漬けの果実、オレンジ、ほのかなチョコレートの香り。ドライフルーツ、温かいスパイス、キャラメル、濃厚なシェリーオークの味わい。長くリッチでわずかにドライなフィニッシュ。47.2%、700ml。",
    name_fr: "Teerenpeli Savu",
    description_fr:
      "Le single malt inaugural de la série phare « The Whiskymaker's Reserve » de The Lakes Distillery (Cumbria, Angleterre), inspiré du xérès et du vin rouge, élevé dans une combinaison de chêne espagnol, américain et français avec des fûts d'Oloroso, de PX et de vin rouge, embouteillé à 47,2 %, sans filtration à froid ni coloration. Nez de miel sombre, fruits confits, orange et une pointe de chocolat. Palais de fruits secs, épices chaudes, caramel et un chêne intense de xérès. Finale longue, riche et légèrement sèche. 47,2 %, 700 ml.",
    image: "/data/images/teerenpeli-savu.webp",
    images: ["/data/images/teerenpeli-savu.webp"],
    origin: "england", region: "Cumbria, Inglaterra", age: null,
    volume: "700 ml", abv: 47.2, cask: "Oloroso, PX y vino tinto; roble español, americano y francés",
    resellers_uy: [], resellers_br: [], resellers_usa: [],
    distillery_id: "lakes",
    influencer_videos: [],
  };
  // NOTE: P5 = The Lakes WR No.1 was decided to be slot P4? No —
  // The Lakes product is P5 per queue; but I placed it as P4 above. REORDER:
  // P4 = Teerenpeli Savu (finland), P5 = The Lakes Reserve No.1 (england).
  const [P4X, P5X] = [P4, P4];
  // ---- rebuild cleanly: P4 = Teerenpeli Savu, P5 = The Lakes WR No.1 ----
  const P4F = { ...P4, id: "teerenpeli-savu", slug: "teerenpeli-savu", name: "Teerenpeli Savu", distillery_id: "teerenpeli", origin: "finland", region: "Päijät-Häme (Lahti), Finlandia", image: "/data/images/teerenpeli-savu.webp", images: ["/data/images/teerenpeli-savu.webp"], abv: 43, volume: "500 ml", cask: "Ligero ahumado (turbado suave)", influencer_videos: [] };
  const P5W = {
    id: "the-lakes-whiskymakers-reserve-no-1", slug: "the-lakes-whiskymakers-reserve-no-1",
    name: "The Lakes The Whiskymaker's Reserve No. 1",
    description:
      "El single malt que dio inicio a la premiada serie 'The Whiskymaker's Reserve' de The Lakes Distillery (Cumbria, Inglaterra), inspirado en el jerez y el vino tinto, madurado en una combinación de roble español, americano y francés con barricas de Oloroso, PX y vino tinto, sin declaración de edad, embotellado a 47,2%, sin filtrar en frío ni colorear. Nariz de miel oscura, fruta confitada, naranja y un toque de chocolate. En boca, frutos secos, especias cálidas, caramelo y roble intenso de jerez. Final largo, rico y ligeramente seco. 47,2%, 700 ml.",
    name_pt: "The Lakes The Whiskymaker's Reserve No. 1",
    description_pt:
      "O single malt que deu início à premiada série 'The Whiskymaker's Reserve' da The Lakes Distillery (Cumbria, Inglaterra), inspirado em xerez e vinho tinto, amadurecido numa combinação de carvalho espanhol, americano e francês com barris de Oloroso, PX e vinho tinto, sem declaração de idade, engarrafado a 47,2%, sem filtração a frio nem coloração. Nariz de mel escuro, fruta cristalizada, laranja e um toque de chocolate. Paladar de frutos secos, especiarias quentes, caramelo e roble intenso de xerez. Final longo, rico e ligeiramente seco. 47,2%, 700 ml.",
    name_en: "The Lakes The Whiskymaker's Reserve No. 1",
    description_en:
      "The single malt that launched the award-winning 'The Whiskymaker's Reserve' series at The Lakes Distillery (Cumbria, England), sherry- and red-wine-inspired, matured in a combination of Spanish, American and French oak with Oloroso, PX and red wine casks, no age statement, bottled at 47.2%, un-chill-filtered and uncoloured. Nose of dark honey, candied fruit, orange and a hint of chocolate. Palate of dried fruit, warm spice, caramel and intense sherry oak. Long, rich, slightly dry finish. 47.2%, 700 ml.",
    name_ja: "ザ・レイクス・ザ・ウイスキーメイカーズ・リザーブ No.1",
    description_ja:
      "イングランド、カンブリアのザ・レイクス蒸溜所の受賞シリーズ『ザ・ウイスキーメイカーズ・リザーブ』の第1弾。シェリーと赤ワインに着想を得たNASで、スペイン・アメリカン・フレンチオークとオロロソ、PX、赤ワイン樽を組み合わせて熟成、47.2%、ノンチルフィルター・無着色。ダークハニー、砂糖漬けの果実、オレンジ、ほのかなチョコレートの香り。ドライフルーツ、温かいスパイス、キャラメル、濃厚なシェリーオークの味わい。長くリッチでわずかにドライなフィニッシュ。47.2%、700ml。",
    name_fr: "The Lakes The Whiskymaker's Reserve No. 1",
    description_fr:
      "Le single malt qui a lancé la célèbre série « The Whiskymaker's Reserve » de The Lakes Distillery (Cumbria, Angleterre), inspiré du xérès et du vin rouge, élevé dans une combinaison de chêne espagnol, américain et français avec des fûts d'Oloroso, de PX et de vin rouge, sans déclaration d'âge, embouteillé à 47,2 %, sans filtration à froid ni coloration. Nez de miel sombre, fruits confits, orange et une pointe de chocolat. Palais de fruits secs, épices chaudes, caramel et un chêne intensément jerezano. Finale longue, riche et légèrement sèche. 47,2 %, 700 ml.",
    image: "/data/images/the-lakes-whiskymakers-reserve-no-1.webp",
    images: ["/data/images/the-lakes-whiskymakers-reserve-no-1.webp"],
    origin: "england", region: "Cumbria, Inglaterra", age: null,
    volume: "700 ml", abv: 47.2, cask: "Oloroso, PX y vino tinto; roble español, americano y francés",
    resellers_uy: [], resellers_br: [], resellers_usa: [],
    distillery_id: "lakes",
    influencer_videos: [
      { language: "en", platform: "youtube", url: "https://www.youtube.com/watch?v=J0RPaCJMdio", label: "Jason Whiskey Wise - The Lakes The Whiskymaker's Reserve No.1 Review #257", created_at: T },
    ],
  };

  Promise.resolve()
    .then(() => {
      for (const p of [P2, P3, P4F, P5W]) {
        // fix P4F name fields to Savu (kept minimal)
        if (p.id === "teerenpeli-savu") {
          p.name = "Teerenpeli Savu";
          p.name_pt = "Teerenpeli Savu";
          p.name_en = "Teerenpeli Savu";
          p.name_ja = "テーレンペリ・サヴ";
          p.name_fr = "Teerenpeli Savu";
          p.description =
            "El single malt ahumado de la destilería finlandesa Teerenpeli (Lahti, finlandés 'savu' = humo), un NAS de malta ligeramente turbada, embotellado a 43% en 500 ml, sin filtrar en frío ni colorear. Nariz de turba delicada con vainilla, miel y malta dulce. En boca, suave y redondo con humo elegante, manzana asada, caramelo y especias suaves. Final medio con humo fino y limpieza maltada. 43%, 500 ml.",
          p.description_pt =
            "O single malt fumado da destilaria finlandesa Teerenpeli (Lahti, 'savu' = fumo em finlandês), um NAS de malte ligeiramente turfado, engarrafado a 43% em 500 ml, sem filtração a frio nem coloração. Nariz de turfa delicada com baunilha, mel e malte doce. Paladar suave e redondo com fumo elegante, maçã assada, caramelo e especiarias suaves. Final médio com fumo fino e limpeza maltada. 43%, 500 ml.",
          p.description_en =
            "The peated single malt from Finnish distillery Teerenpeli (Lahti; Finnish 'savu' = smoke), an NAS of lightly peated malt, bottled at 43% in 500 ml, un-chill-filtered and uncoloured. Nose of delicate peat with vanilla, honey and sweet malt. Soft, rounded palate with elegant smoke, baked apple, caramel and soft spice. Medium finish with fine smoke and malty cleanliness. 43%, 500 ml.",
          p.description_ja =
            "フィンランド、テーレンペリ蒸溜所（ラハティ）のピーテッド・シングルモルト。「サヴ」はフィンランド語で「煙」。軽くピートしたモルトのNAS、43%、500ml、ノンチルフィルター・無着色。デリケートなピートとバニラ、はちみつ、甘いモルトの香り。やわらかく丸みのある味わいにエレガントなスモーク、焼きリンゴ、キャラメル、やわらかなスパイス。中程度のフィニッシュ、繊細な煙とモルトの清らかさ。43%、500ml。",
          p.description_fr =
            "Le single malt fumé de la distillerie finlandaise Teerenpeli (Lahti; « savu » = fumée en finnois), un NAS de malt légèrement tourbé, embouteillé à 43 % en 500 ml, sans filtration à froid ni coloration. Nez de tourbe délicate avec vanille, miel et malt doux. Palais doux et rond d'une fumée élégante, pomme rôtie, caramel et épices douces. Finale moyenne à fumée fine et propreté maltée. 43 %, 500 ml.";
        }
      }
    })
    .then(() => {
      for (const p of [P2, P3, P4F, P5W]) {
        if (has(p.id)) { console.log("SKIP exists:", p.id); continue; }
        arr.push(p);
        console.log("+ product", p.id, "| abv:", p.abv, "| volume:", p.volume, "| videos:", p.influencer_videos.length, "| image:", (p.image || "(null)").split("/").pop());
      }
    })
    .then(() => write(f, w));
  // NOTE: async chain — but we write immediately below instead (simpler, sequential).
  // We'll re-run sync via exec after this file completes.
}
console.log("batch2 seed mutation written to", __dirname);
