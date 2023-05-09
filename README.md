# Abdulleziz

## [Yetkiler](/src/utils/abdulleziz.ts)

- forum thread sil
- oylamaya katıl
- maaş al
- çay koy
- *i*n-t*i.h?a_r ½et=
- çay satın
- çaycıya kız
- zam iste
- araba sür
- stajları yönet
- forum thread
- arabaları yönet
- çalışanları yönet
- forumu yönet
<!-- ***[yetki değerleri](/src/utils/zod-utils.ts)*** -->
### [yetki değerleri](/src/utils/zod-utils.ts)

## Roller

- CEO seçme oylaması
  - en fazla haftada bir olmalı
  - en fazla 3 gün sürmeli
  - en az 6 oy gerekli (toplam 9 kullanıcı); %66.6 seçilme oranı
- Rol düşürme
  - oylamayla yapılmalı*
  - CEO düşürülemez. (oylama ile seçilir)
  - tamamlanması için oy verenlerin [**yetki değer**](#yetki-değerleri)lerinin toplamı düşürülen rolün [**yetki değer**](#yetki-değerleri)inin **2** katı olmalı.
  - *Örneğin; CEO Servant'ı tek oy ile düşürebilir. Veya Driver, Servant'ı düşürmek için en az bir kişiden yardım almalıdır.*
- Rol yükseltme
  - oylamayla yapılmalı*
  - CEO'ya yükseltilemez. (oylama ile seçilir)
  - tamamlanması için oy verenlerin [**yetki değer**](#yetki-değerleri)lerinin toplamı yükseltilen rolün [**yetki değer**](#yetki-değerleri)inin **1,5** katı olmalı.
  - *Örneğin; CEO, Kullanıcıyı tek oy ile HR'a yükseltebilir. Veya QA Lead, kullanıcıyı HR yapmak için en az bir kişiden yardım almalıdır.*

## Mağaza

### [Ürünler](/src/utils/entities.ts)

- Çay
- Araba
- Telefon

## [Geçmiş](src/components/panels/HistoryPanel.tsx)

- Para Transferleri (maaş, gönderme, satın alma)
- Çay içme
- Yeni Hatırlatıcı
- Yeni Thread

## Bildirimler

### Forum

Genel:

```diff
Kullanıcı: Genel Forum Bildirim Seçenekleri:
++ Bildirimler Açık
.. Sadece Bahsetmeler
```

Thread Başına:

```diff
Spesifik Forum Bildirim Seçenekleri (Kullanıcı Ayarı):
Örneğin; kullanıcı bu threadi dinlemek istemiyor olabilir.
++ Bildirimler Açık
.. Sadece Bahsetmeler
-- Sustur
```

```diff
Spesifik Forum Bildirim Seçenekleri (Thread Ayarı):
Örneğin; thread sahibi, yeni mesajların sessiz iletilmesini isteyebilir.
++ Bildirimler Açık
.. Sadece Bahsetmeler
```

- [X] Yeni Thread
- [X] Yeni Post

### Hatırlatıcı

```diff
Hatırlatıcı Bildirim Seçenekleri:
++ Bildirimler Açık
.. Sadece Uyarılar
-- Sustur
```

- [ ] Yeni Hatırlatıcı
- [ ] Hatırlatıcı Uyarısı (belki?)
- [ ] Hatırlatıcı Silme (belki?)
- [ ] Hatırlatıcı Kapatılma/Açılma (belki?)

### Kullanıcı Bildirimleri

`TODO: Seçenekler`

- [ ] Rol Değişikliği
- [ ] Yeni Oy
- [ ] 6 Kere çaycıya kızma -> atılma
- [ ] Maaş* (12 saatte bir bildirim pek mantıklı olmayabilir)
