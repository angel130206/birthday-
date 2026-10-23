# 🎂 Selamat Ulang Tahun, Mama

Sebuah halaman kejutan ulang tahun: kotak hadiah yang harus diketuk dulu, kue dengan lilin yang bisa ditiup, amplop bersegel lilin, galeri polaroid, lentera doa, dan kembang api yang bisa dipanggil kapan saja.

Dibuat dengan HTML, CSS, dan JavaScript murni — **tanpa build, tanpa library, tanpa internet wajib**. Semua efek (kembang api, konfeti, lentera, musik) dibuat langsung di browser.

---

## ✨ Apa saja isinya

| Bagian | Kejutan |
| --- | --- |
| **Pembuka** | Kotak hadiah dengan pita, mengambang, dan bercahaya. Diketuk → pita lepas, cahaya keluar, konfeti, kembang api, musik mulai. |
| **Hero** | Nama Mama dengan huruf emas berkilau, balon, kelopak bunga beterbangan. |
| **Kue** | Kue tiga tingkat dengan lilin menyala. Tombol **Tiup Lilin** → asap, permohonan terbang, kembang api berbentuk hati. |
| **Surat** | Amplop dengan segel lilin. Sekali buka, surat muncul perlahan di atas kertas bergaris. |
| **Kenangan** | Polaroid miring yang bisa diketuk untuk diperbesar. |
| **Alasan Mama Hebat** | Enam kartu kenapa Mama istimewa. |
| **Lentera Doa** | Tulis doa → lentera terbang ke langit. Doa tersimpan di browser. |
| **Penutup** | Tombol kembang api besar & ulangi kejutan. |

**Interaksi tambahan**

- Ketuk / klik di mana saja di halaman → kembang api meluncur dari titik itu.
- Gerakkan kursor di desktop → jejak kilau keemasan.
- Kembang api muncul sendiri setiap beberapa detik.
- Musik *Happy Birthday* ala kotak musik (disintesis dengan Web Audio, tombol **Musik** di kanan atas untuk mematikan).
- Semua suara baru aktif setelah Mama mengetuk hadiah (aturan autoplay browser).

---

## 🚀 Cara membuka

**Paling gampang:** klik dua kali `index.html`.

Kalau ingin lewat server lokal (disarankan, supaya semua path rapi):

```bash
python3 -m http.server 5173
```

lalu buka <http://localhost:5173>.

---

## ✏️ Cara mengubah isinya

Semua yang perlu diganti ada di **satu file**: `assets/js/config.js`. Cukup buka dengan editor teks.

```js
window.BIRTHDAY_CONFIG = {
  nama: "Mama",              // nama yang dirayakan
  pengirim: "Anakmu",        // tanda tangan di akhir surat
  tanggal: "23 Oktober",
  tahun: 2026,
  jumlahLilin: 5,            // 1–7
  surat: [ "paragraf 1", "paragraf 2", ... ],
  ...
};
```

### Mengganti foto

1. Siapkan foto (format `.jpg` atau `.png`), taruh di folder `assets/img/`.
2. Sesuaikan daftar `foto` di `config.js`:

```js
foto: [
  { src: "assets/img/foto-1.jpg", caption: "Selalu ada pelukan yang menunggu" },
  { src: "assets/img/foto-2.jpg", caption: "Bunga untuk yang paling berjasa" },
  { src: "assets/img/foto-3.jpg", caption: "Sesuatu yang manis, untuk Mama" }
],
```

Boleh ditambah atau dikurangi — galerinya menyesuaikan sendiri. Foto bawaan hanyalah gambar ilustrasi (AI), silakan ganti dengan foto asli Mama.

### Lain-lain

- `pembuka` — kalimat kecil di layar kotak hadiah.
- `tagline` — kalimat di bawah judul besar.
- `alasan` — daftar kartu (ikon, judul, isi).
- `doaAwal` — doa yang sudah tampil sejak awal. Doa baru yang ditulis Mama akan tersimpan di browser.
- `jumlahLilin` — jumlah lilin di atas kue.

---

## 🌐 Supaya bisa dikirim lewat WhatsApp

Karena ini hanya file statis, ada banyak cara gratis:

1. **GitHub Pages** — unggah repo ini, lalu *Settings → Pages → Deploy from branch* dan pilih `main` / root.
2. **Netlify Drop** — buka <https://app.netlify.com/drop>, tarik seluruh folder ini ke sana, langsung dapat tautan.
3. **Vercel / Cloudflare Pages** — sama, cukup tunjuk folder ini.

Setelah dapat tautannya, kirim ke Mama. 🤍

---

## 📁 Struktur

```
.
├── index.html
├── assets
│   ├── css/style.css     # seluruh tampilan: kue, hadiah, amplop, langit
│   ├── img/              # foto kenangan
│   └── js
│       ├── config.js     # 👈 semua teks & foto diatur di sini
│       ├── fx.js         # mesin efek: kembang api, konfeti, lentera, bintang
│       ├── audio.js      # musik & efek suara (Web Audio, tanpa file audio)
│       └── app.js        # logika interaksi
└── README.md
```

Selamat merayakan. 🎉
