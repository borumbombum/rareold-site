# Whiskies to add

Queue of whiskies waiting to be added to the catalog. Agents pick lines from here when running the `add-product` skill.

## Format

One whisky per line:

```
[whisky_name] - [distillery]
```

- `[whisky_name]` — the exact product/expression name as it should appear in the store.
- `[distillery]` — the producing distillery or brand. If it doesn't exist in the database yet, the agent researches it and creates the full distillery record as part of the same insert.

## Rules for agents

- Work top-down: pick the **first line without ✅** (section headers are skipped) and follow `.agents/skills/add-product/SKILL.md`.
- Never add a whisky or distillery that already exists — verify first (the skill includes the check).
- Tick the line with ✅ only after `db:sync`, `data:export` and `npm run check` have passed.
- The user owns this file: add new lines freely; agents only tick them off.
- Section headers in this file are for human organization only — they do **not** mirror site data. The catalog has no "Rest of World"/catch-all origin: origins are an explicit per-country list (`src/lib/data/origins.json`, currently scotland, ireland, usa, japan, india, canada, argentina, uruguay, england, taiwan, wales, germany). When adding a product whose country has no origin yet, create the origin (ORIGIN_META bootstrap in `scripts/db-sync.mjs` + seed) as part of the same `add-product` run — same rule as for missing distilleries.

<!-- Examples (syntax only, not real entries):
✅ Talisker 10 Year Old - Talisker
✅ Highland Park 12 Year Old - Highland Park
-->

---

Curated world-wide candidates (researched 2026-08, excluding everything already in the catalog):

## Priority

✅ Macarthurs Scotch
✅ Hankey Bannister (all of them)

✅ Royal Salute 21 YO Signature Blend - Chivas Brothers
✅ Royal Salute 21 YO The Peated Blend - Chivas Brothers
✅ Royal Salute 25 YO - Chivas Brothers
✅ Royal Salute 30 YO Key To The Kingdom - Chivas Brothers
✅ Royal Salute 62 Gun Salute - Chivas Brothers

## Scotland — Islay

✅ Arran Barrel Reserve - Arran Distillers, source image: <https://static.whiskybase.com/storage/whiskies/1/3/8215/233765-big.jpg>, info here: <https://www.whiskybase.com/whiskies/whisky/138215/arran-barrel-reserve> - Add this spanish influencer review: <https://www.youtube.com/watch?v=0WYfqONQ60k>
✅ Arran Barley Year Old - Isle of Arran Distillers
✅ Whistle Pig 10 YO - Whistle Pig : <https://www.whistlepigwhiskey.com/whiskeys/10-year>
✅ Ardbeg 10 YO - Ardbeg
✅ Ardbeg Uigeadail - Ardbeg
✅ Ardbeg Corryvreckan - Ardbeg
✅ Ardbeg Wee Beastie - Ardbeg
✅ Laphroaig 10 YO - Laphroaig
✅ Laphroaig Quarter Cask - Laphroaig
✅ Laphroaig Lore - Laphroaig
✅ Lagavulin 16 YO - Lagavulin
✅ Lagavulin 8 YO - Lagavulin
✅ Bowmore 12 YO - Bowmore
✅ Bowmore 15 YO Darkest - Bowmore
✅ Bowmore 18 YO - Bowmore
✅ Bruichladdich The Classic Laddie - Bruichladdich
✅ Bruichladdich Islay Barley - Bruichladdich
✅ Port Charlotte 10 YO - Bruichladdich
✅ Octomore - Bruichladdich
✅ Bunnahabhain 12 YO - Bunnahabhain
✅ Bunnahabhain 18 YO - Bunnahabhain
✅ Caol Ila 12 YO - Caol Ila
✅ Caol Ila 18 YO - Caol Ila
✅ Ardnahoe Inaugural Release - Ardnahoe
✅ Vat 69 : <https://www.youtube.com/watch?v=JnVOXwGV3sI> (video for spanish)

## Scotland — Islands

✅ Talisker 10 YO - Talisker
✅ Talisker Storm - Talisker
✅ Talisker 18 YO - Talisker
✅ Talisker Distillers Edition - Talisker
✅ Highland Park 12 YO - Highland Park
✅ Highland Park 18 YO - Highland Park
✅ Highland Park Cask Strength - Highland Park
✅ Scapa 13 YO - Scapa
✅ Tobermory 12 YO - Tobermory
✅ Ledaig 10 YO - Tobermory
✅ Torabhaig Legacy Series - Torabhaig
✅ Isle of Raasay Single Malt - Isle of Raasay
✅ Isle of Harris Single Malt - Isle of Harris
✅ Abhainn Dearg Single Malt - Abhainn Dearg
✅ Saxa Vord Shetland Single Malt - Saxa Vord
✅ Lagg Single Malt - Lagg

## Scotland — Campbeltown

✅ Springbank 10 YO - Springbank
✅ Springbank 15 YO - Springbank
✅ Longrow Peated - Springbank
✅ Hazelburn 10 YO - Springbank
✅ Kilkerran 12 YO - Glengyle
✅ Kilkerran Heavily Peated - Glengyle
✅ Glen Scotia 15 YO - Glen Scotia
✅ Glen Scotia Victoriana - Glen Scotia
✅ Glen Scotia Double Cask - Glen Scotia

## Scotland — Speyside

✅ Glenfiddich 12 YO - Glenfiddich
✅ Glenfiddich 15 YO Solera - Glenfiddich
✅ Glenfiddich 18 YO - Glenfiddich
✅ The Glenlivet 12 YO - The Glenlivet
✅ The Glenlivet Founder's Reserve - The Glenlivet
✅ The Glenlivet 18 YO - The Glenlivet
✅ The Macallan Double Cask 12 YO - The Macallan
✅ The Macallan Sherry Oak 12 YO - The Macallan
✅ The Macallan Triple Cask 15 YO - The Macallan
✅ Aberlour 12 YO Double Cask - Aberlour
✅ Aberlour 16 YO Double Cask - Aberlour
✅ Aberlour A'bunadh - Aberlour
✅ The Balvenie DoubleWood 12 YO - The Balvenie
✅ The Balvenie Caribbean Cask 14 YO - The Balvenie
✅ The Balvenie PortWood 21 YO - The Balvenie
✅ Benriach The Original Ten - Benriach
✅ Benriach The Twelve - Benriach
✅ Glen Grant 10 YO - Glen Grant
✅ Glen Grant 15 YO Batch Strength - Glen Grant
✅ Glenrothes 12 YO - Glenrothes
✅ Glenrothes Whisky Maker's Cut - Glenrothes
✅ Mortlach 12 YO Wee Witchie - Mortlach
✅ Mortlach 16 YO Distiller's Dram - Mortlach
✅ Craigellachie 13 YO - Craigellachie
✅ Craigellachie 17 YO - Craigellachie
✅ Cragganmore 12 YO - Cragganmore
✅ Cardhu 12 YO - Cardhu
✅ Strathisla 12 YO - Strathisla
✅ Longmorn Distiller's Choice - Longmorn
✅ Linkwood 12 YO - Linkwood
✅ Glen Moray Elgin Classic - Glen Moray
✅ Glen Moray Port Cask Finish - Glen Moray
✅ The Singleton of Dufftown 12 YO - Dufftown
✅ Knockando 12 YO Master Reserve - Knockando
✅ Glen Elgin 12 YO - Glen Elgin
✅ Aultmore 12 YO - Aultmore
✅ Tormore 14 YO - Tormore

## Scotland — Highlands

✅ Glenmorangie The Original 10 YO - Glenmorangie
✅ Glenmorangie Nectar d'Or - Glenmorangie
✅ Glenmorangie Quinta Ruban 12 YO - Glenmorangie
✅ Glenmorangie Signet - Glenmorangie
✅ Dalwhinnie 15 YO - Dalwhinnie
✅ Oban 14 YO - Oban
✅ Aberfeldy 12 YO - Aberfeldy
✅ Aberfeldy 16 YO - Aberfeldy
✅ Aberfeldy 21 YO - Aberfeldy
✅ Ardmore Legacy - Ardmore
✅ Ben Nevis 10 YO - Ben Nevis
✅ Deanston 12 YO - Deanston
✅ Deanston Virgin Oak - Deanston
✅ Edradour 10 YO - Edradour
✅ Edradour Caledonia - Edradour
✅ Glen Garioch Founder's Reserve - Glen Garioch
✅ Glen Garioch 12 YO - Glen Garioch
✅ Glenglassaugh Sandend - Glenglassaugh
✅ Glenglassaugh Portsoy - Glenglassaugh
✅ Glendronach 12 YO Original - Glendronach
✅ Glendronach 15 YO Revival - Glendronach
✅ Glendronach 18 YO Allardice - Glendronach
✅ Clynelish 14 YO - Clynelish
✅ Royal Lochnagar 12 YO - Royal Lochnagar
✅ Royal Brackla 12 YO - Royal Brackla
✅ Blair Athol 12 YO - Blair Athol
✅ Loch Lomond Original - Loch Lomond
✅ Inchmurrin 12 YO - Loch Lomond
Tullibardine Sovereign - Tullibardine
Tullibardine 225 Sauternes Finish - Tullibardine
Glen Deveron 10 YO - Macduff
Nc'nean Organic Single Malt - Nc'nean
Ardnamurchan AD Single Malt - Ardnamurchan
GlenWyvis Single Malt - GlenWyvis

## Scotland — Lowlands

Auchentoshan Three Wood - Auchentoshan
Auchentoshan American Oak - Auchentoshan
Auchentoshan 18 YO - Auchentoshan
Glenkinchie 12 YO - Glenkinchie
Bladnoch 11 YO - Bladnoch
Kingsbarns Dream to Dram - Kingsbarns
Lindores Abbey MCDXCIV - Lindores Abbey
Annandale Man O'Sword - Annandale
Holyrood Single Malt - Holyrood
Clydeside Stobcross - Clydeside
Port of Leith One - Port of Leith
RyeLaw Rye - Borders Distillery
Lochlea Our Barley - Lochlea

## Scotland — Grains & Blends

Johnnie Walker Black Label 12 YO - Johnnie Walker
Johnnie Walker Green Label 15 YO - Johnnie Walker
Johnnie Walker Blue Label - Johnnie Walker
Chivas Regal 12 YO - Chivas Regal
Chivas Regal 18 YO - Chivas Regal
Ballantine's Finest - Ballantine's
Dewar's White Label - Dewar's
Cutty Sark Prohibition - Cutty Sark
Monkey Shoulder - William Grant & Sons
Grant's Triple Wood - Grant's
Teacher's Highland Cream - Teacher's
J&B Rare - J&B
Whyte & Mackay Triple Matured - Whyte & Mackay
Bell's Original - Bell's
William Lawson's - William Lawson's
Big Peat - Douglas Laing
Scallywag - Douglas Laing
Rock Oyster - Douglas Laing
Timorous Beastie - Douglas Laing
The Peat Monster - Compass Box
The Spice Tree - Compass Box
Hedonism - Compass Box
Haig Club Clubman - Cameronbridge
Girvan Patent Still No. 4 - Girvan

## Ireland

✅ Jameson Irish Whiskey - Midleton
Jameson Caskmates Stout Edition - Midleton
Jameson Black Barrel - Midleton
Jameson 18 YO - Midleton
Redbreast 12 YO - Midleton
Redbreast Lustau Edition - Midleton
Redbreast Cask Strength - Midleton
Powers Gold Label - Midleton
Powers John's Lane Release - Midleton
Green Spot - Midleton
Yellow Spot 12 YO - Midleton
Red Spot 15 YO - Midleton
Midleton Very Rare - Midleton
Method and Madness Single Pot Still - Midleton
Teeling Small Batch - Teeling
Teeling Single Malt - Teeling
Teeling Single Pot Still - Teeling
Roe & Co Blended Irish Whiskey - Roe & Co
Pearse Lyons The Original - Pearse Lyons
The Dublin Liberties Dead Man's Punch - Dublin Liberties
Slane Irish Whiskey - Slane
Tullamore D.E.W. Original - Tullamore D.E.W.
Tullamore D.E.W. 12 YO Special Reserve - Tullamore D.E.W.
Kilbeggan Small Batch Rye - Kilbeggan
The Tyrconnell 10 YO - Cooley
Connemara Peated Single Malt - Cooley
The Busker Single Pot Still - Royal Oak
The Legendary Silkie - Sliabh Liag
McConnell's Sherry Cask - McConnell's
Dunville's Three Crowns - Echlinville
Hinch Small Batch - Hinch
Clonakilty Port Cask - Clonakilty
Knappogue Castle 12 YO - Knappogue Castle
The Sexton Single Malt - The Sexton
Proper No. Twelve Irish Whiskey - Proper No. Twelve

## USA — Kentucky & Tennessee

Jim Beam White Label - Jim Beam
Jim Beam Double Oak - Jim Beam
Knob Creek 9 YO - Jim Beam
Basil Hayden's Kentucky Bourbon - Jim Beam
Booker's Bourbon - Jim Beam
Baker's 7 YO - Jim Beam
Maker's Mark - Maker's Mark
Maker's Mark 46 - Maker's Mark
Four Roses Yellow Label - Four Roses
Four Roses Small Batch - Four Roses
Four Roses Single Barrel - Four Roses
Wild Turkey 101 - Wild Turkey
Wild Turkey Rare Breed - Wild Turkey
Russell's Reserve 10 YO - Wild Turkey
Old Forester 86 Proof - Brown-Forman
Old Forester 1910 Old Fine Whisky - Brown-Forman
Woodford Reserve Double Oaked - Woodford Reserve
Blanton's Original Single Barrel - Buffalo Trace
Eagle Rare 10 YO - Buffalo Trace
E.H. Taylor Jr Small Batch - Buffalo Trace
W.L. Weller Special Reserve - Buffalo Trace
Angel's Envy Kentucky Bourbon - Angel's Envy
Bulleit Bourbon - Bulleit
Michter's US\*1 Small Batch Bourbon - Michter's
Willett Pot Still Reserve - Willett
Noah's Mill - Willett
Kentucky Peerless Small Batch - Peerless
Rabbit Hole Dareringer - Rabbit Hole
Barrell Bourbon - Barrell Craft Spirits
Jack Daniel's Old No. 7 - Jack Daniel's
Gentleman Jack - Jack Daniel's
George Dickel Barrel Select - George Dickel
Uncle Nearest 1884 Small Batch - Uncle Nearest

## USA — Rye & Craft

Bulleit 95 Rye - Bulleit
Michter's US\*1 Single Barrel Rye - Michter's
✅ WhistlePig 10 YO Rye - WhistlePig
High West Double Rye! - High West
Westward American Single Malt - Westward
Stranahan's Colorado Whiskey - Stranahan's

## Japan

✅ Yamazaki Distiller's Reserve - Yamazaki
✅ Yamazaki 12 YO - Yamazaki
✅ Hakushu Distiller's Reserve - Hakushu
✅ Hakushu 12 YO - Hakushu
✅ Chita Suntory Single Grain - Chita
Hibiki Japanese Harmony - Hibiki
Yoichi Single Malt - Yoichi
Miyagikyo Single Malt - Miyagikyo
Nikka From The Barrel - Nikka
Nikka Coffey Grain - Nikka
Nikka Coffey Malt - Nikka
Nikka Days - Nikka
Fuji Blended Whisky - Fuji Gotemba
Chichibu Ichiro's Malt Single Malt - Chichibu
Chichibu On The Way - Chichibu
Mars Komagatake Single Malt - Mars Shinshu
Mars Maltage Cosmo - Mars Shinshu
Akkeshi Single Malt - Akkeshi
Kanosuke Single Malt - Kanosuke
Shizuoka Single Malt Pot Still - Shizuoka
Hatozaki Finest Blended - Hatozaki
Togouchi Blended Whisky - Togouchi

## Canada

Crown Royal Deluxe - Crown Royal
Crown Royal Northern Harvest Rye - Crown Royal
Canadian Club 12 YO - Canadian Club
Lot 40 Rye - Lot 40
J.P. Wiser's 18 YO - J.P. Wiser's
Alberta Premium Dark Horse - Alberta Distillers
Forty Creek Barrel Select - Forty Creek
Glenora Canadian Single Malt - Glenora
Shelter Point Single Malt - Shelter Point
Macaloney's Island Single Malt - Macaloney's

## India

✅ Paul John Edited - Paul John
✅ Paul John Classic Select Casks - Paul John
✅ Rampur Indian Single Malt - Rampur
✅ Indri-Trini Single Malt - Indri
✅ Kamet Indian Single Malt - Kamet

## Taiwan

The Chuan Pure Malt - The Chuan

## Australia

Sullivans Cove French Oak - Sullivans Cove
Sullivans Cove American Oak - Sullivans Cove
Lark Classic Cask - Lark
Morris Muscat Barrel - Morris
Starward Nova - Starward
Starward Two-Fold - Starward

## Sweden

Mackmyra Svensk Ek - Mackmyra
High Coast Hav - High Coast

## Finland

Kyrö Malt Rye - Kyrö

## Denmark

Stauning Rye - Stauning

## England

Cotswolds Single Malt - Cotswolds
Bimber Re-Charred Oak - Bimber
The English Whisky Co Original - The English Whisky Co

## Israel

M&H Elements Red Wine Cask - Milk & Honey

## France

Armorik Breton Single Malt - Armorik
Armorik Classic Bio - Warenghem
Brenne French Single Malt - Brenne
Eddu Silver - Distillerie des Menhirs
Vilanova Berbie - Distillerie Castan
Domaine des Hautes Glaces Indigène - Domaine des Hautes Glaces
Glann ar Mor - Celtic Whisky Distillery
Kornog - Celtic Whisky Distillery
Lehmann Single Malt - Lehmann
Rozelieures Single Malt - Rozelieures
