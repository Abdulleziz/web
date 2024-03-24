# Abdulleziz

## [Yetkiler](/src/utils/abdulleziz.ts)

- oylamaya katıl
- maaş al
- çay koy
- *i*n-t\*i.h?a_r ½et=
- çay satın al
- çaycıyı sinemle
- bonus iste
- araba sür
- stajları yönet
- forum thread pinle
- arabaları yönet
- çalışanları yönet
- forum thread sil
- forum thread kilitle
- forumu yönet

<!-- ***[yetki değerleri](/src/utils/zod-utils.ts)*** -->

### [yetki değerleri](/src/utils/zod-utils.ts)

## Roller

- CEO seçme oylaması
  - en fazla haftada bir olmalı
  - en fazla 3 gün sürmeli
  - en az %50 seçilme oranı
- Rol düşürme
  - oylamayla yapılmalı\*
  - CEO düşürülemez. (oylama ile seçilir)
  - tamamlanması için oy verenlerin [**yetki değer**](#yetki-değerleri)lerinin toplamı düşürülen rolün [**yetki değer**](#yetki-değerleri)inin **2** katı olmalı.
  - *Örneğin; CEO Servant'ı tek oy ile düşürebilir. Veya Driver, Servant'ı düşürmek için en az bir kişiden yardım almalıdır.*
- Rol yükseltme
  - oylamayla yapılmalı\*
  - CEO'ya yükseltilemez. (oylama ile seçilir)
  - tamamlanması için oy verenlerin [**yetki değer**](#yetki-değerleri)lerinin toplamı yükseltilen rolün [**yetki değer**](#yetki-değerleri)inin **1,5** katı olmalı.
  - *Örneğin; CEO, Kullanıcıyı tek oy ile HR'a yükseltebilir. Veya QA Lead, kullanıcıyı HR yapmak için en az bir kişiden yardım almalıdır.*

## Mağaza

### [Ürünler](/src/utils/entities.ts)

- Çay
- Araba
- Telefon
- Hitman

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

- [x] Yeni Thread
- [x] Yeni Post

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
- [ ] 6 Kere çaycıyı sinemleme -> atılma
- [ ] Maaş\* (haftada bir)

## Banka

Abdülleziz bankası, sadece CEO ve muhasebe yönetiminde olup şirketin gelir ve giderlerinin yapıldığı; CSO'nun herhangi bir illegal aksiyonda OHAL durumuna sokabilme yetkisi olan güvenli bir bankadır.

- Her hafta maaş dağıtılmak zorundadır, 2 kere dağıtılmazsa otomatik olarak OHAL ilan edilir.
- Bütün şirket sorumluluğu CEO'ya aittir
- OHAL anında banka kitlenir, CEO ve CFO düşer. Yeni CEO atanıncaya kadar böyle kalır.
- OHAL anında Vice President geçici görev alır. Yok ise şirketteki CSO dışında en yüksek çalışan görevi devralır.
- CSO haricinde OHAL ilan edilirse, CSO da düşer.

### Gelir/Gider

- Gelirler

  - Şirketin ortalama büyüklüğü, ahlak puanı ve proje sayısına göre gelir oluşur.
    - Ahlak puanı, şirketin kara para aklaması ve düzensizliği sonucunda rol dışı adminler tarafından değiştirilir.
    - Projeler hem şirkete hem de proje sahibine kazanç sağlar.

- Giderler

  - Maaşlar, rol sayısı ve rollerin yüksekliği bakımından hesaplanır.

### CEO

- Para akışını kontrol edebilir, parayı kendine çekebilir. Şirketin sahibi olduğu için şirket bütçesi aynı zamanda CEO'nun kişisel parasıdır.
- Muhasebe ile iletişimde olmalıdır. Örneğin muhasebe zamanında maaş yatıramazsa bütün sorumluluk CEO'ya aittir.
- Şirket bütçesinde açık varsa bu açığı kendi cebinden kapatmak zorundadır. Eğer kapatamazsa CSO OHAL ilan edebilir.

### Muhasebe

- Şirket bütçesini işletir. (Bütçeyi görüntüleyebilir, maaş dağıtabilir)
- Her hafta maaşları düzenli yatırmalıdır.
  - Muhasebe, maaş günü geldiğinde muhasebe panelinden herkese maaşları dağıtmalıdır.
  - Maaş gününde 00:00 dan 23:59'a kadar dağıtma sorumluluğundadır.

### CSO

- Bankanın para akış trafiğini denetleme yetkisi vardır. Yapılan bütün işlemleri görebilir ama herhangi bir değişim yapamaz.
- Herhangi bir illegal aksiyonda rapor yetkisi bulunmaktadır ve bu görevi yerine getirmelidir.
- Herkesi sorgulatabilir. Muhasebeden kaynaklı bir problem oluştuğunda, muhasebeyi sorguya çekebilir.
- OHAL ilan edebilir. Kurul toplanıtısı yapılır.
