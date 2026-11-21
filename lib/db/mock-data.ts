import bcrypt from "bcryptjs";

export interface TenantData {
  id: string;
  name: string;
  slug: string;
  description: string;
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
  domains: { domain: string; isPrimary: boolean }[];
  brandColor: string;
  settings: {
    siteName: string;
    logoUrl?: string;
    faviconUrl?: string;
    heroTitle: string;
    heroSubtitle: string;
    heroBannerUrl: string;
    contactPhone: string;
    contactEmail: string;
    contactAddress: string;
    seoTitle: string;
    seoDescription: string;
    approvalActive: boolean;
  };
  features: Record<string, boolean>;
}

export interface UserData {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  phone: string;
  isSuperadmin: boolean;
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
  tenantMemberships: {
    tenantId: string;
    role: "SUPERADMIN" | "WEBSITE_ADMIN" | "CONTENT_MANAGER";
  }[];
  createdAt: string;
}

// Server-only (login & seeding): never pass this shape to client components.
export interface UserWithPassword extends UserData {
  passwordHash: string;
}

export interface DestinationItem {
  id: string;
  tenantId: string;
  name: string;
  slug: string;
  category: string;
  shortDescription: string;
  description: string;
  address: string;
  city: string;
  province: string;
  latitude?: number;
  longitude?: number;
  ticketPrice: number;
  openingHours: string;
  facilities: string[];
  mainImage: string;
  gallery: string[];
  whatsappNumber: string;
  status: "DRAFT" | "PENDING_REVIEW" | "PUBLISHED" | "ARCHIVED";
  isFeatured: boolean;
  seoTitle?: string;
  seoDescription?: string;
  createdById: string;
  updatedById: string;
  publishedById?: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

export interface AccommodationItem {
  id: string;
  tenantId: string;
  name: string;
  slug: string;
  accommodationType: string;
  description: string;
  address: string;
  location: string;
  priceRange: string;
  facilities: string[];
  images: string[];
  whatsappNumber: string;
  status: "DRAFT" | "PENDING_REVIEW" | "PUBLISHED" | "ARCHIVED";
  isFeatured: boolean;
  createdById: string;
  updatedById: string;
  publishedById?: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

export interface FashionItem {
  id: string;
  tenantId: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  price: number;
  images: string[];
  sellerName: string;
  location: string;
  whatsappNumber: string;
  status: "DRAFT" | "PENDING_REVIEW" | "PUBLISHED" | "ARCHIVED";
  createdById: string;
  updatedById: string;
  publishedById?: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

export interface VehicleItem {
  id: string;
  tenantId: string;
  name?: string;
  serviceName: string;
  vehicleType: string;
  description: string;
  rentalPrice: number;
  capacity: number;
  images: string[];
  location: string;
  whatsappNumber: string;
  status: "DRAFT" | "PENDING_REVIEW" | "PUBLISHED" | "ARCHIVED";
  createdById: string;
  updatedById: string;
  publishedById?: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

export interface CulinaryItem {
  id: string;
  tenantId: string;
  name: string;
  slug: string;
  culinaryType: string;
  description: string;
  address: string;
  location: string;
  menu: string;
  priceRange: string;
  openingHours: string;
  images: string[];
  whatsappNumber: string;
  status: "DRAFT" | "PENDING_REVIEW" | "PUBLISHED" | "ARCHIVED";
  isFeatured: boolean;
  createdById: string;
  updatedById: string;
  publishedById?: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

export interface TourGuideItem {
  id: string;
  tenantId: string;
  name: string;
  profileImage: string;
  description: string;
  experienceYears: number;
  languages: string[];
  expertise: string;
  portfolio: string;
  location: string;
  whatsappNumber: string;
  status: "DRAFT" | "PENDING_REVIEW" | "PUBLISHED" | "ARCHIVED";
  createdById: string;
  updatedById: string;
  publishedById?: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

export interface GroceryItem {
  id: string;
  tenantId: string;
  name?: string;
  storeName: string;
  description: string;
  products: string;
  address: string;
  images: string[];
  whatsappNumber: string;
  status: "DRAFT" | "PENDING_REVIEW" | "PUBLISHED" | "ARCHIVED";
  createdById: string;
  updatedById: string;
  publishedById?: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

export interface DocumentationItem {
  id: string;
  tenantId: string;
  title: string;
  description: string;
  documentationType: string;
  mediaUrl: string;
  gallery: string[];
  eventDate: string;
  location: string;
  socialMediaLink?: string;
  status: "DRAFT" | "PENDING_REVIEW" | "PUBLISHED" | "ARCHIVED";
  createdById: string;
  updatedById: string;
  publishedById?: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

export interface ActivityLogItem {
  id: string;
  tenantId?: string;
  actorUserId: string;
  action: string;
  entityType: string;
  entityId?: string;
  description: string;
  createdAt: string;
}

export interface ContentApprovalItem {
  id: string;
  tenantId: string;
  entityType: string;
  entityId: string;
  title: string;
  requestedById: string;
  reviewedById?: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

// Generate shared default password hash for "password123"
const DEFAULT_PASSWORD_HASH = bcrypt.hashSync("password123", 8);

export const INITIAL_TENANTS: TenantData[] = [
  {
    id: "tenant-a",
    name: "Wisata Bahari Nusantara",
    slug: "wisata-a",
    description: "Pesona Bahari, Kepulauan Eksotis, dan Wisata Bawah Laut Tropis Terpadu",
    status: "ACTIVE",
    brandColor: "#533afd",
    domains: [
      { domain: "wisata-a.localhost:3000", isPrimary: true },
      { domain: "wisata-a.com", isPrimary: false },
    ],
    settings: {
      siteName: "Wisata Bahari Nusantara",
      logoUrl: "/logos/bahari.svg",
      heroTitle: "Jelajahi Surga Lautan & Pesisir Nusantara",
      heroSubtitle: "Temukan keindahan terumbu karang tersembunyi, resor tepi pantai berpasir putih, dan kuliner boga bahari autentik.",
      heroBannerUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1600&auto=format&fit=crop&q=80",
      contactPhone: "081234567890",
      contactEmail: "kontak@wisatabahari.id",
      contactAddress: "Kawasan Marina Wisata Bahari No. 12, Pesisir Selatan",
      seoTitle: "Wisata Bahari Nusantara — Pesona Laut & Pantai Indonesia",
      seoDescription: "Panduan resmi destinasi bahari, menyelam, akomodasi pesisir, dan sewa kapal terpercaya.",
      approvalActive: true,
    },
    features: {
      destinations: true,
      accommodations: true,
      fashion: true,
      vehicles: true,
      culinary: true,
      tour_guides: true,
      groceries: true,
      documentations: true,
    },
  },
  {
    id: "tenant-b",
    name: "Ekowisata Dataran Tinggi",
    slug: "wisata-b",
    description: "Destinasi Hijau Pegunungan, Kebun Kopi Aromatik, dan Petualangan Rimba",
    status: "ACTIVE",
    brandColor: "#059669",
    domains: [
      { domain: "wisata-b.localhost:3000", isPrimary: true },
      { domain: "wisata-b.com", isPrimary: false },
    ],
    settings: {
      siteName: "Ekowisata Dataran Tinggi",
      logoUrl: "/logos/highland.svg",
      heroTitle: "Menembus Kabut di Puncak Keabadian Hijau",
      heroSubtitle: "Kesejukan udara lereng gunung, agrowisata pemetikan buah organik, dan vila kayu yang damai di tengah kebun pinus.",
      heroBannerUrl: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1600&auto=format&fit=crop&q=80",
      contactPhone: "081398765432",
      contactEmail: "halo@ekowisata-highland.id",
      contactAddress: "Jl. Lereng Sejuk Km 14, Kawasan Konservasi Pinus",
      seoTitle: "Ekowisata Dataran Tinggi — Destinasi Alam Pegunungan Asri",
      seoDescription: "Jelajahi rute hiking, glamping eksklusif, dan kopi khas lereng pegunungan.",
      approvalActive: false,
    },
    features: {
      destinations: true,
      accommodations: true,
      fashion: false, // OFF as in table
      vehicles: true,
      culinary: true,
      tour_guides: false, // OFF as in table
      groceries: true,
      documentations: true,
    },
  },
  {
    id: "tenant-c",
    name: "Warisan Budaya & Seni Tradisi",
    slug: "wisata-c",
    description: "Eksplorasi Candi Bersejarah, Keraton Luhur, dan Mahakarya Seniman Nusantara",
    status: "ACTIVE",
    brandColor: "#d97706",
    domains: [
      { domain: "wisata-c.localhost:3000", isPrimary: true },
      { domain: "wisata-c.com", isPrimary: false },
    ],
    settings: {
      siteName: "Warisan Budaya & Tradisi",
      logoUrl: "/logos/heritage.svg",
      heroTitle: "Merajut Jejak Sejarah & Peradaban Luhur",
      heroSubtitle: "Saksikan kemegahan arsitektur purba, pertunjukan gamelan sakral, serta sentra tenun dan keramik tradisional.",
      heroBannerUrl: "https://images.unsplash.com/photo-1548013146-72479768bada?w=1600&auto=format&fit=crop&q=80",
      contactPhone: "081122334455",
      contactEmail: "info@heritage-budaya.id",
      contactAddress: "Kompleks Cagar Budaya Puro No. 7, Pusat Kota Pusaka",
      seoTitle: "Warisan Budaya & Seni Tradisi Nusantara",
      seoDescription: "Pusat informasi cagar budaya, museum bersejarah, sentra seni rupa, dan cenderamata khas.",
      approvalActive: true,
    },
    features: {
      destinations: true,
      accommodations: false, // OFF as in table
      fashion: true,
      vehicles: true,
      culinary: true,
      tour_guides: true,
      groceries: true,
      documentations: true,
    },
  },
];

export const INITIAL_USERS: UserWithPassword[] = [
  {
    id: "user-superadmin",
    name: "Syahrul (Superadmin)",
    email: "superadmin@tourism.id",
    passwordHash: DEFAULT_PASSWORD_HASH,
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    phone: "081211112222",
    isSuperadmin: true,
    status: "ACTIVE",
    tenantMemberships: [],
    createdAt: "2026-11-01T08:00:00Z",
  },
  {
    id: "user-admin-a",
    name: "Syahrul Ramadhan",
    email: "syahrul@wisata-a.com",
    passwordHash: DEFAULT_PASSWORD_HASH,
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    phone: "081234567890",
    isSuperadmin: false,
    status: "ACTIVE",
    tenantMemberships: [{ tenantId: "tenant-a", role: "WEBSITE_ADMIN" }],
    createdAt: "2026-11-02T09:00:00Z",
  },
  {
    id: "user-author-a",
    name: "Ahmad Fadillah",
    email: "ahmad@wisata-a.com",
    passwordHash: DEFAULT_PASSWORD_HASH,
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    phone: "081298765432",
    isSuperadmin: false,
    status: "ACTIVE",
    tenantMemberships: [{ tenantId: "tenant-a", role: "CONTENT_MANAGER" }],
    createdAt: "2026-11-03T10:00:00Z",
  },
  {
    id: "user-admin-b",
    name: "Rahmawati Kusuma",
    email: "rahma@wisata-b.com",
    passwordHash: DEFAULT_PASSWORD_HASH,
    avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
    phone: "081377778888",
    isSuperadmin: false,
    status: "ACTIVE",
    tenantMemberships: [{ tenantId: "tenant-b", role: "WEBSITE_ADMIN" }],
    createdAt: "2026-11-02T09:30:00Z",
  },
  {
    id: "user-author-b",
    name: "Budi Santoso",
    email: "budi@wisata-b.com",
    passwordHash: DEFAULT_PASSWORD_HASH,
    avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80",
    phone: "081355556666",
    isSuperadmin: false,
    status: "ACTIVE",
    tenantMemberships: [{ tenantId: "tenant-b", role: "CONTENT_MANAGER" }],
    createdAt: "2026-11-04T11:00:00Z",
  },
  {
    id: "user-admin-c",
    name: "Siti Nurhaliza",
    email: "siti@wisata-c.com",
    passwordHash: DEFAULT_PASSWORD_HASH,
    avatarUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80",
    phone: "081199990000",
    isSuperadmin: false,
    status: "ACTIVE",
    tenantMemberships: [{ tenantId: "tenant-c", role: "WEBSITE_ADMIN" }],
    createdAt: "2026-11-02T10:00:00Z",
  },
  {
    id: "user-author-c",
    name: "Dimas Wicaksono",
    email: "dimas@wisata-c.com",
    passwordHash: DEFAULT_PASSWORD_HASH,
    avatarUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80",
    phone: "081133334444",
    isSuperadmin: false,
    status: "ACTIVE",
    tenantMemberships: [{ tenantId: "tenant-c", role: "CONTENT_MANAGER" }],
    createdAt: "2026-11-05T12:00:00Z",
  },
];

export const INITIAL_DESTINATIONS: DestinationItem[] = [
  {
    id: "dest-1",
    tenantId: "tenant-a",
    name: "Pantai Pasir Putih Tanjung Karang",
    slug: "pantai-pasir-putih-tanjung-karang",
    category: "Pantai & Pesisir",
    shortDescription: "Garis pantai berpasir halus dengan laguna air jernih cocok untuk renang keluarga.",
    description: "Pantai Tanjung Karang menawarkan hamparan pasir putih bersih membentang sepanjang 2 kilometer. Air lautnya yang tenang diapit oleh tebing kapur menjadikannya lokasi sempurna untuk snorkeling dan menyaksikan matahari terbenam spektakuler.",
    address: "Jl. Bahari Indah No. 45, Desa Tanjung",
    city: "Pesisir Barat",
    province: "Kepulauan Nusantara",
    latitude: -8.452,
    longitude: 115.123,
    ticketPrice: 25000,
    openingHours: "06:00 - 18:30 WIB",
    facilities: ["Area Parkir Luas", "Gazebo Tepi Pantai", "Toilet & Bilas Air Tawar", "Penyewaan Alat Snorkeling", "Pujasera Kuliner Kelapa Muda"],
    mainImage: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1519046904884-53103b34b206?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1473186578172-c141e6798cf4?w=800&auto=format&fit=crop&q=80"
    ],
    whatsappNumber: "081234567890",
    status: "PUBLISHED",
    isFeatured: true,
    createdById: "user-admin-a",
    updatedById: "user-admin-a",
    publishedById: "user-admin-a",
    createdAt: "2026-11-17T08:30:00Z",
    updatedAt: "2026-11-17T08:30:00Z",
    publishedAt: "2026-11-17T08:30:00Z",
  },
  {
    id: "dest-2",
    tenantId: "tenant-a",
    name: "Taman Laut Karang Biru",
    slug: "taman-laut-karang-biru",
    category: "Wisata Bahari & Diving",
    shortDescription: "Surga bawah laut dengan terumbu karang hidup dan habitat penyu hijau ramah.",
    description: "Kawasan konservasi laut dengan visibilitas air hingga 25 meter. Wisatawan dapat menjelajahi taman karang lunak, berenang bersama kura-kura laut, dan menjelajahi spot bangkai kapal kuno yang kini menjadi rumah bagi ribuan ikan tropis warna-warni.",
    address: "Dermaga 3 Kepulauan Biru",
    city: "Kepulauan Bahari",
    province: "Kepulauan Nusantara",
    ticketPrice: 50000,
    openingHours: "08:00 - 16:00 WIB",
    facilities: ["Diving Center Bersertifikat PADI", "Speedboat Antar Jemput", "Kamera Underwater Sewa", "Loker Pribadi"],
    mainImage: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&auto=format&fit=crop&q=80",
    gallery: ["https://images.unsplash.com/photo-1682687220063-4742bd7fd538?w=800&auto=format&fit=crop&q=80"],
    whatsappNumber: "081298765432",
    status: "PUBLISHED",
    isFeatured: true,
    createdById: "user-author-a",
    updatedById: "user-author-a",
    publishedById: "user-admin-a",
    createdAt: "2026-11-16T10:15:00Z",
    updatedAt: "2026-11-16T14:20:00Z",
    publishedAt: "2026-11-16T15:00:00Z",
  },
  {
    id: "dest-3",
    tenantId: "tenant-b",
    name: "Puncak Kebun Teh Halimun",
    slug: "puncak-kebun-teh-halimun",
    category: "Pegunungan & Agrowisata",
    shortDescription: "Panorama permadani hijau kebun teh di ketinggian 1.600 mdpl dengan udara sejuk.",
    description: "Perkebunan teh warisan kolonial yang masih aktif dengan rute tea walk menyegarkan. Pengunjung dapat menikmati sensasi memetik pucuk teh segar di pagi hari serta mencicipi seduhan teh artisan langsung di cafe kaca tepi bukit.",
    address: "Jl. Dataran Tinggi No. 88, Puncak Halimun",
    city: "Puncak Highland",
    province: "Jawa Pegunungan",
    ticketPrice: 20000,
    openingHours: "07:00 - 17:00 WIB",
    facilities: ["Jembatan Kayu Kanopi", "Kafe Teh Artisan", "Spot Foto Matahari Terbit", "Mushola", "Parkir Bus"],
    mainImage: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800&auto=format&fit=crop&q=80",
    gallery: ["https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&auto=format&fit=crop&q=80"],
    whatsappNumber: "081398765432",
    status: "PUBLISHED",
    isFeatured: true,
    createdById: "user-admin-b",
    updatedById: "user-admin-b",
    publishedById: "user-admin-b",
    createdAt: "2026-11-15T09:00:00Z",
    updatedAt: "2026-11-15T09:00:00Z",
    publishedAt: "2026-11-15T09:00:00Z",
  },
  {
    id: "dest-4",
    tenantId: "tenant-c",
    name: "Candi Agung Prambanan Raya",
    slug: "candi-agung-prambanan-raya",
    category: "Cagar Budaya & Sejarah",
    shortDescription: "Kompleks candi megah abad ke-9 bercorak arsitektur klasik relief Ramayana.",
    description: "Situs warisan dunia yang menyimpan keajaiban teknologi dan seni pahat kuno. Di malam bulan purnama, panggung terbuka candi menyajikan sendratari megah dengan tata cahaya artistik yang memukau ribuan penonton dunia.",
    address: "Jl. Raya Sejarah Km 16, Kompleks Candi",
    city: "Kota Pusaka",
    province: "Daerah Tradisi",
    ticketPrice: 50000,
    openingHours: "07:30 - 17:30 WIB",
    facilities: ["Pemandu Sejarah Berlisensi", "Museum Arkeologi", "Panggung Terbuka Ramayana", "Toko Cenderamata Seni", "Akses Kursi Roda"],
    mainImage: "https://images.unsplash.com/photo-1548013146-72479768bada?w=800&auto=format&fit=crop&q=80",
    gallery: ["https://images.unsplash.com/photo-1596402184320-417e7178b2cd?w=800&auto=format&fit=crop&q=80"],
    whatsappNumber: "081122334455",
    status: "PUBLISHED",
    isFeatured: true,
    createdById: "user-admin-c",
    updatedById: "user-admin-c",
    publishedById: "user-admin-c",
    createdAt: "2026-11-14T08:00:00Z",
    updatedAt: "2026-11-14T08:00:00Z",
    publishedAt: "2026-11-14T08:00:00Z",
  },
];

export const INITIAL_ACCOMMODATIONS: AccommodationItem[] = [
  {
    id: "accom-1",
    tenantId: "tenant-a",
    name: "Nusantara Oceanfront Resort & Spa",
    slug: "nusantara-oceanfront-resort-spa",
    accommodationType: "Resor Mewah Bintang 5",
    description: "Vila privat di atas air dengan kolam infinity langsung menghadap matahari terbenam laut lepas.",
    address: "Jl. Pasir Emas No. 1, Teluk Bahari",
    location: "Pesisir Barat",
    priceRange: "Rp 1.500.000 - Rp 3.800.000 / malam",
    facilities: ["Private Beach Access", "Infinity Pool", "Spa & Wellness", "Restoran Seafood Bintang 5", "Wi-Fi Cepat"],
    images: ["https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&auto=format&fit=crop&q=80"],
    whatsappNumber: "081234567890",
    status: "PUBLISHED",
    isFeatured: true,
    createdById: "user-admin-a",
    updatedById: "user-admin-a",
    publishedById: "user-admin-a",
    createdAt: "2026-11-16T12:00:00Z",
    updatedAt: "2026-11-16T12:00:00Z",
    publishedAt: "2026-11-16T12:00:00Z",
  },
  {
    id: "accom-2",
    tenantId: "tenant-b",
    name: "Pine Forest Glamping & Wooden Cabin",
    slug: "pine-forest-glamping-wooden-cabin",
    accommodationType: "Glamping & Kabin Kayu",
    description: "Kabin kayu pinus alami dengan fasilitas api unggun, penghangat ruangan, dan balkon pemandangan lembah.",
    address: "Kawasan Konservasi Hutan No. 22",
    location: "Puncak Halimun",
    priceRange: "Rp 650.000 - Rp 1.400.000 / malam",
    facilities: ["Api Unggun Outdoor", "Breakfast Organik Lokal", "Heater Air Hangat", "Balkon Sunset View"],
    images: ["https://images.unsplash.com/photo-1510312305653-8ed496efae75?w=800&auto=format&fit=crop&q=80"],
    whatsappNumber: "081398765432",
    status: "PUBLISHED",
    isFeatured: true,
    createdById: "user-admin-b",
    updatedById: "user-admin-b",
    publishedById: "user-admin-b",
    createdAt: "2026-11-15T14:00:00Z",
    updatedAt: "2026-11-15T14:00:00Z",
    publishedAt: "2026-11-15T14:00:00Z",
  },
];

export const INITIAL_CULINARIES: CulinaryItem[] = [
  {
    id: "cul-1",
    tenantId: "tenant-a",
    name: "Resto Nelayan Bahari — Ikan Bakar Parape",
    slug: "resto-nelayan-bahari-ikan-bakar-parape",
    culinaryType: "Restoran Boga Bahari / Seafood",
    description: "Sajian ikan kuwe dan kakap merah segar tangkapan hari ini, dibakar dengan bumbu parape rempah khas pesisir.",
    address: "Dermaga Lama No. 8, Tepi Pantai",
    location: "Pesisir Barat",
    menu: "Ikan Bakar Parape, Kepiting Saus Padang, Cumi Goreng Mentega, Sayur Kangkung Belacan",
    priceRange: "Rp 35.000 - Rp 180.000",
    openingHours: "11:00 - 22:00 WIB",
    images: ["https://images.unsplash.com/photo-1559847844-5315695dadae?w=800&auto=format&fit=crop&q=80"],
    whatsappNumber: "081234567890",
    status: "PUBLISHED",
    isFeatured: true,
    createdById: "user-admin-a",
    updatedById: "user-admin-a",
    publishedById: "user-admin-a",
    createdAt: "2026-11-16T15:00:00Z",
    updatedAt: "2026-11-16T15:00:00Z",
    publishedAt: "2026-11-16T15:00:00Z",
  },
  {
    id: "cul-2",
    tenantId: "tenant-b",
    name: "Kedai Kopi Lereng & Jagung Bakar Madu",
    slug: "kedai-kopi-lereng-jagung-bakar-madu",
    culinaryType: "Kafe Kopi Tradisional & Camilan",
    description: "Kopi arabika single origin hasil petik lereng lokal yang diseduh manual bersama kudapan jagung bakar manis.",
    address: "Tepi Jurang Halimun Km 5",
    location: "Puncak Halimun",
    menu: "Manual Brew V60 Arabika, Kopi Tubruk Jahe Merah, Jagung Bakar Keju Madu, Pisang Goreng Wijen",
    priceRange: "Rp 15.000 - Rp 45.000",
    openingHours: "08:00 - 23:00 WIB",
    images: ["https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&auto=format&fit=crop&q=80"],
    whatsappNumber: "081398765432",
    status: "PUBLISHED",
    isFeatured: true,
    createdById: "user-author-b",
    updatedById: "user-author-b",
    publishedById: "user-admin-b",
    createdAt: "2026-11-15T16:00:00Z",
    updatedAt: "2026-11-15T16:00:00Z",
    publishedAt: "2026-11-15T16:00:00Z",
  },
];

export const INITIAL_VEHICLES: VehicleItem[] = [
  {
    id: "veh-1",
    tenantId: "tenant-a",
    name: "Speedboat Island Hopper 200HP",
    serviceName: "Sewa Kapal Cepat Antar Pulau",
    vehicleType: "Speedboat Laut",
    description: "Layanan sewa kapal cepat berkapasitas 12 penumpang untuk jelajah pulau, spot diving, dan mancing laut dalam.",
    rentalPrice: 1500000,
    capacity: 12,
    images: ["https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&auto=format&fit=crop&q=80"],
    location: "Dermaga Marina Wisata",
    whatsappNumber: "081234567890",
    status: "PUBLISHED",
    createdById: "user-admin-a",
    updatedById: "user-admin-a",
    publishedById: "user-admin-a",
    createdAt: "2026-11-16T11:00:00Z",
    updatedAt: "2026-11-16T11:00:00Z",
    publishedAt: "2026-11-16T11:00:00Z",
  },
  {
    id: "veh-2",
    tenantId: "tenant-b",
    name: "Jeep 4x4 Offroad Safari Halimun",
    serviceName: "Sewa Jeep Adventure 4WD",
    vehicleType: "Jeep 4x4 Offroad",
    description: "Armada Jeep 4x4 berpenggerak empat roda lengkap dengan sopir berpengalaman menerjang rute berlumpur dan bebatuan.",
    rentalPrice: 850000,
    capacity: 5,
    images: ["https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&auto=format&fit=crop&q=80"],
    location: "Basecamp Jeep Lereng",
    whatsappNumber: "081398765432",
    status: "PUBLISHED",
    createdById: "user-admin-b",
    updatedById: "user-admin-b",
    publishedById: "user-admin-b",
    createdAt: "2026-11-15T10:00:00Z",
    updatedAt: "2026-11-15T10:00:00Z",
    publishedAt: "2026-11-15T10:00:00Z",
  },
];

export const INITIAL_FASHION: FashionItem[] = [
  {
    id: "fash-1",
    tenantId: "tenant-a",
    name: "Kemeja Pantai Tropis Motif Daun Kelapa",
    slug: "kemeja-pantai-tropis-motif-daun-kelapa",
    description: "Kemeja berbahan serat rayon premium yang sejuk, ringan, dan cepat kering saat dipakai di tepi pantai.",
    category: "Pakaian Pantai",
    price: 135000,
    images: ["https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&auto=format&fit=crop&q=80"],
    sellerName: "Butik Bahari Kreasi",
    location: "Pusat Oleh-Oleh Pesisir",
    whatsappNumber: "081234567890",
    status: "PUBLISHED",
    createdById: "user-author-a",
    updatedById: "user-author-a",
    publishedById: "user-admin-a",
    createdAt: "2026-11-16T13:00:00Z",
    updatedAt: "2026-11-16T13:00:00Z",
    publishedAt: "2026-11-16T13:00:00Z",
  },
  {
    id: "fash-2",
    tenantId: "tenant-c",
    name: "Kain Batik Tulis Motif Parang Kencana",
    slug: "kain-batik-tulis-motif-parang-kencana",
    description: "Kain batik katun mori primissima dibuat secara manual dengan canting lilin malam oleh pembatik keraton.",
    category: "Batik & Tenun Tradisional",
    price: 650000,
    images: ["https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?w=800&auto=format&fit=crop&q=80"],
    sellerName: "Sanggar Batik Pusaka",
    location: "Pusat Kerajinan Candi",
    whatsappNumber: "081122334455",
    status: "PUBLISHED",
    createdById: "user-admin-c",
    updatedById: "user-admin-c",
    publishedById: "user-admin-c",
    createdAt: "2026-11-14T11:00:00Z",
    updatedAt: "2026-11-14T11:00:00Z",
    publishedAt: "2026-11-14T11:00:00Z",
  },
];

export const INITIAL_TOUR_GUIDES: TourGuideItem[] = [
  {
    id: "guide-1",
    tenantId: "tenant-a",
    name: "Kapten Hendra Wijaya",
    profileImage: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&auto=format&fit=crop&q=80",
    description: "Dive master dan pemandu laut berpengalaman lebih dari 10 tahun menjelajahi gugusan pulau tropis.",
    experienceYears: 11,
    languages: ["Bahasa Indonesia", "English", "Mandarin Dasar"],
    expertise: "Scuba Diving PADI, Spot Fotografi Bawah Laut, Navigasi Kapal",
    portfolio: "Telah memandu lebih dari 800 penyelam internasional dan riset konservasi terumbu karang.",
    location: "Kepulauan Bahari",
    whatsappNumber: "081234567890",
    status: "PUBLISHED",
    createdById: "user-admin-a",
    updatedById: "user-admin-a",
    publishedById: "user-admin-a",
    createdAt: "2026-11-16T14:00:00Z",
    updatedAt: "2026-11-16T14:00:00Z",
    publishedAt: "2026-11-16T14:00:00Z",
  },
  {
    id: "guide-2",
    tenantId: "tenant-c",
    name: "Raden Mas Suryo Putro",
    profileImage: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&auto=format&fit=crop&q=80",
    description: "Arkeolog dan pemandu cagar budaya bersertifikasi nasional khusus narasi relief dan filosofi arsitektur candi.",
    experienceYears: 15,
    languages: ["Bahasa Indonesia", "Jawa Krama Inggil", "English", "Deutsch"],
    expertise: "Epigrafi Kuno, Sejarah Mataram Kuno, Mitologi Relief Candi",
    portfolio: "Narasumber dokumenter sejarah internasional dan pembicara simposium cagar budaya.",
    location: "Kompleks Keraton & Candi",
    whatsappNumber: "081122334455",
    status: "PUBLISHED",
    createdById: "user-admin-c",
    updatedById: "user-admin-c",
    publishedById: "user-admin-c",
    createdAt: "2026-11-14T09:00:00Z",
    updatedAt: "2026-11-14T09:00:00Z",
    publishedAt: "2026-11-14T09:00:00Z",
  },
];

export const INITIAL_GROCERIES: GroceryItem[] = [
  {
    id: "groc-1",
    tenantId: "tenant-a",
    name: "Toko Sembako Berkah Nelayan",
    storeName: "Toko Sembako Berkah Nelayan",
    description: "Pusat persediaan bahan pokok segar harian untuk wisatawan kemah dan perahu nelayan lokal.",
    products: "Beras Pandan Wangi, Minyak Goreng, Air Mineral Galon, Es Balok Pengawet Ikan, Bumbu Dapur Pesisir",
    address: "Jl. Pasar Ikan No. 2, Dermaga Utama",
    images: ["https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&auto=format&fit=crop&q=80"],
    whatsappNumber: "081234567890",
    status: "PUBLISHED",
    createdById: "user-admin-a",
    updatedById: "user-admin-a",
    publishedById: "user-admin-a",
    createdAt: "2026-11-16T08:00:00Z",
    updatedAt: "2026-11-16T08:00:00Z",
    publishedAt: "2026-11-16T08:00:00Z",
  },
  {
    id: "groc-2",
    tenantId: "tenant-b",
    name: "Warung Sembako & Sayur Organik Lereng",
    storeName: "Warung Sembako & Sayur Organik Lereng",
    description: "Menyediakan hasil bumi segar langsung dari petani: kentang merah, wortel manis, beras merah, dan madu hutan.",
    products: "Sayuran Segar Petik Pagi, Madu Hutan Asli, Telur Ayam Kampung, Teh Curah Hitam",
    address: "Pertigaan Desa Agrowisata No. 5",
    images: ["https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=800&auto=format&fit=crop&q=80"],
    whatsappNumber: "081398765432",
    status: "PUBLISHED",
    createdById: "user-author-b",
    updatedById: "user-author-b",
    publishedById: "user-admin-b",
    createdAt: "2026-11-15T08:00:00Z",
    updatedAt: "2026-11-15T08:00:00Z",
    publishedAt: "2026-11-15T08:00:00Z",
  },
];

export const INITIAL_DOCUMENTATIONS: DocumentationItem[] = [
  {
    id: "doc-1",
    tenantId: "tenant-a",
    title: "Festival Pesona Bahari Nusantara 2026",
    description: "Dokumentasi parade 100 perahu layar hias nelayan, lomba foto bawah laut, dan pelepasan 500 tukik penyu hijau.",
    documentationType: "Liputan Acara Tahunan",
    mediaUrl: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&auto=format&fit=crop&q=80",
    gallery: ["https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80"],
    eventDate: "2026-11-10T08:00:00Z",
    location: "Pantai Pasir Putih Tanjung Karang",
    socialMediaLink: "https://instagram.com/wisatabahari.official",
    status: "PUBLISHED",
    createdById: "user-author-a",
    updatedById: "user-author-a",
    publishedById: "user-admin-a",
    createdAt: "2026-11-11T10:00:00Z",
    updatedAt: "2026-11-11T10:00:00Z",
    publishedAt: "2026-11-11T10:00:00Z",
  },
  {
    id: "doc-2",
    tenantId: "tenant-c",
    title: "Pentas Akbar Sendratari Mahakarya Ramayana",
    description: "Dokumentasi visual pementasan sendratari kolosal dengan 200 penari di pelataran Candi Prambanan Raya.",
    documentationType: "Dokumentasi Pagelaran Seni",
    mediaUrl: "https://images.unsplash.com/photo-1548013146-72479768bada?w=800&auto=format&fit=crop&q=80",
    gallery: ["https://images.unsplash.com/photo-1596402184320-417e7178b2cd?w=800&auto=format&fit=crop&q=80"],
    eventDate: "2026-11-05T19:30:00Z",
    location: "Panggung Terbuka Candi",
    socialMediaLink: "https://youtube.com/@cagarbudayanusantara",
    status: "PUBLISHED",
    createdById: "user-admin-c",
    updatedById: "user-admin-c",
    publishedById: "user-admin-c",
    createdAt: "2026-11-06T09:00:00Z",
    updatedAt: "2026-11-06T09:00:00Z",
    publishedAt: "2026-11-06T09:00:00Z",
  },
];

export const INITIAL_APPROVALS: ContentApprovalItem[] = [
  {
    id: "appr-1",
    tenantId: "tenant-a",
    entityType: "destinations",
    entityId: "dest-2",
    title: "Taman Laut Karang Biru",
    requestedById: "user-author-a",
    reviewedById: "user-admin-a",
    status: "APPROVED",
    createdAt: "2026-11-16T10:15:00Z",
    updatedAt: "2026-11-16T15:00:00Z",
  },
];

export const INITIAL_ACTIVITY_LOGS: ActivityLogItem[] = [
  {
    id: "act-1",
    tenantId: "tenant-a",
    actorUserId: "user-admin-a",
    action: "PUBLISH_CONTENT",
    entityType: "Destination",
    entityId: "dest-1",
    description: "Mempublikasikan destinasi baru: Pantai Pasir Putih Tanjung Karang",
    createdAt: "2026-11-17T08:30:00Z",
  },
  {
    id: "act-2",
    tenantId: "tenant-a",
    actorUserId: "user-author-a",
    action: "CREATE_CONTENT",
    entityType: "Destination",
    entityId: "dest-2",
    description: "Membuat draft destinasi: Taman Laut Karang Biru",
    createdAt: "2026-11-16T10:15:00Z",
  },
  {
    id: "act-3",
    tenantId: "tenant-a",
    actorUserId: "user-admin-a",
    action: "APPROVE_CONTENT",
    entityType: "Destination",
    entityId: "dest-2",
    description: "Menyetujui permohonan publikasi konten Taman Laut Karang Biru",
    createdAt: "2026-11-16T15:00:00Z",
  },
  {
    id: "act-4",
    tenantId: "tenant-b",
    actorUserId: "user-admin-b",
    action: "UPDATE_WEBSITE_SETTINGS",
    entityType: "WebsiteSetting",
    entityId: "tenant-b",
    description: "Memperbarui konfigurasi banner dan slogan Ekowisata Dataran Tinggi",
    createdAt: "2026-11-15T10:00:00Z",
  },
];
