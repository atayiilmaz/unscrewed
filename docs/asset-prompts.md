# Unscrewed!: ChatGPT asset prompt'ları

> **Oyun adı:** **Unscrewed!** (ünlem işareti adın parçası)
> Mağaza başlığı: **Unscrewed! Screw Puzzle** · TR mağaza: **Unscrewed! Vida Bulmacası**
> Slogan: EN *"Unscrew it. Fix it. Grow your workshop."* · TR *"Sök, tamir et, atölyeni büyüt."*

Her prompt'u ChatGPT'de **ayrı bir mesaj** olarak gönder. Önce aşağıdaki **STİL** bloğunu bir kez yapıştır ("bundan sonraki bütün görsellerde bu stili kullan" de), sonra prompt'ları sırayla gönder.

Çıkan dosyaları adıyla birlikte şu klasöre koy, gerisini ben hallederim:

```
sokum-ustasi/assets-in/
  brand/      ui/      icons/      concept/      textures/
```

- **İkonlar ve UI:** PNG, **şeffaf arka plan**. Grid istediğim yerlerde hücreler eşit olsun; ben keserim.
- **Konsept çizimler** (`concept/`): Bunlar oyuna doğrudan girmeyecek. 3D modelleri bu çizimlere bakarak koddan yeniden kuracağım; şekil, oran ve renk için referans olacaklar.
- **Gerçek 3D model istersen:** Karakter konseptini Meshy / Tripo gibi bir araçta GLB'ye çevirebilirsin. GLB gelirse onu doğrudan oyuna takarım.

---

## STİL (ilk mesaj, bir kez)

```
For every image in this conversation use one consistent art style for a casual mobile puzzle game called "Unscrewed!", about a cheerful mechanic who takes toys and gadgets apart screw by screw in his little neighbourhood workshop.

Style: stylized low-poly 3D look like modern hybrid-casual mobile games (Townscaper / Pocket City / Layer Boss vibe). Chunky, rounded, friendly shapes, soft studio lighting from the top-left, gentle ambient occlusion, no photorealism, no noise, no text unless asked.
Palette (use these hues): navy UI #1b2140 and #232f55, warm orange #ffb02e, teal #2fd3c4, red #ff4f5e, blue #3d8bff, yellow #ffc928, green #3fcf6b, purple #a46bff, wood #c9783a, cream #f3e2bf.
UI icons: bold readable silhouettes, 3/4 view, thick dark navy (#1b2140) outline, glossy highlights, centered with even padding, transparent background.
Never add watermarks, signatures or extra captions.
```

---

## 1. Marka (`brand/`)

**1.1 Uygulama ikonu** → `brand/app-icon.png` (1024×1024, köşeleri kare; iOS kendisi yuvarlatır)
```
App icon 1024x1024, full-bleed square, no transparency, no text. A big colorful phillips screw head popping out with a chunky glossy screwdriver, two small flying screws and sparkles, warm orange-to-navy radial background. Bold silhouette that still reads at 60px.
```

**1.2 Logo** → `brand/logo.png` (şeffaf, 1600×900)
```
Game logo on a transparent background, 1600x900. The single word "UNSCREWED!" in chunky rounded 3D letters with glossy highlights and a thick navy #1b2140 outline, letters slightly bouncy and tilted as if they are popping loose; "UN" in orange #ffb02e, "SCREWED" in white. The exclamation mark is built from a screwdriver (the stroke, red rubber grip on top) and a colorful phillips screw head (the dot). Two tiny loose screws and sparkles flying off the letters. No other text.
```

**1.3 Logo işareti (yalnızca simge)** → `brand/logo-mark.png` (şeffaf, 1024×1024)
```
Icon-only brand mark on a transparent background, 1024x1024, no text: the exclamation mark from the Unscrewed! logo (a screwdriver as the stroke and a colorful phillips screw head as the dot), navy outline, centered with generous padding. Will be shown on a solid #18213d background as the native launch screen.
```

---

## 1.5 Splash / yükleme ekranı (`brand/`)

Yükleme ekranı üç katmandan oluşacak: arka plan görseli, üstüne logo, en altta benim kodla çizeceğim ilerleme çubuğu ve "Yükleniyor %" yazısı. Bu yüzden arka plan **yazısız** olmalı. Üst kısım logo, alt kısım ilerleme çubuğu için sakin kalmalı.

**1.5.1 Splash arka planı** → `brand/splash-bg.png` (1290×2796, dikey)
```
Portrait mobile loading-screen illustration 1290x2796, no text, no logo. A cozy little neighbourhood garage at golden-hour dusk, seen from a slightly high 3/4 angle, stylized low-poly 3D look. The garage door is rolled up; warm light spills out onto the driveway. Inside: a cheerful chubby mechanic (blue overalls, orange cap, brown moustache) at a wooden workbench, happily unscrewing a colorful toy robot made of candy-colored acrylic plates; a few screws are flying through the air with tiny sparkles. Pegboard with tools, a radio, a potted plant, string lights. Outside: a quiet street, a parked small car, pine trees, a purple-orange sky with soft clouds.
Composition: keep the TOP 35% calm (mostly sky) for the logo, keep the BOTTOM 12% simple and darker (driveway) for a loading bar. Main subject centered in the middle band.
```

**1.5.2 Splash, logolu tam sürüm** → `brand/splash-full.png` (1290×2796): mağaza görselleri ve paylaşım kartı için
```
Same scene and composition as the previous splash background, now with the Unscrewed! logo (as designed before) placed in the top third, centered, slightly overlapping the sky. Still no other text.
```

**1.5.3 Yatay varyant (tablet / mağaza)** → `brand/splash-landscape.png` (2732×2048)
```
Landscape version 2732x2048 of the same garage scene, no text, no logo, subject slightly right of center, calm empty area on the left third for a logo, darker band at the bottom for a loading bar.
```

**1.5.4 Yükleme çubuğu süsü** → `brand/loader-screw.png` (şeffaf, 512×512)
```
Single glossy colorful screw seen from the front (phillips cross, orange #ffb02e with navy outline), transparent background, 512x512, centered. It will spin next to the loading bar.
```

---

## 2. Arayüz ikonları (`icons/`): grid sayfaları

Her biri **4×4 grid, 2048×2048, şeffaf arka plan, her hücre 512×512, yazı yok**. Hücre sırası soldan sağa, yukarıdan aşağıya. Dosya adı: `icons/sheet-A.png` …

**Sayfa A: para ve takviyeler** → `icons/sheet-A.png`
```
A 4x4 grid icon sheet, 2048x2048, transparent background, each cell 512x512 with the icon centered and even padding, no text, no grid lines. In order:
1 gold coin, 2 pile of gold coins, 3 blue gem, 4 gift box,
5 undo arrow (curved, white with navy outline), 6 red oil can with a drop, 7 metal magnetic tray with a plus sign, 8 hourglass,
9 lock, 10 green check mark, 11 star, 12 trophy,
13 play triangle button (orange), 14 pause, 15 restart circular arrow, 16 house/home.
```

**Sayfa B: beceriler ve menü** → `icons/sheet-B.png`
```
Same 4x4 sheet format. In order:
1 open case of colorful screwdrivers ("master kit"), 2 horseshoe magnet with screws stuck to it ("wide tray"), 3 rusty screw being sprayed by a spray can ("rust breaker"), 4 coin stack with a % badge ("haggling"),
5 yellow power drill with speed lines ("power drill"), 6 wrench and screwdriver crossed ("skills" tab), 7 potted plant ("decor" tab), 8 shop bag ("shop" tab),
9 photo album ("collection" tab), 10 settings gear, 11 speaker on, 12 speaker muted,
13 music note, 14 phone vibrating, 15 globe (language), 16 envelope (support).
```

**Sayfa C: tornavida uçları ve rütbe rozetleri** → `icons/sheet-C.png`
```
Same 4x4 sheet format. In order:
1 phillips screwdriver bit tip (top view, steel), 2 flat-head bit tip, 3 hex (allen) bit tip, 4 torx (star) bit tip,
5 round badge "apprentice" (blue cap), 6 badge "journeyman" (green cap, one star), 7 badge "mechanic" (orange cap, two stars), 8 badge "head mechanic" (purple cap, three stars),
9 badge "legend" (gold cap, crown), 10 rusty screw, 11 shiny new screw, 12 cardboard box of screws,
13 toolbox, 14 broken plate falling, 15 sparks burst, 16 confetti burst.
```

**Sayfa D: dekorlar** (3×3, 1536×1536, hücre 512) → `icons/sheet-D.png`
```
A 3x3 grid icon sheet, 1536x1536, transparent background, cells 512x512, no text. Workshop decorations in order:
1 desk lamp (orange shade), 2 potted plant, 3 retro teal radio,
4 framed poster, 5 wall clock, 6 red toolbox,
7 blue bench vise, 8 small toy robot model, 9 golden trophy.
```

**Sayfa E: koleksiyon nesneleri** (4×3, 2048×1536) → `icons/sheet-E.png`
```
A 4x3 grid icon sheet, 2048x1536, transparent background, cells 512x512, no text. Each is a cute toy-like object built from colorful flat acrylic plates held by visible colorful screws, in order:
1 toy car, 2 wall clock, 3 robot, 4 guitar,
5 gamepad, 6 old radio, 7 camera, 8 propeller plane,
9 house, 10 potted flower, 11 bicycle, 12 rocket.
```

---

## 3. Konsept çizimler (`concept/`): 3D modelleri bunlara benzeteceğim

**3.1 Usta karakteri, dönüş sayfası** → `concept/mechanic-turnaround.png` (2048×1024)
```
Character turnaround sheet, 2048x1024, plain light grey background, no text. A friendly chubby mechanic, chibi-ish proportions (big head ~1/3 of height), stylized low-poly 3D look: blue overalls with yellow buttons, white t-shirt, orange cap worn slightly tilted, brown moustache, rosy cheeks, brown work boots, a red screwdriver in a chest pocket. Show front, 3/4 front, side, and back views side by side in a T-ish relaxed pose, same scale.
```

**3.2 Usta pozları** → `concept/mechanic-poses.png` (2048×1024)
```
Pose sheet of the same mechanic, 2048x1024, plain light grey background, no text: walking, unscrewing at a bench, reaching up to a pegboard, spraying with an oil can, typing on a cash register, cheering with both arms up.
```

**3.3 Tamirhane, izometrik** → `concept/workshop-iso.png` (2048×2048)
```
Isometric cutaway of a small repair workshop on a suburban street corner, 2048x2048, 45-degree view, only the back and left walls standing. Inside: central wooden workbench with a half-disassembled toy, pegboard tool wall, a side table with magnetic trays, an oil/rust corner with barrels, a blue shop counter with a cash register, a drill press, ceiling lamps, a roof sign. Outside: road with a car, sidewalk, trees, neighbouring low-poly houses. No text.
```

**3.4 İstasyonların seviyeleri** → `concept/stations.png` (2048×2048)
```
Prop sheet, 2048x2048, plain light background, isometric views, no text, arranged in 5 rows, each row is one station upgrading left to right:
row 1 pegboard tool wall: 2 tools, 4 tools, 6 tools, 8 tools with a gold plaque;
row 2 side table with magnetic trays: 1 tray, 2 trays, 3 trays;
row 3 rust corner: a single rusty barrel, barrel plus spray-can shelf, plus a teal oiling machine with hose;
row 4 shop counter: empty counter, with cash register, with coin stacks, with a golden register;
row 5 drill: hand drill on a stool, small yellow drill press, bigger blue drill press, purple glowing drill press.
```

**3.5 Dekor ve çevre objeleri** → `concept/props.png` (2048×2048)
```
Prop sheet, 2048x2048, plain light background, isometric low-poly, no text: desk lamp, potted plant, retro radio on a small table, wall poster, wall clock, red toolbox, bench vise, toy robot, golden trophy, suburban house (two colour variants), pine tree, round bush, street lamp, small hatchback car (two colours).
```

**3.6 Oyun içi öğeler** → `concept/board-items.png` (2048×2048)
```
Item sheet, 2048x2048, plain light background, no text, top-down and 3/4 views: colorful pan-head screws (red, blue, yellow, green, purple, orange) with phillips, flat, hex and torx recesses; a rusty screw; translucent acrylic plates (bar, rectangle, disc) in candy colours with screw holes; a plastic parts bin with a hinged lid; a metal magnetic tray with 5 slots; a screwdriver with a coloured rubber grip.
```

---

## 4. Dokular (`textures/`): döşenebilir, 1024×1024

**4.1** → `textures/wood-board.png`
```
Seamless tileable texture 1024x1024, stylized warm light wood planks for a toy workbench board, soft painted grain, no knots, no text, flat lighting.
```
**4.2** → `textures/pegboard.png`
```
Seamless tileable texture 1024x1024, dark navy (#1f2a4f) pegboard with evenly spaced round holes in a 8x8 grid, stylized, flat lighting.
```
**4.3** → `textures/floor-tile.png`
```
Seamless tileable texture 1024x1024, stylized grey-blue workshop floor tiles 2x2, subtle wear, flat lighting, no text.
```

---

### Bunlar gelince ne yapacağım
- **Marka:** Uygulama ikonunu ve logoyu takacağım. Splash ekranını kuracağım: arka plan, üstte logo, altta dönen vidalı ilerleme çubuğu (Capgo güncellemesi indirilirken de bu ekran kullanılacak). Native açılış ekranı için logo işaretini kullanacağım.
- **İkonlar:** Grid sayfalarını keseceğim. Booster, beceri, menü, dekor, uç, rütbe ve koleksiyon ikonları SVG çizimlerin yerine geçecek. PNG'ler WebP'ye çevrilip küçültülecek.
- **Konseptler:**
  - Usta, istasyonlar ve dekorların 3D modellerini çizimlerin oranlarına, renklerine ve detaylarına göre yeniden kuracağım.
  - Pozları karakter animasyonlarına uygulayacağım.
  - Oyun içi vida, plaka ve kutuyu buna göre güncelleyeceğim.
- **Dokular:** Prosedürel ahşap ve pegboard dokularının yerine geçecek.
