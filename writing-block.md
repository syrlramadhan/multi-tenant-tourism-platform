# PROJECT: MULTI-TENANT TOURISM CMS

## 1. ROLE & OBJECTIVE

Bertindaklah sebagai Senior Full-Stack Engineer, Software Architect, dan UI/UX Engineer yang berpengalaman dalam membangun aplikasi SaaS, Content Management System (CMS), dan Multi-Tenant Architecture.

Saya ingin membangun sebuah platform **Tourism CMS** yang digunakan untuk mengelola tiga website pariwisata berbeda melalui satu aplikasi, satu codebase, dan satu database.

Aplikasi ini harus dibangun menggunakan **Next.js sebagai framework fullstack utama**, sehingga frontend, backend API, authentication, business logic, dan database integration berada dalam satu project Next.js.

Tujuan utama:
- Membangun satu aplikasi CMS untuk tiga website pariwisata.
- Setiap website memiliki subdomain, konten, dan pengguna masing-masing.
- Setiap website memiliki maksimal 30 pengguna pengelola konten.
- Terdapat satu Superadmin yang dapat mengelola seluruh website dan pengguna.
- Superadmin dapat mengaktifkan atau menonaktifkan modul CMS pada setiap website.
- Ketiga website menggunakan satu template frontend yang sama.
- Setiap konten yang diunggah harus menampilkan informasi identitas pengunggahnya.

**PENTING:**
Jangan membuat tiga aplikasi terpisah atau melakukan cloning source code secara fisik. Gunakan pendekatan Multi-Tenant Architecture dengan Shared Application dan Shared Database.

Jangan menggunakan Golang, microservices, atau n8n. Seluruh business logic dan backend API harus menggunakan Next.js.

---

## 2. DESIGN SYSTEM — WAJIB MENGIKUTI DESIGN.md

Sebelum melakukan implementasi, baca dan analisis file `DESIGN.md` yang tersedia pada root project.

File tersebut merupakan sumber utama seluruh keputusan desain UI/UX.

WAJIB:
- Mengikuti color palette yang telah ditentukan.
- Mengikuti typography dan font hierarchy.
- Mengikuti spacing system.
- Mengikuti border radius.
- Mengikuti button styles.
- Mengikuti card styles.
- Mengikuti input dan form styles.
- Mengikuti responsive breakpoints.
- Mengikuti elevation dan shadow.
- Mengikuti karakteristik visual keseluruhan.

Jangan membuat design system baru yang bertentangan dengan DESIGN.md.

### Prinsip visual yang harus dipertahankan:

- Primary color: #533afd.
- Primary deep: #4434d4.
- Brand dark: #1c1e54.
- Ink: #0d253d.
- Background utama: #ffffff.
- Background sekunder: #f6f9fc.
- Border: #e3e8ee.
- Gunakan font Inter sebagai alternatif Sohne jika font asli tidak tersedia.
- Gunakan font weight 300 untuk display typography.
- Gunakan negative letter spacing pada display headings.
- Gunakan pill-shaped buttons dengan border-radius 9999px.
- Gunakan card dengan border tipis dan shadow yang subtle.
- Gunakan gradient mesh sesuai panduan DESIGN.md pada marketing/public website hero.
- Gunakan dark navy surfaces untuk elemen dashboard yang memang memerlukan kontras.

### Dashboard Design

Dashboard CMS dan Superadmin harus tetap mengikuti identitas visual DESIGN.md, tetapi mengutamakan produktivitas.

Gunakan:
- Sidebar navigation.
- Top navigation.
- Breadcrumb.
- Data tables.
- Statistics cards.
- Search dan filter.
- Modal dan confirmation dialog.
- Dropdown menus.
- Toast notifications.
- Pagination.
- Skeleton loading.
- Empty states.
- Responsive layouts.

Jangan membuat dashboard terlihat seperti template admin generik yang tidak memiliki identitas visual.

---

## 3. TECHNOLOGY STACK

Gunakan teknologi berikut:

### Fullstack Framework
- Next.js versi stabil terbaru yang kompatibel dengan project.
- App Router.
- TypeScript.
- React Server Components jika sesuai.
- Server Actions untuk operasi yang sesuai.
- Route Handlers untuk REST API.

### Styling
- Tailwind CSS.
- shadcn/ui sebagai komponen dasar yang dapat disesuaikan dengan DESIGN.md.
- Lucide React untuk icon.
- React Hook Form.
- Zod untuk validasi.

### Database
- PostgreSQL.
- Prisma ORM.
- Database migrations.

### Authentication & Authorization
- Auth.js atau solusi authentication yang kompatibel dengan Next.js.
- Secure session management.
- Role-Based Access Control (RBAC).

### Media Storage
- S3-compatible object storage.
- Mendukung upload gambar dan dokumentasi.
- Pisahkan penyimpanan media berdasarkan tenant.

### Supporting Libraries
- TanStack Table untuk data table.
- Recharts untuk visualisasi statistik jika diperlukan.
- date-fns untuk pengelolaan tanggal.

Gunakan struktur kode yang modular, maintainable, reusable, dan scalable.

Jangan menambahkan dependency yang tidak diperlukan.

---

# 4. MULTI-TENANT ARCHITECTURE

Sistem memiliki tiga website yang menggunakan satu aplikasi Next.js.

Contoh domain:

- wisata-a.example.com
- wisata-b.example.com
- wisata-c.example.com

Dashboard CMS dapat menggunakan:
- cms.example.com

Ketiga website publik menggunakan template yang sama.

### Tenant Resolution

Implementasikan Tenant Resolver yang mengidentifikasi tenant berdasarkan hostname/domain yang sedang diakses.

Contoh:

User membuka:
wisata-a.example.com

Sistem:
1. Membaca hostname.
2. Mencari domain pada tabel tenants.
3. Mengidentifikasi tenant.
4. Mengambil konfigurasi website.
5. Mengambil konten berdasarkan tenant_id.
6. Menampilkan website milik tenant tersebut.

Lakukan proses yang sama untuk ketiga domain.

Jangan mengandalkan parameter tenant yang dikirim dari browser sebagai sumber identitas tenant.

Tenant harus divalidasi melalui database.

### Shared Database

Gunakan satu database PostgreSQL dengan shared tables.

Semua data yang bersifat tenant-specific wajib memiliki tenant_id.

Contohnya:
- Destinations.
- Accommodations.
- Fashion.
- Vehicles.
- Culinary.
- Tour Guides.
- Groceries.
- Documentations.
- Media.
- Website configurations.

Setiap query harus memiliki pembatasan tenant yang benar.

Jangan sampai user Website A dapat membaca, mengubah, atau menghapus data Website B.

Terapkan validasi tenant pada seluruh backend operations, bukan hanya menyembunyikan data di frontend.

Pertimbangkan PostgreSQL Row Level Security sebagai perlindungan tambahan.

---

# 5. USER ROLES & PERMISSIONS

Buat tiga jenis role utama.

## A. SUPERADMIN

Superadmin merupakan pemilik dan pengelola seluruh platform.

Superadmin memiliki akses global.

Fitur:
- Melihat statistik seluruh website.
- Mengelola ketiga website.
- Membuat website baru.
- Mengubah domain website.
- Mengaktifkan atau menonaktifkan website.
- Mengelola seluruh pengguna.
- Membuat dan mengelola user.
- Mengatur role dan permission.
- Mengaktifkan atau menonaktifkan modul CMS pada setiap tenant.
- Melihat seluruh konten dari semua tenant.
- Mengelola konfigurasi website.
- Melihat aktivitas pengguna.
- Melihat informasi siapa yang membuat dan mengubah konten.

Superadmin dapat melakukan filter data berdasarkan website.

## B. WEBSITE ADMIN

Setiap tenant dapat memiliki admin website masing-masing.

Contoh:
- Admin Website A hanya mengelola Website A.
- Admin Website B hanya mengelola Website B.
- Admin Website C hanya mengelola Website C.

Fitur:
- Mengelola pengguna pada tenant sendiri.
- Membuat dan mengelola konten.
- Mengelola seluruh kategori yang diizinkan.
- Mengelola dokumentasi.
- Melihat statistik website.
- Melihat aktivitas pengguna tenant sendiri.
- Mengelola proses persetujuan konten.

Admin tidak boleh mengakses data tenant lain.

## C. CONTENT MANAGER

Content Manager bertugas membuat dan mengelola konten sesuai permission yang diberikan.

Fitur:
- Membuat konten.
- Mengedit konten.
- Mengunggah gambar.
- Mengelola dokumentasi.
- Mengelola data destinasi wisata.
- Mengelola kategori lainnya sesuai permission.
- Melihat status publikasi konten.

Implementasikan RBAC secara fleksibel.

Jangan mengandalkan pengecekan role hanya di frontend. Semua permission harus divalidasi di server.

### User Limit

Setiap tenant memiliki maksimal 30 pengguna aktif, termasuk Admin Website.

Superadmin tidak termasuk dalam kuota tenant.

Sistem harus menolak pembuatan user ke-31 pada tenant yang sudah mencapai batas.

Batas ini harus divalidasi secara server-side dan aman terhadap concurrent requests.

---

# 6. CONTENT MANAGEMENT SYSTEM

Buat CMS dengan modul berikut:

1. Destinasi Wisata.
2. Akomodasi.
3. Fashion.
4. Kendaraan.
5. Kuliner.
6. Guide / Tour Guide.
7. Sembako.
8. Dokumentasi.

Setiap modul memiliki:
- List data.
- Detail data.
- Create.
- Edit.
- Delete.
- Upload media.
- Search.
- Filter.
- Pagination.
- Draft.
- Published.
- Archived.
- Informasi pembuat konten.
- Informasi terakhir yang mengubah konten.

### A. DESTINASI WISATA

Field:
- Nama destinasi.
- Slug.
- Kategori.
- Deskripsi singkat.
- Deskripsi lengkap.
- Alamat.
- Kabupaten/kota.
- Provinsi.
- Latitude.
- Longitude.
- Harga tiket.
- Jam operasional.
- Fasilitas.
- Foto utama.
- Galeri foto.
- Nomor WhatsApp pengelola.
- Status publikasi.
- Featured status.
- SEO title.
- SEO description.

### B. AKOMODASI

Field:
- Nama akomodasi.
- Slug.
- Jenis akomodasi.
- Deskripsi.
- Alamat.
- Lokasi.
- Harga atau rentang harga.
- Fasilitas.
- Foto.
- Kontak WhatsApp.
- Status publikasi.

### C. FASHION

Field:
- Nama produk.
- Slug.
- Deskripsi.
- Kategori.
- Harga.
- Foto.
- Nama penjual.
- Lokasi.
- WhatsApp penjual.
- Status publikasi.

### D. KENDARAAN

Field:
- Nama layanan.
- Jenis kendaraan.
- Deskripsi.
- Harga sewa.
- Kapasitas.
- Foto.
- Lokasi.
- Kontak WhatsApp.
- Status publikasi.

### E. KULINER

Field:
- Nama usaha.
- Slug.
- Jenis kuliner.
- Deskripsi.
- Alamat.
- Lokasi.
- Menu.
- Harga.
- Jam operasional.
- Foto.
- WhatsApp pengelola.
- Status publikasi.

### F. GUIDE / TOUR GUIDE

Field:
- Nama guide.
- Foto profil.
- Deskripsi.
- Pengalaman.
- Bahasa.
- Keahlian.
- Portofolio.
- Lokasi.
- WhatsApp.
- Status publikasi.

### G. SEMBAKO

Field:
- Nama toko.
- Deskripsi.
- Produk.
- Alamat.
- Foto.
- Kontak WhatsApp.
- Status publikasi.

### H. DOKUMENTASI

Field:
- Judul.
- Deskripsi.
- Jenis dokumentasi.
- Foto atau video.
- Tanggal kegiatan.
- Lokasi.
- Link media sosial.
- Status publikasi.

Semua modul harus menggunakan tenant_id.

---

# 7. CONTENT UPLOADER IDENTITY & ACTIVITY TRACKING

INI MERUPAKAN REQUIREMENT PENTING.

Setiap konten yang dibuat harus menyimpan identitas pengguna yang membuat atau mengunggah konten tersebut.

Saya ingin ketika pengunjung CMS melihat daftar konten, terdapat informasi:

- Nama pengguna yang mengunggah konten.
- Foto profil pengguna jika tersedia.
- Tanggal dan waktu upload.
- Nama pengguna yang terakhir mengedit konten.
- Tanggal dan waktu terakhir diedit.

Contoh tampilan pada data table:

| Konten | Diunggah Oleh | Tanggal Upload | Status |
|---|---|---|---|
| Pantai A | Syahrul Ramadhan | 17 Nov 2026 | Published |
| Pantai B | Ahmad | 17 Nov 2026 | Draft |
| Hotel C | Rahma | 16 Nov 2026 | Published |

Tampilan uploader harus berupa avatar dan nama pengguna.

Pada halaman detail konten, tampilkan informasi:

CONTENT INFORMATION

- Created By: Nama pengguna.
- Created At: Tanggal dan waktu.
- Last Updated By: Nama pengguna.
- Last Updated At: Tanggal dan waktu.
- Published By: Nama pengguna yang mempublikasikan.
- Published At: Tanggal dan waktu publikasi.

### Database Requirements

Setiap tabel konten wajib memiliki:
- created_by.
- created_at.
- updated_by.
- updated_at.
- published_by (nullable).
- published_at (nullable).

Relasikan created_by, updated_by, dan published_by dengan tabel users.

Identitas pengguna harus diambil dari session authentication di server.

JANGAN mengambil created_by atau updated_by dari input form/browser.

Saat user membuat konten, backend otomatis mengambil user_id dari session yang sedang login.

Saat user mengedit konten, updated_by harus diperbarui berdasarkan session user.

Jangan mengubah created_by ketika konten diedit.

Informasi uploader harus tetap tersimpan walaupun user tersebut kemudian dinonaktifkan. Gunakan relasi yang tidak menghilangkan histori kepemilikan konten.

### Activity Log

Selain informasi uploader, implementasikan activity_logs.

Catat aktivitas:
- Login.
- Logout.
- Create content.
- Update content.
- Delete content.
- Publish content.
- Unpublish content.
- Create user.
- Update user.
- Delete user.
- Change role.
- Change permission.
- Change website configuration.

Activity log menyimpan:
- actor_user_id.
- tenant_id.
- action.
- entity_type.
- entity_id.
- description.
- created_at.

Sediakan halaman Activity Logs untuk Admin dan Superadmin sesuai permission.

---

# 8. CONTENT APPROVAL SYSTEM

Sediakan sistem persetujuan konten yang dapat diaktifkan sesuai konfigurasi website.

Workflow:

1. Content Manager membuat konten.
2. Konten disimpan dengan status pending_review jika approval diaktifkan.
3. Admin Website membuka daftar konten yang menunggu persetujuan.
4. Admin dapat melihat detail konten dan informasi pembuatnya.
5. Admin dapat menyetujui atau menolak.
6. Jika disetujui, konten dapat dipublikasikan.
7. Jika ditolak, Admin harus memberikan alasan.
8. Pembuat konten dapat melihat alasan penolakan.

Jika approval tidak diaktifkan, user dengan permission publish dapat langsung mempublikasikan konten.

Catat seluruh aktivitas approval.

---

# 9. SUPERADMIN DASHBOARD

Buat dashboard terpisah untuk Superadmin.

Navigasi:

### Overview
- Total websites.
- Total users.
- Total destinations.
- Total contents.
- Published contents.
- Draft contents.
- Pending review.
- Recent activities.

### Website Management
Superadmin dapat:
- Melihat seluruh website.
- Menambah website.
- Mengedit website.
- Menghapus atau menonaktifkan website.
- Mengatur nama website.
- Mengatur domain.
- Mengatur logo.
- Mengatur favicon.
- Mengatur warna branding.
- Mengatur SEO.
- Mengatur konfigurasi website.

### User Management
- Melihat semua user.
- Filter berdasarkan website.
- Search pengguna.
- Membuat user.
- Mengedit user.
- Menghapus atau menonaktifkan user.
- Mengatur role.
- Mengatur permission.
- Melihat aktivitas user.
- Melihat konten yang diunggah user.

### Feature Management

Superadmin dapat mengelola ketersediaan modul pada setiap website.

Contoh:

| Modul | Website A | Website B | Website C |
|---|---|---|---|
| Destinasi | ON | ON | ON |
| Akomodasi | ON | ON | OFF |
| Fashion | ON | OFF | ON |
| Kendaraan | ON | ON | ON |
| Kuliner | ON | ON | ON |
| Tour Guide | ON | OFF | ON |
| Sembako | OFF | ON | ON |
| Dokumentasi | ON | ON | ON |

Jika suatu modul dinonaktifkan:
- Menu modul tidak ditampilkan pada CMS tenant.
- Akses endpoint modul ditolak.
- Modul tidak ditampilkan pada navigasi website publik jika relevan.
- Data lama tidak dihapus.
- Mengaktifkan kembali modul akan mengembalikan akses terhadap data sebelumnya.

Feature Management harus memiliki backend validation.

Catatan: Fitur ini mengelola modul yang telah diimplementasikan. Jangan mengklaim bahwa Superadmin dapat membuat modul backend baru secara otomatis tanpa pengembangan kode.

### Role & Permission Management
Sediakan pengelolaan role dan permission.

### Global Content Management
Superadmin dapat melihat dan mengelola konten seluruh tenant dengan filter berdasarkan website dan kategori.

### Activity Logs
Tampilkan seluruh aktivitas sistem dengan filter:
- Tenant.
- User.
- Action.
- Entity type.
- Tanggal.

---

# 10. PUBLIC WEBSITE

Buat satu template website pariwisata yang digunakan ketiga tenant.

Desain harus mengikuti DESIGN.md.

Ketiga website dapat memiliki:
- Logo berbeda.
- Nama website berbeda.
- Warna branding yang dapat dikonfigurasi.
- Hero banner berbeda.
- Konten berbeda.
- Informasi kontak berbeda.
- SEO metadata berbeda.

Namun, struktur template dan komponen utamanya tetap sama.

### Homepage

Komponen:
1. Navigation bar.
2. Hero section.
3. Search destinasi.
4. Kategori wisata.
5. Destinasi unggulan.
6. Akomodasi unggulan.
7. Kuliner unggulan.
8. Kendaraan.
9. Tour guide.
10. Dokumentasi.
11. Social media links.
12. Footer.

### Halaman Kategori

Setiap modul memiliki halaman kategori masing-masing.

Contoh:
- /destinasi
- /akomodasi
- /fashion
- /kendaraan
- /kuliner
- /tour-guide
- /sembako
- /dokumentasi

### Halaman Detail

Setiap item memiliki halaman detail dengan:
- Foto utama.
- Galeri.
- Deskripsi.
- Lokasi.
- Informasi tambahan.
- Kontak pengelola.
- Rekomendasi konten terkait.

### WhatsApp Integration

Setiap konten yang memiliki nomor WhatsApp pengelola harus menampilkan tombol:

"Hubungi Pengelola via WhatsApp"

Format URL:

https://wa.me/{phone_number}

Implementasikan normalisasi nomor telepon Indonesia.

Jangan menampilkan tombol WhatsApp jika nomor belum tersedia.

---

# 11. DATABASE DESIGN

Rancang database PostgreSQL menggunakan Prisma ORM.

Minimal tabel:

### Core
- tenants
- tenant_domains
- users
- user_tenants
- roles
- permissions
- user_roles
- role_permissions

### Feature Management
- features
- tenant_features

### Content
- destinations
- accommodations
- fashion
- vehicles
- culinary
- tour_guides
- groceries
- documentations
- media

### System
- website_settings
- activity_logs
- content_approvals
- notifications

Pastikan:
- Semua tabel tenant-specific memiliki tenant_id.
- Foreign keys didefinisikan dengan benar.
- Index dibuat untuk tenant_id dan kolom pencarian yang relevan.
- Slug unik dalam lingkup tenant dan jenis konten.
- Soft delete diterapkan pada entitas yang memerlukan histori.
- Relasi uploader dan editor terdokumentasi.
- Migration dapat dijalankan secara konsisten.

---

# 12. SECURITY REQUIREMENTS

Keamanan merupakan prioritas utama.

Implementasikan:

1. Secure authentication.
2. Password hashing menggunakan algoritma yang sesuai.
3. Session security.
4. CSRF protection sesuai mekanisme authentication.
5. Server-side RBAC.
6. Tenant isolation.
7. Input validation dengan Zod.
8. SQL injection protection melalui ORM.
9. File upload validation.
10. File size limits.
11. MIME type validation.
12. Rate limiting pada endpoint penting.
13. Secure cookie configuration.
14. Audit logging.
15. Protection terhadap privilege escalation.

Jangan mempercayai tenant_id, user_id, role, atau permission yang dikirim dari frontend.

Semua identitas dan otorisasi harus diverifikasi di server.

Pastikan Superadmin memiliki akses global, sedangkan Admin dan Content Manager dibatasi pada tenant yang menjadi keanggotaannya.

---

# 13. MEDIA MANAGEMENT

Implementasikan media management untuk:
- Foto destinasi.
- Foto akomodasi.
- Foto kuliner.
- Foto produk.
- Foto profil.
- Dokumentasi.
- Hero banner.
- Galeri.

Setiap file harus memiliki metadata:
- id.
- tenant_id.
- uploaded_by.
- original_filename.
- storage_key.
- mime_type.
- file_size.
- created_at.

Gunakan uploaded_by untuk menampilkan identitas pengunggah file.

Pisahkan media berdasarkan tenant menggunakan storage prefix.

Contoh:

tenant-a/destinations/image-001.webp
tenant-b/culinary/image-002.webp
tenant-c/documentations/image-003.webp

Jangan menyimpan file binary secara langsung di PostgreSQL.

---

# 14. APPLICATION ROUTING

Buat struktur routing yang terorganisasi.

Contoh:

Public:
- /
- /destinasi
- /destinasi/[slug]
- /akomodasi
- /kuliner
- /kendaraan
- /fashion
- /tour-guide
- /sembako
- /dokumentasi

CMS:
- /dashboard
- /dashboard/destinations
- /dashboard/accommodations
- /dashboard/fashion
- /dashboard/vehicles
- /dashboard/culinary
- /dashboard/tour-guides
- /dashboard/groceries
- /dashboard/documentations
- /dashboard/media
- /dashboard/users
- /dashboard/activity-logs
- /dashboard/settings

Superadmin:
- /superadmin
- /superadmin/websites
- /superadmin/users
- /superadmin/features
- /superadmin/roles
- /superadmin/permissions
- /superadmin/contents
- /superadmin/activity-logs
- /superadmin/settings

Gunakan layout terpisah untuk Public Website, CMS, dan Superadmin.

---

# 15. DEVELOPMENT REQUIREMENTS

Jangan hanya membuat UI mockup atau halaman statis.

Saya menginginkan aplikasi yang benar-benar berfungsi dengan database dan backend.

Prioritaskan:
- Functional CRUD.
- Authentication.
- Tenant resolution.
- Tenant isolation.
- RBAC.
- User management.
- Content management.
- Upload media.
- Uploader attribution.
- Feature management.
- Superadmin dashboard.

Semua tombol dan form harus memiliki fungsi nyata.

Jangan membuat tombol yang hanya terlihat aktif tetapi tidak memiliki implementasi.

Jangan menggunakan data dummy sebagai pengganti operasi database yang seharusnya sudah berfungsi.

Dummy data hanya boleh digunakan untuk seed awal atau development preview.

Tambahkan:
- Loading states.
- Error handling.
- Success notifications.
- Empty states.
- Confirmation dialogs.
- Form validation.
- Responsive design.

---

# 16. TESTING REQUIREMENTS

Buat pengujian untuk:

1. Login dan logout.
2. Authentication.
3. Tenant resolution berdasarkan domain.
4. Isolasi data antar-tenant.
5. Pembatasan 30 user per tenant.
6. RBAC.
7. Superadmin global access.
8. CRUD destinasi.
9. Upload media.
10. Created_by attribution.
11. Updated_by attribution.
12. Content approval.
13. Feature enable/disable.
14. WhatsApp URL generation.
15. Public website content rendering.

Skenario penting:

- User Tenant A tidak boleh mengakses konten Tenant B.
- Admin Tenant A tidak boleh mengelola user Tenant B.
- Superadmin dapat melihat semua tenant.
- Konten yang dibuat user harus menyimpan identitas pembuat yang benar.
- Identitas pembuat tidak boleh berubah ketika konten diedit.
- Ketika modul dinonaktifkan, API tidak boleh tetap menerima operasi yang dilarang.
- User ke-31 pada tenant yang sudah penuh harus ditolak.

---

# 17. IMPLEMENTATION WORKFLOW

Sebelum melakukan coding:

1. Periksa struktur project yang sudah tersedia.
2. Baca DESIGN.md secara keseluruhan.
3. Identifikasi teknologi dan dependency yang sudah digunakan.
4. Jangan menghapus konfigurasi project yang masih diperlukan.
5. Buat implementation plan.
6. Buat rancangan database dan relasi.
7. Buat struktur folder.
8. Implementasikan sistem secara bertahap.

Urutan implementasi:

Phase 1: Project setup, design system, database schema.

Phase 2: Authentication, tenant resolver, RBAC.

Phase 3: Superadmin dashboard dan website management.

Phase 4: User management dan feature management.

Phase 5: CMS modules dan CRUD.

Phase 6: Media management dan uploader attribution.

Phase 7: Content approval dan activity logs.

Phase 8: Public tourism website.

Phase 9: Integrasi domain dan tenant rendering.

Phase 10: Security testing, functional testing, dan deployment preparation.

Setelah setiap fase:
- Periksa error TypeScript.
- Jalankan lint.
- Jalankan build jika memungkinkan.
- Perbaiki error sebelum melanjutkan.
- Pastikan implementasi sebelumnya tidak rusak.

---

# 18. FINAL EXPECTATION

Hasil akhir harus berupa satu aplikasi Tourism CMS yang:

- Menggunakan Next.js fullstack.
- Memiliki satu codebase.
- Memiliki satu database PostgreSQL.
- Mendukung tiga website melalui tiga subdomain.
- Mendukung 30 user per website.
- Memiliki satu Superadmin global.
- Memiliki CMS terpisah berdasarkan tenant.
- Memiliki modul konten pariwisata.
- Memiliki Feature Management.
- Memiliki RBAC.
- Memiliki content approval.
- Memiliki uploader identity.
- Memiliki activity logs.
- Memiliki WhatsApp integration.
- Menggunakan satu template public website.
- Mengikuti DESIGN.md secara konsisten.
- Responsive pada desktop, tablet, dan mobile.
- Memiliki keamanan isolasi data antar-tenant.

**INSTRUKSI TERAKHIR:**

Jangan terburu-buru menghasilkan seluruh halaman sekaligus tanpa arsitektur yang benar.

Utamakan fondasi sistem, database, tenant isolation, authentication, dan authorization terlebih dahulu.

Jika terdapat keputusan teknis yang belum ditentukan, gunakan pendekatan yang paling aman, maintainable, dan sesuai dengan kebutuhan project.

Jangan mengganti Next.js dengan framework backend lain.

Jangan menggunakan n8n.

Jangan membuat tiga aplikasi terpisah.

Bangun satu platform Multi-Tenant Tourism CMS yang benar-benar terintegrasi dan siap dikembangkan lebih lanjut.