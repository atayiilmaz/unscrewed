# Unscrewed!

_Çalışma adı: Söküm Ustası. Mağaza başlığı: "Unscrewed! Screw Puzzle" / TR "Unscrewed! Vida Bulmacası"._

Vida bulmacası: renkli vidaları söküp aynı renkteki kutulara doldur. Farkı yaratan mekanikler:

- **Tornavida uçları** — yıldız / düz / alyan / torx. Elindeki uç vidaya uymalı; uç değiştirme hakkı sınırlı.
- **Sallanan plakalar** — tek vidası kalan plaka o vidanın etrafında sallanır, başka vidaları kapatıp açabilir.
- **Paslı vidalar** — dönmeden önce ekstra dokunuş ister.
- **Nesne seviyeleri** — araba, saat, robot, gitar, oyun kolu, radyo, fotoğraf makinesi, uçak, ev, çiçek, bisiklet, roket.
- **Gerçekçi katmanlar** — vidası kalmayan plaka, üstünde hâlâ duran bir plaka varken düşmez; o plaka gidince düşer.
- **Meta** — coin, takviyeler (Geri Al / Yağ / +1 Yuva), 5 beceri (Usta Takımı, Geniş Tepsi, Pas Sökücü, Pazarlık, Hızlı Matkap), animasyonlu atölye sahnesinde dekorlar, usta seviyesi ve rütbe.
- **Ana ekran** — izometrik 3D mahalle ve kesit tamirhane; her beceri seviyesiyle görünüşü değişen bir istasyon, primitiflerden kurulu 3D usta çalışıp istasyonlar arasında dolaşır. Sürükle / iki parmakla yakınlaştır.
- **Ayarlar** — ses, müzik (prosedürel), titreşim, dil, grafik kalitesi, bildirim / satın alım geri yükleme (mağaza sürümünde), destek, gizlilik, ilerlemeyi sıfırla.
- **Koleksiyon** — sökülen nesnelerin albümü.
- **Dil** — Türkçe ve İngilizce (`src/i18n.ts`); cihaz diline göre seçilir, ana ekrandan değiştirilir.

Stack: Vite + React + React Three Fiber (Three.js) + zustand. Mobil için Capacitor + Capgo OTA (sonraki adım).

## Komutlar

```bash
npm run dev          # oyunu tarayıcıda aç
npm test             # kurallar + her seviyenin solver ile çözülebilirliği
npm run gen:levels   # src/game/levels.generated.json'u yeniden üret
npm run import:assets # assets-in/ içindeki görselleri kesip public/ altına WebP olarak hazırla
npm run build
```

## Yapı

| Yol | İçerik |
|---|---|
| `src/game/rules.ts` | Saf oyun kuralları (dokunma, uç değişimi, kutu/tepsi, kazan/kaybet) |
| `src/game/physics.ts` | Plaka sallanma/düşme (2D pendulum, kütüphanesiz) |
| `src/game/solver.ts` | En az uç değişimiyle çözüm arayan solver; seviye doğrulama ve üretim için |
| `src/game/templates.ts` | Nesne şablonları (plaka şekilleri); vida yerleri otomatik çıkarılır |
| `src/game/generate.ts` | Şablon × varyant → seviye, zorluk eğrisi (sadece script/test, oyuna girmez) |
| `src/game/levels.ts` | 3 öğretici seviye + üretilmiş JSON (toplam 63) |
| `src/game/profile.ts` | Coin, takviye, geliştirme, dekor, rütbe, kayıt |
| `src/game/store.ts` | zustand store: ekranlar, kurallar, geri al geçmişi, zamanlama, ses/titreşim |
| `src/scene/` | R3F sahnesi: tahta, plakalar, vidalar, kutular, tepsi, parçacıklar, prosedürel dokular |
| `src/ui/Hud.tsx` | Oyun içi üst bar, takviyeler, uç kemeri, sonuç panelleri, demo reklam |
| `src/home/` | 3D ana ekran: `World` (mahalle), `Room` (tamirhane, tezgâh, dekor), `Stations` (seviyeli istasyonlar), `Mechanic` (karakter + davranış), `labels` (ekran etiketleri), `HomeScene` (kamera) |
| `src/ui/Workshop.tsx` | Ana ekran arayüzü: üst bar, alt menü, alt paneller (beceri, dekor, market, koleksiyon) |
| `src/ui/Settings.tsx` | Ayarlar (ana ekran ve oyun içi duraklatma) |
| `src/services/music.ts` | Prosedürel arka plan müziği |
| `src/ui/Loader.tsx` | Yükleme ekranı (splash, logo, ipuçları, vidalı ilerleme çubuğu) |
| `scripts/import-assets.mjs` | Ham görsellerden ikon kesme, şeffaflık temizleme, WebP, uygulama ikonları |
| `assets-in/` | ChatGPT'den gelen ham görseller (kaynak; oyuna doğrudan girmez) |
| `public/ui`, `public/brand`, `public/tex` | Oyuna giren hazırlanmış görseller |
| `src/ui/art.tsx` | SVG ikonlar, dekor çizimleri, usta avatarı, iş önizlemesi |
| `src/scene/Screwdriver.tsx` | Vidayı söken 3D tornavida animasyonu |
| `src/i18n.ts` | TR/EN metinler |
| `src/services/ads.ts` | Reklam arayüzü — web'de demo, native'de AdMob'a bağlanacak |

Yeni nesne eklemek için `templates.ts`'e bir şablon ekleyip `npm run gen:levels` çalıştırmak yeterli.
Seviyeler veri (JSON) olduğu için store sürümü beklemeden OTA ile gönderilebilir. Solver plakaların
sallanmasını yok sayar; bütçe bu yüzden minimumun üstüne `slack` ekler.

## iPhone'da test

Capacitor ile `ios/` altında native bir iOS projesi var (bundle id `io.peax.unscrewed`, ekip `7K9DA5AX76`).

```bash
npm run ios        # build → sync → derle → telefona yükle → aç (internetsiz, mağaza sürümü gibi)
npm run dev -- --host   # ayrı terminalde, sonra:
npm run ios:dev    # telefon Mac'teki dev sunucusundan canlı yüklenir; kaydettikçe yenilenir
npm run ios:open   # projeyi Xcode'da aç
```

Telefon kabloyla bağlı ya da aynı Wi-Fi'de, kilidi açık olmalı. Birden fazla cihaz varsa `IOS_DEVICE=<uuid>`.

## Android'de test

`android/` altında native Android projesi var (`io.peax.unscrewed`). Telefonda Geliştirici seçenekleri → USB hata ayıklama açık olmalı.

```bash
npm run android       # build → sync → APK → USB ile bağlı telefona yükle → aç
npm run android:dev   # canlı yükleme (ayrı terminalde `npm run dev -- --host`)
npm run android:open  # Android Studio'da aç
```

Telefon bağlı değilse APK yine üretilir: `android/app/build/outputs/apk/debug/app-debug.apk` (telefona gönderip kurulabilir).

## Web kodu → iOS / Android

Oyun tek bir web kodu. `npm run build` → `dist/`; `npx cap sync` bunu iki native projeye kopyalar.
`ios/` ve `android/` klasörleri bir kez `npx cap add ios|android` ile oluşturuldu ve repoda tutulur;
ikon, izin, yön gibi native ayarlar orada. Yeni Capacitor eklentisi kurunca `npx cap sync` yeterli.
