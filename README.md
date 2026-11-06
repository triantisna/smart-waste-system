# 🌿 Smart Waste System (Integrated Waste Management Platform)

Smart Waste System adalah platform pengelolaan dan pelaporan sampah berbasis teknologi modern yang mengintegrasikan Aplikasi Mobile (Expo/React Native) untuk warga/petugas lapangan, Web Dashboard (Next.js) untuk administrator, serta REST API Machine Learning (FastAPI & MobileNetV2) untuk klasifikasi citra sampah otomatis.

---

## 📂 Struktur Repositori

```text
smart-waste-system/
├── database/              # Skema SQL / ERD database Supabase
├── dataset/               # Sampel dataset gambar (atau link Google Drive jika ukuran file terlalu besar)
├── evaluation/            # Hasil evaluasi model (Confusion Matrix plot, classification report)
├── waste-ml-api/          # Source code FastAPI & model Machine Learning (.h5 / .keras)
├── waste-mobile/          # Source code aplikasi Expo (React Native)
├── waste-web-backend/     # Source code Next.js Web Dashboard & Admin
└── README.md              # Dokumentasi lengkap panduan instalasi & penggunaan
```

---

## 🛠️ Tech Stack

* **Frontend Web**: Next.js 15, React, Tailwind CSS
* **Mobile App**: Expo (React Native), Expo Camera, Expo Location
* **Backend & Database**: Supabase (PostgreSQL, Auth, Storage, RLS)
* **Machine Learning & API**: Python 3.9, TensorFlow / Keras (MobileNetV2), FastAPI, Uvicorn
* **Maps & Geocoding**: Leaflet.js, OpenStreetMap (Nominatim API)

---

## 🚀 Panduan Instalasi & Menjalankan Proyek

Pastikan Anda telah menginstal Node.js, Python, dan Git di komputer Anda.

### 1. Konfigurasi Database (Supabase)
* Buat *project* baru di Supabase.
* Buat tabel utama `users` dan `reports` sesuai skema database.
* Atur Storage Bucket (misal: `report-images`) dengan akses publik untuk penyimpanan foto laporan.

### 2. Menjalankan Machine Learning API (`waste-ml-api`)
```bash
# Masuk ke folder ml-api
cd waste-ml-api

# Buat dan aktifkan virtual environment
python -m venv venv
source venv/bin/activate  # Untuk Windows: venv\Scripts\activate

# Install dependensi
pip install -r requirements.txt

# Jalankan server FastAPI
uvicorn main:app --reload --port 8000
```
> *API ML akan berjalan di `http://localhost:8000` (Dokumentasi Swagger: `http://localhost:8000/docs`).*

### 3. Menjalankan Web Dashboard Admin (`waste-web-backend`)
```bash
# Masuk ke folder web
cd waste-web-backend

# Install dependensi
npm install

# Buat file .env.local dan sesuaikan konfigurasi Supabase Anda
# NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Jalankan mode development
npm run dev
```
> *Web Admin akan berjalan di `http://localhost:3000`.*

### 4. Menjalankan Aplikasi Mobile (`waste-mobile`)
```bash
# Masuk ke folder mobile
cd waste-mobile

# Install dependensi
npm install

# Konfigurasi URL API ML dan Supabase di file lib/supabase.ts atau file konfigurasi
# Jalankan Expo
npx expo start
```
> *Gunakan aplikasi Expo Go di perangkat Android/iOS Anda untuk memindai QR code yang muncul.*

---

## 👥 Kontributor

* **Trian Tisna Athalla** - S1 Ilmu Komputer Universitas Pendidikan Indonesia