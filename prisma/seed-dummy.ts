// Large, varied dummy dataset for manual/QA testing, layered on top of prisma/seed.ts.
// Deterministic (seeded PRNG + fixed reference date) with stable "dmy-" ids, so re-running skips existing rows.
// Run: npm run db:seed:dummy            (insert)
//      npm run db:seed:dummy -- --reset (first delete dummy rows and anything authored by dummy users)
import { PrismaClient, type Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import { INITIAL_TENANTS, INITIAL_USERS } from "../lib/db/mock-data";

const prisma = new PrismaClient();

const ITEMS_PER_MODULE = 50; // per tenant, for each of the 8 content modules
const NOW = new Date("2026-11-20T09:00:00Z");
const DUMMY_PASSWORD = "password123";

// -----------------------------------------------------------------------------
// Deterministic randomness
// -----------------------------------------------------------------------------
function createRandom(seed: number) {
  // mulberry32
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const random = createRandom(20261121);
const int = (min: number, max: number) => min + Math.floor(random() * (max - min + 1));
const chance = (probability: number) => random() < probability;
const pickOne = <T>(items: readonly T[]): T => items[Math.floor(random() * items.length)];

function shuffled<T>(items: readonly T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

const pickSome = <T>(items: readonly T[], min: number, max: number) => shuffled(items).slice(0, int(min, max));

function weighted<T>(entries: readonly [T, number][]): T {
  let roll = random();
  for (const [value, weight] of entries) {
    roll -= weight;
    if (roll < 0) return value;
  }
  return entries[entries.length - 1][0];
}

/** `count` distinct "x y" combinations, e.g. prefix + name. */
function uniqueNames(first: readonly string[], second: readonly string[], count: number, join = " ") {
  const all = first.flatMap((a) => second.map((b) => `${a}${join}${b}`));
  if (all.length < count) throw new Error(`Only ${all.length} name combinations for ${count} items`);
  return shuffled(all).slice(0, count);
}

const HOUR = 3_600_000;
const addHours = (date: Date, hours: number) => new Date(date.getTime() + hours * HOUR);
const capAtNow = (date: Date) => (date > NOW ? NOW : date);
const pad = (n: number) => String(n).padStart(2, "0");
const slugify = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
const roundTo = (value: number, step: number) => Math.round(value / step) * step;

const phone = () =>
  `08${pickOne(["11", "12", "13", "21", "22", "52", "53", "57", "58", "77", "78", "81", "95", "96"])}${String(
    int(0, 99_999_999)
  ).padStart(8, "0")}`;

// -----------------------------------------------------------------------------
// Images: only Unsplash photos already used by the app (next.config allows images.unsplash.com)
// -----------------------------------------------------------------------------
const photo = (id: string, width = 800) => `https://images.unsplash.com/${id}?w=${width}&auto=format&fit=crop&q=80`;

const PHOTOS = {
  beach: ["photo-1507525428034-b723cf961d3e", "photo-1519046904884-53103b34b206", "photo-1473186578172-c141e6798cf4"],
  underwater: ["photo-1544551763-46a013bb70d5", "photo-1682687220063-4742bd7fd538"],
  mountain: ["photo-1464822759023-fed622ff2c3b", "photo-1501785888041-af3ef285b470"],
  heritage: ["photo-1548013146-72479768bada", "photo-1596402184320-417e7178b2cd"],
  resort: ["photo-1566073771259-6a8506099945"],
  cabin: ["photo-1510312305653-8ed496efae75"],
  seafood: ["photo-1559847844-5315695dadae"],
  cafe: ["photo-1501339847302-ac426a4a7cbb"],
  boat: ["photo-1544161515-4ab6ce6db874"],
  jeep: ["photo-1533473359331-0135ef1b58bf"],
  shirt: ["photo-1596755094514-f87e34085b2c"],
  batik: ["photo-1607083206869-4c7672e72a8a"],
  grocery: ["photo-1542838132-92c53300491e", "photo-1488459716781-31db52582fe9"],
  people: [
    "photo-1438761681033-6461ffad8d80",
    "photo-1472099645785-5658abf4ff4e",
    "photo-1494790108377-be9c29b29330",
    "photo-1500648767791-00dcc994a43e",
    "photo-1506794778202-cad84cf45f1d",
    "photo-1507003211169-0a1dd7228f2d",
    "photo-1519085360753-af0119f7cbe7",
    "photo-1534528741775-53994a69daeb",
    "photo-1535713875002-d1d0cf377fde",
  ],
};

// -----------------------------------------------------------------------------
// Tenant themes
// -----------------------------------------------------------------------------
interface Theme {
  tenantId: string;
  code: string;
  emailDomain: string;
  social: string;
  extraUsers: { total: number; inactive: number; suspended: number };
  province: string;
  cities: string[];
  streets: string[];
  coords: [number, number];
  destination: {
    prefixes: string[];
    names: string[];
    categories: string[];
    facilities: string[];
    blurbs: string[];
    details: string[];
    photos: string[];
  };
  accommodation: { kinds: [string, string][]; names: string[]; facilities: string[]; photos: string[] };
  culinary: { kinds: [string, string][]; names: string[]; menu: string[]; photos: string[] };
  vehicle: { kinds: [string, string, number, number, number][]; operators: string[]; photos: string[] };
  fashion: {
    products: [string, string, number, number][];
    motifs: string[];
    sellers: string[];
    qualities: string[];
    photos: string[];
  };
  guide: { expertise: string[]; localLanguage: string };
  grocery: { products: string[] };
  documentation: { events: string[]; subjects: string[]; photos: string[] };
}

const THEMES: Theme[] = [
  {
    tenantId: "tenant-a",
    code: "a",
    emailDomain: "wisata-a.com",
    social: "wisatabahari.official",
    extraUsers: { total: 25, inactive: 2, suspended: 1 },
    province: "Kepulauan Nusantara",
    cities: ["Pesisir Barat", "Kepulauan Bahari", "Teluk Mutiara", "Tanjung Harapan", "Labuhan Indah", "Pulau Karang Sari"],
    streets: ["Jl. Pantai Indah", "Jl. Dermaga Baru", "Jl. Nelayan", "Jl. Raya Pesisir", "Jl. Bakau Hijau", "Jl. Camar Laut"],
    coords: [-8.45, 115.12],
    destination: {
      prefixes: ["Pantai", "Pulau", "Teluk", "Taman Laut", "Gili", "Tanjung", "Laguna", "Goa Laut", "Hutan Mangrove", "Bukit Karang"],
      names: ["Pasir Putih", "Batu Hiu", "Karang Indah", "Mutiara", "Bintang Laut", "Lumba-Lumba", "Senja Merah", "Camar", "Nyiur Melambai", "Biru Toska"],
      categories: ["Pantai & Pesisir", "Wisata Bahari & Diving", "Pulau Eksotis", "Wisata Mangrove", "Spot Snorkeling"],
      facilities: ["Area Parkir", "Gazebo", "Toilet & Bilas Air Tawar", "Penyewaan Alat Snorkeling", "Warung Kelapa Muda", "Penjaga Pantai", "Mushola", "Spot Foto", "Dermaga Perahu", "Penyewaan Kano"],
      blurbs: [
        "Garis pantai landai berpasir lembut dengan air jernih yang aman untuk berenang keluarga.",
        "Taman karang dangkal dengan ikan badut dan penyu hijau, cocok untuk snorkeling pemula.",
        "Panorama matahari terbenam dari tebing kapur dengan angin laut yang sejuk.",
        "Laguna tenang berair toska yang dikelilingi hutan bakau dan pasir putih.",
        "Spot menyelam favorit dengan dinding karang dan jarak pandang hingga 20 meter.",
        "Kampung nelayan dengan suasana dermaga tradisional dan kuliner ikan segar.",
      ],
      details: [
        "Pengunjung dapat menyewa perahu nelayan untuk berkeliling ke pulau-pulau kecil di sekitarnya.",
        "Waktu terbaik berkunjung adalah pagi hari saat laut tenang dan air sedang surut.",
        "Kawasan ini dikelola kelompok sadar wisata setempat yang menjaga kebersihan pantai.",
        "Tersedia pemandu lokal yang menjelaskan ekosistem terumbu karang dan konservasi penyu.",
      ],
      photos: [...PHOTOS.beach, ...PHOTOS.underwater],
    },
    accommodation: {
      kinds: [["Resort", "Resor Tepi Pantai"], ["Villa", "Villa Privat"], ["Cottage", "Cottage Pantai"], ["Homestay", "Homestay Nelayan"], ["Hotel", "Hotel Bintang 3"], ["Bungalow", "Bungalow Kayu"]],
      names: ["Samudra", "Pasir Emas", "Ombak Biru", "Karang Sari", "Nyiur Indah", "Mutiara Laut", "Teluk Damai", "Bintang Samudra", "Angin Laut", "Pelangi Pantai"],
      facilities: ["Kolam Renang", "Akses Pantai Pribadi", "Sarapan", "Wi-Fi", "AC", "Parkir", "Restoran", "Spa", "Antar Jemput Dermaga", "Sewa Alat Snorkeling"],
      photos: [...PHOTOS.resort, ...PHOTOS.beach],
    },
    culinary: {
      kinds: [["Resto Seafood", "Restoran Boga Bahari / Seafood"], ["Warung Ikan Bakar", "Warung Makan Tradisional"], ["Kedai Kelapa Muda", "Kedai Minuman Segar"], ["Kafe Pantai", "Kafe & Resto Tepi Pantai"], ["Rumah Makan", "Rumah Makan Keluarga"]],
      names: ["Bu Ijah", "Pak Darto", "Nelayan Jaya", "Dermaga", "Ombak", "Senja", "Karang", "Bahari Rasa", "Lumba-Lumba", "Teluk Indah", "Pesisir"],
      menu: ["Ikan Bakar Rica", "Cumi Goreng Tepung", "Udang Saus Padang", "Kepiting Lada Hitam", "Sup Ikan Kuah Kuning", "Kelapa Muda Utuh", "Es Kelapa Jeruk", "Plecing Kangkung", "Sate Lilit Ikan", "Nasi Jinggo"],
      photos: PHOTOS.seafood,
    },
    vehicle: {
      kinds: [
        ["Speedboat", "Speedboat Laut", 12, 1_200_000, 2_500_000],
        ["Kapal Pinisi", "Kapal Pinisi", 20, 3_500_000, 8_000_000],
        ["Perahu Nelayan", "Perahu Motor Tradisional", 6, 300_000, 650_000],
        ["Jetski", "Jetski", 2, 450_000, 900_000],
        ["Mobil MPV", "Mobil MPV + Sopir", 7, 550_000, 850_000],
        ["Motor Matic", "Sepeda Motor", 2, 75_000, 120_000],
      ],
      operators: ["Bahari Trans", "Samudra Rent", "Dermaga Jaya", "Ombak Wisata", "Nelayan Mandiri", "Pesisir Travel", "Karang Tour", "Teluk Transport", "Lautan Biru", "Camar Rent"],
      photos: PHOTOS.boat,
    },
    fashion: {
      products: [
        ["Kemeja Pantai", "Pakaian Pantai", 95_000, 185_000],
        ["Sarung Pantai", "Kain & Sarung", 65_000, 150_000],
        ["Topi Pandan", "Aksesori", 35_000, 85_000],
        ["Kaos Sablon", "Kaos Oleh-Oleh", 60_000, 120_000],
        ["Tas Anyaman", "Tas & Dompet", 85_000, 250_000],
        ["Gelang Kerang", "Perhiasan Etnik", 25_000, 75_000],
      ],
      motifs: ["Kelapa", "Ombak", "Penyu", "Karang", "Ikan Badut", "Perahu", "Camar", "Mutiara", "Senja", "Lumba-Lumba"],
      sellers: ["Butik Bahari Kreasi", "Toko Oleh-Oleh Pesisir", "Kriya Nelayan", "Galeri Pantai", "Sanggar Anyam Laut"],
      qualities: ["berbahan adem dan cepat kering", "dijahit rapi oleh pengrajin lokal", "cocok untuk oleh-oleh khas pesisir", "tersedia dalam berbagai ukuran"],
      photos: PHOTOS.shirt,
    },
    guide: {
      expertise: ["Scuba Diving & Snorkeling", "Fotografi Bawah Laut", "Island Hopping", "Memancing Laut Dalam", "Konservasi Penyu", "Kayak & Paddle Board"],
      localLanguage: "Bahasa Bali",
    },
    grocery: {
      products: ["Beras", "Minyak Goreng", "Air Mineral Galon", "Es Balok", "Ikan Asin", "Gula Pasir", "Telur", "Bumbu Dapur", "Gas LPG 3 kg", "Mi Instan"],
    },
    documentation: {
      events: ["Festival", "Lomba", "Parade", "Pesta", "Karnaval"],
      subjects: ["Bahari", "Perahu Hias", "Layang-Layang Pantai", "Nelayan", "Pantai Pasir Putih"],
      photos: [...PHOTOS.underwater, ...PHOTOS.beach],
    },
  },
  {
    tenantId: "tenant-b",
    code: "b",
    emailDomain: "wisata-b.com",
    social: "ekowisata.highland",
    extraUsers: { total: 15, inactive: 1, suspended: 0 },
    province: "Jawa Pegunungan",
    cities: ["Puncak Halimun", "Lembah Cibodas", "Dataran Kencana", "Ranu Sejuk", "Bukit Embun", "Sindang Sari"],
    streets: ["Jl. Raya Puncak", "Jl. Kebun Teh", "Jl. Lereng Hijau", "Jl. Pinus Asri", "Jl. Curug Indah", "Jl. Desa Wisata"],
    coords: [-6.75, 106.95],
    destination: {
      prefixes: ["Air Terjun", "Danau", "Bukit", "Kebun Teh", "Curug", "Kawah", "Hutan Pinus", "Telaga", "Puncak", "Desa Wisata"],
      names: ["Halimun", "Cibodas", "Embun Pagi", "Kabut Biru", "Pelangi", "Lembah Hijau", "Kencana", "Sindang Sari", "Watu Gede", "Cemara Sewu"],
      categories: ["Pegunungan & Agrowisata", "Air Terjun & Sungai", "Hutan & Konservasi", "Danau & Telaga", "Desa Wisata"],
      facilities: ["Jalur Trekking", "Area Camping", "Parkir Bus", "Toilet", "Mushola", "Warung Kopi", "Gardu Pandang", "Penyewaan Jaket", "Pemandu Lokal", "Jembatan Kayu"],
      blurbs: [
        "Hamparan kebun teh hijau di ketinggian 1.500 mdpl dengan udara sejuk sepanjang hari.",
        "Air terjun bertingkat di tengah hutan tropis yang dicapai lewat jalur trekking ringan.",
        "Danau vulkanik berkabut tipis dengan dermaga kayu dan perahu dayung untuk disewa.",
        "Hutan pinus rindang yang cocok untuk berkemah, piknik keluarga, dan sesi foto.",
        "Puncak bukit dengan panorama matahari terbit di atas lautan awan.",
        "Desa agrowisata tempat pengunjung bisa memetik stroberi dan sayur organik langsung dari kebun.",
      ],
      details: [
        "Suhu udara berkisar 15–20°C, jadi disarankan membawa jaket dan alas kaki yang nyaman.",
        "Jalan menuju lokasi sudah beraspal dan dapat dilalui kendaraan roda empat hingga area parkir.",
        "Pengelola menyediakan paket tur edukasi lingkungan untuk rombongan sekolah.",
        "Datanglah sebelum pukul 07.00 untuk menikmati kabut pagi yang paling tebal.",
      ],
      photos: PHOTOS.mountain,
    },
    accommodation: {
      kinds: [["Glamping", "Glamping"], ["Kabin", "Kabin Kayu"], ["Villa", "Villa Pegunungan"], ["Homestay", "Homestay Petani"], ["Lodge", "Eco Lodge"], ["Camping Ground", "Area Berkemah"]],
      names: ["Halimun", "Pinus Asri", "Kabut Pagi", "Lembah Hijau", "Embun Sejuk", "Teh Wangi", "Cemara", "Puncak Indah", "Ranu", "Kencana"],
      facilities: ["Api Unggun", "Air Panas", "Sarapan Organik", "Balkon Pemandangan", "Wi-Fi", "Parkir", "Area BBQ", "Penghangat Ruangan", "Jalur Trekking", "Dapur Bersama"],
      photos: [...PHOTOS.cabin, ...PHOTOS.mountain],
    },
    culinary: {
      kinds: [["Kedai Kopi", "Kafe Kopi Tradisional"], ["Warung Sunda", "Warung Makan Sunda"], ["Saung", "Resto Saung Lesehan"], ["Kafe Kebun", "Kafe Kebun & Camilan"], ["Rumah Makan", "Rumah Makan Keluarga"]],
      names: ["Lereng", "Halimun", "Kabut", "Teh Wangi", "Mang Ujang", "Ceu Popon", "Pinus", "Embun", "Sukasari", "Puncak", "Kencana"],
      menu: ["Kopi Arabika Manual Brew", "Kopi Tubruk Jahe", "Nasi Liwet", "Ayam Bakar Madu", "Sayur Asem", "Jagung Bakar Keju", "Pisang Goreng Wijen", "Bandrek Susu", "Gurame Terbang", "Karedok"],
      photos: PHOTOS.cafe,
    },
    vehicle: {
      kinds: [
        ["Jeep 4x4", "Jeep 4x4 Offroad", 5, 650_000, 1_200_000],
        ["Motor Trail", "Motor Trail", 1, 250_000, 450_000],
        ["Mobil Elf", "Minibus Elf", 15, 900_000, 1_400_000],
        ["Sepeda Gunung", "Sepeda Gunung", 1, 75_000, 150_000],
        ["Mobil SUV", "Mobil SUV + Sopir", 7, 700_000, 1_100_000],
        ["ATV", "ATV Adventure", 2, 150_000, 300_000],
      ],
      operators: ["Lereng Adventure", "Halimun Offroad", "Puncak Trans", "Kabut Rental", "Pinus Tour", "Embun Travel", "Highland Jeep", "Kencana Rent", "Sukasari Trans", "Cemara Wisata"],
      photos: PHOTOS.jeep,
    },
    fashion: {
      products: [
        ["Jaket Rajut", "Pakaian Hangat", 150_000, 350_000],
        ["Syal Tenun", "Aksesori", 75_000, 180_000],
        ["Kaos", "Kaos Oleh-Oleh", 60_000, 120_000],
        ["Topi Kupluk", "Aksesori", 40_000, 90_000],
        ["Sweater", "Pakaian Hangat", 175_000, 325_000],
        ["Tote Bag", "Tas & Dompet", 55_000, 110_000],
      ],
      motifs: ["Daun Teh", "Pinus", "Kabut", "Edelweis", "Stroberi", "Gunung", "Biji Kopi", "Curug", "Rusa", "Pakis"],
      sellers: ["Rajut Lereng", "Galeri Highland", "Toko Halimun", "Kriya Pinus", "Sanggar Tenun Puncak"],
      qualities: ["hangat dipakai di udara pegunungan", "dirajut tangan oleh ibu-ibu desa", "berbahan katun tebal yang nyaman", "cocok untuk oleh-oleh khas dataran tinggi"],
      photos: [...PHOTOS.shirt, ...PHOTOS.batik],
    },
    guide: {
      expertise: ["Trekking & Pendakian", "Birdwatching", "Agrowisata Kopi & Teh", "Fotografi Lanskap", "Camping & Survival", "Edukasi Hutan"],
      localLanguage: "Bahasa Sunda",
    },
    grocery: {
      products: ["Sayur Organik", "Beras Merah", "Madu Hutan", "Telur Ayam Kampung", "Teh Curah", "Kopi Bubuk", "Gula Aren", "Kentang", "Gas LPG 3 kg", "Susu Sapi Segar"],
    },
    documentation: {
      events: ["Festival", "Lomba", "Pameran", "Pekan", "Jambore"],
      subjects: ["Panen Teh", "Kopi Lereng", "Lari Lintas Alam", "Agrowisata", "Pecinta Alam"],
      photos: PHOTOS.mountain,
    },
  },
  {
    tenantId: "tenant-c",
    code: "c",
    emailDomain: "wisata-c.com",
    social: "cagarbudayanusantara",
    extraUsers: { total: 10, inactive: 0, suspended: 1 },
    province: "Daerah Tradisi",
    cities: ["Kota Pusaka", "Kotagede", "Prambanan", "Imogiri", "Kalasan", "Sentra Kerajinan"],
    streets: ["Jl. Keraton", "Jl. Pasar Lama", "Jl. Candi Raya", "Jl. Pendopo Agung", "Jl. Kampung Batik", "Jl. Alun-Alun Selatan"],
    coords: [-7.75, 110.49],
    destination: {
      prefixes: ["Candi", "Keraton", "Museum", "Situs", "Benteng", "Kampung Batik", "Pura", "Pendopo", "Taman Sari", "Makam Raja"],
      names: ["Mataram", "Pusaka Agung", "Kencana Wungu", "Sekar Kedhaton", "Wijayakusuma", "Kotagede", "Ratu Kalinyamat", "Sendang Sari", "Banyu Biru", "Sapta Arga"],
      categories: ["Cagar Budaya & Sejarah", "Museum & Galeri", "Wisata Religi", "Kampung Budaya", "Arsitektur Kuno"],
      facilities: ["Pemandu Sejarah", "Museum Mini", "Toko Cenderamata", "Akses Kursi Roda", "Parkir", "Toilet", "Mushola", "Penyewaan Kain Jarik", "Panggung Pertunjukan", "Audio Guide"],
      blurbs: [
        "Kompleks bangunan bersejarah dengan relief kisah klasik yang masih terawat baik.",
        "Museum yang menyimpan koleksi pusaka, naskah kuno, dan busana adat keraton.",
        "Kampung pengrajin tempat pengunjung bisa belajar membatik dan menempa perak.",
        "Situs purbakala abad ke-9 dengan latar perbukitan dan sawah yang asri.",
        "Pendopo tradisional yang rutin menggelar pertunjukan gamelan dan tari klasik.",
        "Taman air peninggalan kerajaan dengan kolam pemandian dan lorong bawah tanah.",
      ],
      details: [
        "Pengunjung diwajibkan berpakaian sopan dan menjaga ketenangan di area utama.",
        "Pemandu berlisensi tersedia dalam Bahasa Indonesia, Inggris, dan Belanda.",
        "Setiap malam purnama diadakan pertunjukan sendratari di pelataran terbuka.",
        "Tiket terusan berlaku untuk museum dan kompleks utama dalam satu hari.",
      ],
      photos: PHOTOS.heritage,
    },
    accommodation: {
      kinds: [["Hotel", "Hotel Heritage"], ["Guest House", "Guest House"], ["Homestay", "Homestay Joglo"], ["Boutique Hotel", "Boutique Hotel"], ["Losmen", "Losmen Tradisional"], ["Villa", "Villa Limasan"]],
      names: ["Ndalem Pusaka", "Omah Kencana", "Griya Sekar", "Joglo Mataram", "Sasana Asri", "Pendopo Agung", "Kampoeng Lawas", "Wisma Kraton", "Dalem Sari", "Puri Wijaya"],
      facilities: ["Sarapan Tradisional", "Wi-Fi", "AC", "Parkir", "Kolam Renang", "Penyewaan Sepeda", "Kelas Membatik", "Pertunjukan Gamelan", "Antar Jemput Stasiun", "Taman"],
      photos: [...PHOTOS.resort, ...PHOTOS.heritage],
    },
    culinary: {
      kinds: [["Gudeg", "Rumah Makan Gudeg"], ["Angkringan", "Angkringan Tradisional"], ["Resto Jawa", "Restoran Masakan Jawa"], ["Kedai Wedang", "Kedai Wedang & Jajanan Pasar"], ["Warung Bakmi", "Warung Bakmi Jawa"]],
      names: ["Yu Djum", "Mbok Sari", "Pakde Harjo", "Ndalem", "Kotagede", "Pusaka", "Mataram", "Kencana", "Sekar Arum", "Simbah", "Dalem"],
      menu: ["Gudeg Krecek", "Nasi Kucing", "Sate Klathak", "Bakmi Godhog", "Wedang Uwuh", "Wedang Ronde", "Mangut Lele", "Brongkos", "Kipo", "Bakpia Hangat"],
      photos: [...PHOTOS.cafe, ...PHOTOS.seafood],
    },
    vehicle: {
      kinds: [
        ["Andong", "Andong Wisata", 4, 100_000, 250_000],
        ["Becak Wisata", "Becak Wisata", 2, 50_000, 120_000],
        ["Mobil Sedan", "Mobil Sedan + Sopir", 4, 450_000, 700_000],
        ["Bus Pariwisata", "Bus Pariwisata", 35, 2_500_000, 4_500_000],
        ["Sepeda Onthel", "Sepeda Onthel", 1, 35_000, 75_000],
        ["Mobil MPV", "Mobil MPV + Sopir", 7, 550_000, 850_000],
      ],
      operators: ["Kraton Trans", "Mataram Tour", "Pusaka Rent", "Kotagede Wisata", "Ndalem Travel", "Sekar Transport", "Prambanan Trip", "Joglo Rent", "Alun-Alun Trans", "Sapta Wisata"],
      photos: PHOTOS.jeep,
    },
    fashion: {
      products: [
        ["Kain Batik Tulis", "Batik & Tenun Tradisional", 350_000, 1_500_000],
        ["Kain Batik Cap", "Batik & Tenun Tradisional", 150_000, 450_000],
        ["Kemeja Batik", "Busana Batik", 175_000, 450_000],
        ["Blangkon", "Aksesori Adat", 75_000, 200_000],
        ["Selendang Tenun", "Batik & Tenun Tradisional", 125_000, 350_000],
        ["Kemeja Lurik", "Busana Tradisional", 150_000, 300_000],
      ],
      motifs: ["Parang", "Kawung", "Truntum", "Sidomukti", "Sekar Jagad", "Ceplok", "Semen Rama", "Sido Luhur", "Grompol", "Wahyu Tumurun"],
      sellers: ["Sanggar Batik Pusaka", "Galeri Kraton", "Batik Ndalem", "Tenun Sekar", "Kriya Kotagede"],
      qualities: ["dibuat dengan canting oleh pembatik senior", "menggunakan pewarna alam", "berbahan katun primissima", "dilengkapi sertifikat keaslian"],
      photos: PHOTOS.batik,
    },
    guide: {
      expertise: ["Sejarah Mataram Kuno", "Arsitektur Candi", "Batik & Kerajinan", "Kuliner Tradisional", "Tari & Gamelan", "Wisata Religi"],
      localLanguage: "Bahasa Jawa",
    },
    grocery: {
      products: ["Beras", "Gula Jawa", "Tempe", "Tahu", "Minyak Goreng", "Bumbu Gudeg", "Telur", "Kerupuk", "Gas LPG 3 kg", "Teh Tubruk"],
    },
    documentation: {
      events: ["Festival", "Pentas", "Kirab", "Pameran", "Pekan"],
      subjects: ["Budaya Mataram", "Sendratari Ramayana", "Pusaka Keraton", "Batik Nusantara", "Gamelan Klasik"],
      photos: PHOTOS.heritage,
    },
  },
];

const FIRST_NAMES = ["Agus", "Budi", "Citra", "Dewi", "Eko", "Fitri", "Gilang", "Hendra", "Indah", "Joko", "Kartika", "Lestari", "Made", "Nyoman", "Oka", "Putri", "Rizky", "Sari", "Taufik", "Wayan", "Yudha", "Rina", "Bayu", "Ayu", "Dimas", "Nurul", "Fajar", "Maya", "Arif", "Wulan"];
const LAST_NAMES = ["Pratama", "Santoso", "Wijaya", "Saputra", "Lestari", "Nugroho", "Hidayat", "Kusuma", "Setiawan", "Permana", "Siregar", "Wibowo", "Rahayu", "Purnomo", "Utami", "Syahputra", "Maharani", "Firmansyah"];
const FOREIGN_LANGUAGES = ["English", "Mandarin", "Jepang", "Belanda", "Jerman", "Prancis", "Korea", "Arab"];
const OPENING_HOURS = ["06:00 - 18:00 WIB", "07:00 - 17:00 WIB", "08:00 - 16:00 WIB", "08:00 - 21:00 WIB", "24 Jam"];
const ROOM_PRICES = ["Rp 250.000 - Rp 450.000 / malam", "Rp 400.000 - Rp 750.000 / malam", "Rp 650.000 - Rp 1.200.000 / malam", "Rp 1.000.000 - Rp 2.500.000 / malam", "Rp 1.500.000 - Rp 3.800.000 / malam"];
const MEAL_PRICES = ["Rp 10.000 - Rp 35.000", "Rp 15.000 - Rp 50.000", "Rp 25.000 - Rp 90.000", "Rp 35.000 - Rp 180.000"];
const MEAL_HOURS = ["07:00 - 21:00 WIB", "10:00 - 22:00 WIB", "16:00 - 24:00 WIB", "06:00 - 15:00 WIB", "11:00 - 23:00 WIB"];
const DOCUMENTATION_TYPES = ["Liputan Acara Tahunan", "Galeri Foto", "Video Dokumenter", "Dokumentasi Pagelaran Seni", "Rilis Media"];
const REJECTION_REASONS = [
  "Foto utama kurang tajam, mohon unggah ulang dengan resolusi lebih tinggi.",
  "Deskripsi terlalu singkat, tambahkan informasi fasilitas dan akses lokasi.",
  "Nomor WhatsApp pengelola belum terverifikasi.",
  "Harga belum sesuai dengan daftar tarif resmi terbaru.",
  "Mohon lengkapi jam operasional dan alamat lengkap.",
];

const MODULES = {
  destinations: { prefix: "dest", label: "destinasi", entity: "Destination" },
  accommodations: { prefix: "accom", label: "akomodasi", entity: "Accommodation" },
  culinary: { prefix: "cul", label: "kuliner", entity: "Culinary" },
  vehicles: { prefix: "veh", label: "layanan kendaraan", entity: "Vehicle" },
  fashion: { prefix: "fash", label: "produk fashion", entity: "Fashion" },
  tour_guides: { prefix: "guide", label: "profil pemandu", entity: "TourGuide" },
  groceries: { prefix: "groc", label: "toko sembako", entity: "Grocery" },
  documentations: { prefix: "doc", label: "dokumentasi", entity: "Documentation" },
} as const;
type ModuleKey = keyof typeof MODULES;

type ContentStatus = "DRAFT" | "PENDING_REVIEW" | "PUBLISHED" | "ARCHIVED";
type Role = "WEBSITE_ADMIN" | "CONTENT_MANAGER";
type Member = { id: string; role: Role };

// Tenants without approval workflow publish directly, so they get no PENDING_REVIEW content.
const STATUS_WITH_APPROVAL: [ContentStatus, number][] = [["PUBLISHED", 0.6], ["DRAFT", 0.15], ["PENDING_REVIEW", 0.15], ["ARCHIVED", 0.1]];
const STATUS_DIRECT: [ContentStatus, number][] = [["PUBLISHED", 0.65], ["DRAFT", 0.25], ["ARCHIVED", 0.1]];

// -----------------------------------------------------------------------------
// Generation
// -----------------------------------------------------------------------------
const rows = {
  users: [] as Prisma.UserCreateManyInput[],
  memberships: [] as { userId: string; tenantId: string; role: Role; createdAt: Date }[],
  destinations: [] as Prisma.DestinationCreateManyInput[],
  accommodations: [] as Prisma.AccommodationCreateManyInput[],
  culinary: [] as Prisma.CulinaryCreateManyInput[],
  vehicles: [] as Prisma.VehicleCreateManyInput[],
  fashion: [] as Prisma.FashionCreateManyInput[],
  tourGuides: [] as Prisma.TourGuideCreateManyInput[],
  groceries: [] as Prisma.GroceryCreateManyInput[],
  documentations: [] as Prisma.DocumentationCreateManyInput[],
  approvals: [] as Prisma.ContentApprovalCreateManyInput[],
  logs: [] as Omit<Prisma.ActivityLogCreateManyInput, "id">[],
};

function generateUsers(theme: Theme, passwordHash: string): Member[] {
  const baseMembers: Member[] = INITIAL_USERS.flatMap((u) =>
    u.tenantMemberships
      .filter((m) => m.tenantId === theme.tenantId)
      .map((m) => ({ id: u.id, role: m.role as Role }))
  );
  const baseAdmin = baseMembers.find((m) => m.role === "WEBSITE_ADMIN")!;
  const { total, inactive, suspended } = theme.extraUsers;
  const names = uniqueNames(FIRST_NAMES, LAST_NAMES, total);
  const active: Member[] = [...baseMembers];

  names.forEach((name, i) => {
    const id = `dmy-user-${theme.code}-${pad(i + 1)}`;
    const role: Role = i === 0 ? "WEBSITE_ADMIN" : "CONTENT_MANAGER";
    const status = i >= total - inactive - suspended ? (i >= total - suspended ? "SUSPENDED" : "INACTIVE") : "ACTIVE";
    const createdAt = new Date(NOW.getTime() - int(30, 200) * 24 * HOUR);
    const email = `${slugify(name).replace("-", ".")}@${theme.emailDomain}`;

    rows.users.push({
      id,
      name,
      email,
      passwordHash,
      avatarUrl: chance(0.7) ? photo(pickOne(PHOTOS.people), 150) : null,
      phone: phone(),
      status,
      createdAt,
    });
    rows.memberships.push({ userId: id, tenantId: theme.tenantId, role, createdAt });
    rows.logs.push({
      tenantId: theme.tenantId,
      actorUserId: baseAdmin.id,
      action: "CREATE_USER",
      entityType: "User",
      entityId: id,
      description: `Menambahkan pengguna baru: ${name} (${email}) dengan peran ${role}`,
      createdAt,
    });
    if (status === "ACTIVE") active.push({ id, role });
  });

  return active;
}

type Attribution = {
  status: ContentStatus;
  createdById: string;
  updatedById: string;
  publishedById: string | null;
  createdAt: Date;
  updatedAt: Date;
  publishedAt: Date | null;
};

function attribution(members: Member[], approvalActive: boolean): Attribution & { creator: Member; admin: Member } {
  const admins = members.filter((m) => m.role === "WEBSITE_ADMIN");
  const creator = pickOne(members);
  const admin = creator.role === "WEBSITE_ADMIN" ? creator : pickOne(admins);
  const status = weighted(approvalActive ? STATUS_WITH_APPROVAL : STATUS_DIRECT);
  const createdAt = new Date(NOW.getTime() - int(3, 180) * 24 * HOUR - int(0, 12) * HOUR);
  const wasPublished = status === "PUBLISHED" || status === "ARCHIVED";
  const publishedAt = wasPublished ? capAtNow(addHours(createdAt, int(1, 72))) : null;
  const updatedAt = capAtNow(addHours(publishedAt ?? createdAt, int(0, 240)));
  const updater = status === "ARCHIVED" || !chance(0.7) ? admin : creator;

  return {
    status,
    createdById: creator.id,
    updatedById: updater.id,
    publishedById: wasPublished ? admin.id : null,
    createdAt,
    updatedAt,
    publishedAt,
    creator,
    admin,
  };
}

/** Audit trail (and approval requests for tenants with the approval workflow) for one content item. */
function recordHistory(
  theme: Theme,
  approvalActive: boolean,
  moduleKey: ModuleKey,
  id: string,
  title: string,
  meta: ReturnType<typeof attribution>
) {
  const { label, entity } = MODULES[moduleKey];
  const tenantId = theme.tenantId;
  const log = (actorUserId: string, action: string, description: string, createdAt: Date, entityType: string = entity) =>
    rows.logs.push({ tenantId, actorUserId, action, entityType, entityId: id, description, createdAt });

  log(meta.creator.id, "CREATE_CONTENT", `Membuat ${label} baru: ${title}`, meta.createdAt);
  if (meta.publishedAt) log(meta.admin.id, "PUBLISH_CONTENT", `Mempublikasikan ${label}: ${title}`, meta.publishedAt);
  if (meta.status === "ARCHIVED") log(meta.admin.id, "ARCHIVE_CONTENT", `Mengarsipkan ${label}: ${title}`, meta.updatedAt);

  if (!approvalActive || meta.creator.role !== "CONTENT_MANAGER") return;

  const requestedAt = addHours(meta.createdAt, 1);
  const approval = (status: "PENDING" | "APPROVED" | "REJECTED", updatedAt: Date, rejectionReason?: string) => {
    rows.approvals.push({
      id: `dmy-appr-${id.slice(4)}`,
      tenantId,
      entityType: moduleKey,
      entityId: id,
      requestedById: meta.creator.id,
      reviewedById: status === "PENDING" ? null : meta.admin.id,
      status,
      rejectionReason: rejectionReason ?? null,
      createdAt: requestedAt,
      updatedAt,
    });
    log(meta.creator.id, "REQUEST_APPROVAL", `Mengajukan persetujuan ${label}: ${title}`, requestedAt, moduleKey);
    if (status === "APPROVED") log(meta.admin.id, "APPROVE_CONTENT", `Menyetujui konten ${title}`, updatedAt, moduleKey);
    if (status === "REJECTED") {
      log(meta.admin.id, "REJECT_CONTENT", `Menolak konten ${title} (Alasan: ${rejectionReason})`, updatedAt, moduleKey);
    }
  };

  if (meta.status === "PENDING_REVIEW") approval("PENDING", requestedAt);
  else if (meta.status === "PUBLISHED" && meta.publishedAt && chance(0.6)) approval("APPROVED", meta.publishedAt);
  else if (meta.status === "DRAFT" && chance(0.4)) approval("REJECTED", meta.updatedAt, pickOne(REJECTION_REASONS));
}

function generateContent(theme: Theme, members: Member[], approvalActive: boolean) {
  const t = theme;
  const city = () => pickOne(t.cities);
  const street = () => `${pickOne(t.streets)} No. ${int(1, 150)}`;
  const images = (pool: string[]) => pickSome(pool, 1, Math.min(3, pool.length)).map((id) => photo(id));
  const audit = (meta: Attribution) => ({
    status: meta.status,
    createdById: meta.createdById,
    updatedById: meta.updatedById,
    publishedById: meta.publishedById,
    createdAt: meta.createdAt,
    updatedAt: meta.updatedAt,
    publishedAt: meta.publishedAt,
  });
  const item = (moduleKey: ModuleKey, i: number, title: string) => {
    const id = `dmy-${MODULES[moduleKey].prefix}-${t.code}-${pad(i + 1)}`;
    const meta = attribution(members, approvalActive);
    recordHistory(t, approvalActive, moduleKey, id, title, meta);
    return { id, tenantId: t.tenantId, ...audit(meta) };
  };

  uniqueNames(t.destination.prefixes, t.destination.names, ITEMS_PER_MODULE).forEach((name, i) => {
    const base = item("destinations", i, name);
    const blurb = pickOne(t.destination.blurbs);
    const [mainImage, ...gallery] = shuffled(t.destination.photos).map((id) => photo(id));
    const hasCoordinates = chance(0.8);
    rows.destinations.push({
      ...base,
      name,
      slug: slugify(name),
      category: pickOne(t.destination.categories),
      shortDescription: blurb,
      description: `${name} — ${blurb} ${pickOne(t.destination.details)}`,
      address: street(),
      city: city(),
      province: t.province,
      latitude: hasCoordinates ? Number((t.coords[0] + (random() - 0.5) * 0.6).toFixed(5)) : null,
      longitude: hasCoordinates ? Number((t.coords[1] + (random() - 0.5) * 0.6).toFixed(5)) : null,
      ticketPrice: pickOne([0, 5_000, 10_000, 15_000, 20_000, 25_000, 35_000, 50_000, 75_000, 100_000]),
      openingHours: pickOne(OPENING_HOURS),
      facilities: pickSome(t.destination.facilities, 3, 6),
      mainImage,
      gallery: gallery.slice(0, int(0, gallery.length)),
      whatsappNumber: phone(),
      isFeatured: base.status === "PUBLISHED" && chance(0.2),
      seoTitle: chance(0.5) ? `${name} — Info Tiket, Jam Buka & Fasilitas` : null,
      seoDescription: chance(0.5) ? blurb : null,
    });
  });

  uniqueNames(
    t.accommodation.kinds.map(([kind]) => kind),
    t.accommodation.names,
    ITEMS_PER_MODULE
  ).forEach((name, i) => {
    const base = item("accommodations", i, name);
    const typeLabel = t.accommodation.kinds.find(([kind]) => name.startsWith(`${kind} `))![1];
    const facilities = pickSome(t.accommodation.facilities, 3, 6);
    const location = city();
    rows.accommodations.push({
      ...base,
      name,
      slug: slugify(name),
      accommodationType: typeLabel,
      description: `${typeLabel} di ${location} dengan fasilitas ${facilities.slice(0, 3).join(", ")}. Cocok untuk keluarga maupun rombongan.`,
      address: street(),
      location,
      priceRange: pickOne(ROOM_PRICES),
      facilities,
      images: images(t.accommodation.photos),
      whatsappNumber: phone(),
      isFeatured: base.status === "PUBLISHED" && chance(0.15),
    });
  });

  uniqueNames(
    t.culinary.kinds.map(([kind]) => kind),
    t.culinary.names,
    ITEMS_PER_MODULE
  ).forEach((name, i) => {
    const base = item("culinary", i, name);
    const typeLabel = t.culinary.kinds.find(([kind]) => name.startsWith(`${kind} `))![1];
    const menu = pickSome(t.culinary.menu, 3, 5);
    const location = city();
    rows.culinary.push({
      ...base,
      name,
      slug: slugify(name),
      culinaryType: typeLabel,
      description: `${typeLabel} di ${location} dengan menu andalan ${menu[0]} dan ${menu[1]}.`,
      address: street(),
      location,
      menu: menu.join(", "),
      priceRange: pickOne(MEAL_PRICES),
      openingHours: pickOne(MEAL_HOURS),
      images: images(t.culinary.photos),
      whatsappNumber: phone(),
      isFeatured: base.status === "PUBLISHED" && chance(0.15),
    });
  });

  uniqueNames(
    t.vehicle.kinds.map(([kind]) => kind),
    t.vehicle.operators,
    ITEMS_PER_MODULE
  ).forEach((combo, i) => {
    const serviceName = `Sewa ${combo}`;
    const base = item("vehicles", i, serviceName);
    const [kind, typeLabel, capacity, minPrice, maxPrice] = t.vehicle.kinds.find(([k]) => combo.startsWith(`${k} `))!;
    const operator = combo.slice(kind.length + 1);
    const location = city();
    rows.vehicles.push({
      ...base,
      serviceName,
      vehicleType: typeLabel,
      description: `${typeLabel} berkapasitas ${capacity} orang dari ${operator}, siap mengantar ke berbagai destinasi di sekitar ${location}.`,
      rentalPrice: roundTo(int(minPrice, maxPrice), 25_000) || minPrice,
      capacity,
      images: images(t.vehicle.photos),
      location,
      whatsappNumber: phone(),
    });
  });

  uniqueNames(
    t.fashion.products.map(([product]) => product),
    t.fashion.motifs,
    ITEMS_PER_MODULE,
    " Motif "
  ).forEach((name, i) => {
    const base = item("fashion", i, name);
    const [product, category, minPrice, maxPrice] = t.fashion.products.find(([p]) => name.startsWith(`${p} `))!;
    const seller = pickOne(t.fashion.sellers);
    rows.fashion.push({
      ...base,
      name,
      slug: slugify(name),
      description: `${product} ${name.slice(product.length + 1).toLowerCase()} dari ${seller}, ${pickOne(t.fashion.qualities)}.`,
      category,
      price: roundTo(int(minPrice, maxPrice), 5_000),
      images: images(t.fashion.photos),
      sellerName: seller,
      location: city(),
      whatsappNumber: phone(),
    });
  });

  uniqueNames(FIRST_NAMES, LAST_NAMES, ITEMS_PER_MODULE).forEach((name, i) => {
    const base = item("tour_guides", i, name);
    const expertise = pickSome(t.guide.expertise, 1, 2);
    const years = int(1, 20);
    rows.tourGuides.push({
      ...base,
      name,
      profileImage: chance(0.8) ? photo(pickOne(PHOTOS.people), 400) : null,
      description: `Pemandu ${expertise[0].toLowerCase()} berpengalaman ${years} tahun di kawasan ${city()}.`,
      experienceYears: years,
      languages: ["Bahasa Indonesia", t.guide.localLanguage, ...pickSome(FOREIGN_LANGUAGES, 0, 2)],
      expertise: expertise.join(", "),
      portfolio: chance(0.8)
        ? `Telah memandu lebih dari ${int(5, 120) * 10} wisatawan domestik dan mancanegara.${chance(0.5) ? " Bersertifikat HPI." : ""}`
        : null,
      location: city(),
      whatsappNumber: phone(),
    });
  });

  uniqueNames(
    ["Toko Sembako", "Warung", "Toko Kelontong", "Minimarket", "Kios Tani"],
    ["Berkah", "Sumber Rejeki", "Barokah", "Makmur Jaya", "Sinar Abadi", "Bu Sri", "Pak Harjo", "Sejahtera", "Rizki", "Amanah", "Maju Bersama"],
    ITEMS_PER_MODULE
  ).forEach((storeName, i) => {
    const base = item("groceries", i, storeName);
    const location = city();
    rows.groceries.push({
      ...base,
      storeName,
      description: `${storeName} di ${location} menyediakan kebutuhan harian wisatawan dan warga sekitar, buka setiap hari.`,
      products: pickSome(t.grocery.products, 4, 7).join(", "),
      address: `${street()}, ${location}`,
      images: images(PHOTOS.grocery),
      whatsappNumber: phone(),
    });
  });

  uniqueNames(
    t.documentation.events.flatMap((event) => t.documentation.subjects.map((subject) => `${event} ${subject}`)),
    ["2024", "2025", "2026"],
    ITEMS_PER_MODULE
  ).forEach((title, i) => {
    const base = item("documentations", i, title);
    const year = Number(title.slice(-4));
    const eventDate = capAtNow(new Date(Date.UTC(year, int(0, 11), int(1, 28), int(1, 12))));
    const location = city();
    const [mediaId, ...galleryIds] = shuffled(t.documentation.photos);
    rows.documentations.push({
      ...base,
      title,
      description: `Dokumentasi ${title} yang berlangsung di ${location}, dihadiri warga dan wisatawan dari berbagai daerah.`,
      documentationType: pickOne(DOCUMENTATION_TYPES),
      mediaUrl: photo(mediaId),
      gallery: galleryIds.map((id) => photo(id)),
      eventDate,
      location,
      socialMediaLink: chance(0.7)
        ? pickOne([`https://instagram.com/${t.social}`, `https://youtube.com/@${t.social}`, `https://tiktok.com/@${t.social}`])
        : null,
    });
  });
}

// -----------------------------------------------------------------------------
// Insert
// -----------------------------------------------------------------------------
async function resetDummyData() {
  const dummy = { startsWith: "dmy-" };
  // Rows the app wrote on behalf of dummy users reference them too, so they go as well.
  const content = { OR: [{ id: dummy }, { createdById: dummy }, { updatedById: dummy }] };
  const deleted = {
    activityLogs: (await prisma.activityLog.deleteMany({ where: { OR: [{ id: dummy }, { actorUserId: dummy }] } })).count,
    approvals: (
      await prisma.contentApproval.deleteMany({
        where: { OR: [{ id: dummy }, { requestedById: dummy }, { entityId: dummy }] },
      })
    ).count,
    destinations: (await prisma.destination.deleteMany({ where: content })).count,
    accommodations: (await prisma.accommodation.deleteMany({ where: content })).count,
    culinary: (await prisma.culinary.deleteMany({ where: content })).count,
    vehicles: (await prisma.vehicle.deleteMany({ where: content })).count,
    fashion: (await prisma.fashion.deleteMany({ where: content })).count,
    tourGuides: (await prisma.tourGuide.deleteMany({ where: content })).count,
    groceries: (await prisma.grocery.deleteMany({ where: content })).count,
    documentations: (await prisma.documentation.deleteMany({ where: content })).count,
    media: (await prisma.media.deleteMany({ where: { uploadedById: dummy } })).count,
    users: (await prisma.user.deleteMany({ where: { id: dummy } })).count,
  };
  console.log("Data dummy lama dihapus:");
  console.table(deleted);
}

async function main() {
  const tenantIds = THEMES.map((t) => t.tenantId);
  const [tenantCount, roles, baseUserCount] = await Promise.all([
    prisma.tenant.count({ where: { id: { in: tenantIds } } }),
    prisma.role.findMany({ select: { id: true, name: true } }),
    prisma.user.count({ where: { id: { in: INITIAL_USERS.map((u) => u.id) } } }),
  ]);
  if (tenantCount !== tenantIds.length || baseUserCount !== INITIAL_USERS.length || roles.length === 0) {
    console.error("Data dasar belum ada. Jalankan `npx prisma db seed` terlebih dahulu.");
    process.exitCode = 1;
    return;
  }
  const roleIds = new Map(roles.map((r) => [r.name, r.id]));

  if (process.argv.includes("--reset")) await resetDummyData();

  const passwordHash = bcrypt.hashSync(DUMMY_PASSWORD, 10);
  for (const theme of THEMES) {
    const approvalActive = INITIAL_TENANTS.find((t) => t.id === theme.tenantId)!.settings.approvalActive;
    const members = generateUsers(theme, passwordHash);
    generateContent(theme, members, approvalActive);
  }

  // Logs get ids in chronological order so re-runs reproduce the same ids.
  const logs = rows.logs
    .map((log, i) => ({ log, i }))
    .sort((a, b) => (a.log.createdAt as Date).getTime() - (b.log.createdAt as Date).getTime() || a.i - b.i)
    .map(({ log }, i) => ({ ...log, id: `dmy-log-${String(i + 1).padStart(5, "0")}` }));

  const skip = { skipDuplicates: true } as const;
  const inserted = {
    users: (await prisma.user.createMany({ data: rows.users, ...skip })).count,
    memberships: (
      await prisma.userTenant.createMany({
        data: rows.memberships.map(({ role, ...m }) => ({ ...m, roleId: roleIds.get(role)! })),
        ...skip,
      })
    ).count,
    destinations: (await prisma.destination.createMany({ data: rows.destinations, ...skip })).count,
    accommodations: (await prisma.accommodation.createMany({ data: rows.accommodations, ...skip })).count,
    culinary: (await prisma.culinary.createMany({ data: rows.culinary, ...skip })).count,
    vehicles: (await prisma.vehicle.createMany({ data: rows.vehicles, ...skip })).count,
    fashion: (await prisma.fashion.createMany({ data: rows.fashion, ...skip })).count,
    tourGuides: (await prisma.tourGuide.createMany({ data: rows.tourGuides, ...skip })).count,
    groceries: (await prisma.grocery.createMany({ data: rows.groceries, ...skip })).count,
    documentations: (await prisma.documentation.createMany({ data: rows.documentations, ...skip })).count,
    approvals: (await prisma.contentApproval.createMany({ data: rows.approvals, ...skip })).count,
    activityLogs: (await prisma.activityLog.createMany({ data: logs, ...skip })).count,
  };

  console.log(`Data dummy dibuat (baris baru; yang sudah ada dilewati). Password semua user dummy: ${DUMMY_PASSWORD}`);
  console.table(
    Object.entries(inserted).map(([table, count]) => ({
      table,
      inserted: count,
      generated: table === "activityLogs" ? logs.length : rows[table as keyof typeof rows].length,
    }))
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
