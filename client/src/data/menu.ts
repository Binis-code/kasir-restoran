export type MenuCategory = "Favorit" | "Sarapan" | "Makanan" | "Minuman" | "Camilan";

export type MenuKind = "Minuman" | "Makanan" | "Camilan";

export type MenuItem = {
  id: string;
  barcode: string;
  name: string;
  description: string;
  price: number; // Rupiah utuh, misalnya 25000
  category: MenuCategory;
  image: string;
  badge?: string;
  kind: MenuKind;
  prepMinutes: number;
};

const unsplash = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=640&q=70`;

export const MENU_CATEGORIES: MenuCategory[] = [
  "Favorit",
  "Sarapan",
  "Makanan",
  "Minuman",
  "Camilan",
];

export const MENU_SEED: MenuItem[] = [
  {
    id: "kopi-susu",
    barcode: "8991002100015",
    name: "Kopi Susu",
    description: "Espresso, susu segar, dan gula aren yang lembut.",
    price: 25000,
    category: "Favorit",
    kind: "Minuman",
    prepMinutes: 2,
    badge: "Paling laris",
    image: unsplash("photo-1461023058943-07fcbe16d735"),
  },
  {
    id: "roti-panggang-isi",
    barcode: "8991002100022",
    name: "Roti Panggang Isi",
    description: "Roti sourdough panggang dengan isian keju dan telur.",
    price: 42000,
    category: "Favorit",
    kind: "Makanan",
    prepMinutes: 8,
    image: unsplash("photo-1484723091739-30a097e8f929"),
  },
  {
    id: "kue-lemon",
    barcode: "8991002100039",
    name: "Kue Lemon",
    description: "Kue lemon lembut dengan taburan gula halus.",
    price: 28000,
    category: "Camilan",
    kind: "Camilan",
    prepMinutes: 3,
    image: unsplash("photo-1578985545062-69928b1d9587"),
  },
  {
    id: "kopi-hitam",
    barcode: "8991002100046",
    name: "Kopi Hitam",
    description: "Seduhan biji arabika pekat tanpa gula.",
    price: 18000,
    category: "Minuman",
    kind: "Minuman",
    prepMinutes: 2,
    image: unsplash("photo-1541167760496-1628856ab772"),
  },
  {
    id: "roti-pagi",
    barcode: "8991002100053",
    name: "Roti Pagi",
    description: "Roti bakar mentega hangat untuk pembuka hari.",
    price: 32000,
    category: "Sarapan",
    kind: "Makanan",
    prepMinutes: 6,
    image: unsplash("photo-1509440159596-0249088772ff"),
  },
  {
    id: "nasi-sayur-panggang",
    barcode: "8991002100060",
    name: "Nasi Sayur Panggang",
    description: "Nasi hangat dengan sayuran panggang dan sambal rumahan.",
    price: 48000,
    category: "Makanan",
    kind: "Makanan",
    prepMinutes: 8,
    badge: "Pilihan dapur",
    image: unsplash("photo-1512058564366-18510be2db19"),
  },
  {
    id: "kopi-jeruk-dingin",
    barcode: "8991002100077",
    name: "Kopi Jeruk Dingin",
    description: "Kopi dingin dengan perasan jeruk yang menyegarkan.",
    price: 30000,
    category: "Minuman",
    kind: "Minuman",
    prepMinutes: 3,
    image: unsplash("photo-1517701550927-30cf4ba1dba5"),
  },
  {
    id: "potongan-kue-beri",
    barcode: "8991002100084",
    name: "Potongan Kue Beri",
    description: "Potongan kue lembut dengan isian buah beri.",
    price: 27000,
    category: "Camilan",
    kind: "Camilan",
    prepMinutes: 3,
    image: unsplash("photo-1464349095431-e9a21285b5f3"),
  },
];

const idrFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export function formatIDR(value: number): string {
  return idrFormatter.format(value);
}
