import { useState, useRef, useEffect, useMemo } from "react";
import {
  Upload,
  Search,
  ExternalLink,
  Sparkles,
  Check,
  Image as ImageIcon,
  Link2,
  RefreshCw,
  FolderOpen,
  Camera,
} from "lucide-react";
import { cn } from "../lib/cn";
import { toast } from "sonner";

export interface CulinaryImageItem {
  id: string;
  title: string;
  category: "Kopi & Teh" | "Minuman Dingin" | "Nasi & Lauk" | "Mie & Pasta" | "Roti & Burger" | "Camilan" | "Kue & Dessert";
  url: string;
  keywords: string[];
}

export const CULINARY_GALLERY: CulinaryImageItem[] = [
  // Kopi & Teh
  {
    id: "kopi-susu",
    title: "Kopi Susu Aren",
    category: "Kopi & Teh",
    url: "https://images.unsplash.com/photo-1541167760496-1628856ab772?w=600&auto=format&fit=crop&q=75",
    keywords: ["kopi", "susu", "aren", "coffee", "latte", "espresso"],
  },
  {
    id: "cappuccino",
    title: "Cappuccino / Latte Art",
    category: "Kopi & Teh",
    url: "https://images.unsplash.com/photo-1534778101976-62847782c213?w=600&auto=format&fit=crop&q=75",
    keywords: ["cappuccino", "latte", "art", "kopi", "panas", "coffee"],
  },
  {
    id: "kopi-hitam",
    title: "Kopi Hitam / Americano",
    category: "Kopi & Teh",
    url: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=75",
    keywords: ["kopi", "hitam", "americano", "tubruk", "espresso", "black coffee"],
  },
  {
    id: "teh-hangat",
    title: "Teh Melati / Artisan Tea",
    category: "Kopi & Teh",
    url: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&auto=format&fit=crop&q=75",
    keywords: ["teh", "tea", "hangat", "melati", "jasmine", "herbal"],
  },

  // Minuman Dingin & Segar
  {
    id: "es-teh-manis",
    title: "Es Teh Manis Segar",
    category: "Minuman Dingin",
    url: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=600&auto=format&fit=crop&q=75",
    keywords: ["es", "teh", "manis", "lemon", "iced tea", "segar"],
  },
  {
    id: "es-jeruk",
    title: "Es Jeruk Peras",
    category: "Minuman Dingin",
    url: "https://images.unsplash.com/photo-1613478223719-2ab802602423?w=600&auto=format&fit=crop&q=75",
    keywords: ["es", "jeruk", "orange", "juice", "jus", "segar", "citrus"],
  },
  {
    id: "jus-alpukat",
    title: "Jus Buah Segar",
    category: "Minuman Dingin",
    url: "https://images.unsplash.com/photo-1622597467836-f3285f2131b8?w=600&auto=format&fit=crop&q=75",
    keywords: ["jus", "alpukat", "mangga", "juice", "smoothie", "buah"],
  },
  {
    id: "mocktail-soda",
    title: "Mocktail Soda Buah",
    category: "Minuman Dingin",
    url: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600&auto=format&fit=crop&q=75",
    keywords: ["mocktail", "soda", "mojito", "minuman", "dingin", "sparkling"],
  },
  {
    id: "boba-milk-tea",
    title: "Boba Brown Sugar Milk",
    category: "Minuman Dingin",
    url: "https://images.unsplash.com/photo-1558857563-b37cf05d8a58?w=600&auto=format&fit=crop&q=75",
    keywords: ["boba", "milk tea", "bubble", "brown sugar", "susu"],
  },
  {
    id: "matcha-latte",
    title: "Iced Matcha Latte",
    category: "Minuman Dingin",
    url: "https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=600&auto=format&fit=crop&q=75",
    keywords: ["matcha", "green tea", "latte", "susu", "jepang"],
  },

  // Nasi & Lauk Utama
  {
    id: "nasi-goreng",
    title: "Nasi Goreng Spesial Telur",
    category: "Nasi & Lauk",
    url: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=600&auto=format&fit=crop&q=75",
    keywords: ["nasi", "goreng", "fried rice", "telur", "spesial", "makanan"],
  },
  {
    id: "ayam-goreng",
    title: "Ayam Goreng Lengkuas",
    category: "Nasi & Lauk",
    url: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=600&auto=format&fit=crop&q=75",
    keywords: ["ayam", "goreng", "fried chicken", "lengkuas", "crispy", "lauk"],
  },
  {
    id: "ayam-bakar",
    title: "Ayam Bakar Madu / Taliwang",
    category: "Nasi & Lauk",
    url: "https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=600&auto=format&fit=crop&q=75",
    keywords: ["ayam", "bakar", "grilled chicken", "madu", "pedas"],
  },
  {
    id: "sate-ayam",
    title: "Sate Ayam Bumbu Kacang",
    category: "Nasi & Lauk",
    url: "https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=600&auto=format&fit=crop&q=75",
    keywords: ["sate", "satay", "ayam", "kacang", "bakar", "daging"],
  },
  {
    id: "rendang-sapi",
    title: "Rendang Sapi Minang",
    category: "Nasi & Lauk",
    url: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=75",
    keywords: ["rendang", "sapi", "padang", "daging", "beef", "gulai"],
  },
  {
    id: "rice-bowl",
    title: "Rice Bowl Daging Teriyaki",
    category: "Nasi & Lauk",
    url: "https://images.unsplash.com/photo-1543339308-43e59d6b73a6?w=600&auto=format&fit=crop&q=75",
    keywords: ["rice bowl", "nasi", "daging", "teriyaki", "sambal", "bowl"],
  },

  // Mie & Pasta
  {
    id: "mie-goreng",
    title: "Mie Goreng Jawa / Seafood",
    category: "Mie & Pasta",
    url: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600&auto=format&fit=crop&q=75",
    keywords: ["mie", "goreng", "noodle", "fried noodles", "bakmi", "kwetiau"],
  },
  {
    id: "mie-ayam-bakso",
    title: "Mie Ayam & Bakso Kuah",
    category: "Mie & Pasta",
    url: "https://images.unsplash.com/photo-1612927601601-6638404737ce?w=600&auto=format&fit=crop&q=75",
    keywords: ["mie", "ayam", "bakso", "kuah", "noodle soup", "pangsit"],
  },
  {
    id: "spaghetti",
    title: "Spaghetti Bolognese / Carbonara",
    category: "Mie & Pasta",
    url: "https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=600&auto=format&fit=crop&q=75",
    keywords: ["pasta", "spaghetti", "carbonara", "bolognese", "italia"],
  },
  {
    id: "ramen",
    title: "Ramen Kuah Gurih",
    category: "Mie & Pasta",
    url: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600&auto=format&fit=crop&q=75",
    keywords: ["ramen", "mie", "jepang", "kuah", "pedas"],
  },

  // Roti & Burger
  {
    id: "roti-bakar",
    title: "Roti Panggang / Toast Keju",
    category: "Roti & Burger",
    url: "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=600&auto=format&fit=crop&q=75",
    keywords: ["roti", "toast", "panggang", "bakar", "sandwich", "sarapan"],
  },
  {
    id: "burger",
    title: "Beef Burger & Keju",
    category: "Roti & Burger",
    url: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=75",
    keywords: ["burger", "beef", "daging", "keju", "cheese", "fast food"],
  },
  {
    id: "sandwich",
    title: "Club Sandwich Segar",
    category: "Roti & Burger",
    url: "https://images.unsplash.com/photo-1509722747041-616f39b57569?w=600&auto=format&fit=crop&q=75",
    keywords: ["sandwich", "roti", "telur", "tuna", "sarapan"],
  },
  {
    id: "croissant",
    title: "Croissant Mentega",
    category: "Roti & Burger",
    url: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=600&auto=format&fit=crop&q=75",
    keywords: ["croissant", "pastry", "roti", "bakery", "mentega"],
  },

  // Camilan & Gorengan
  {
    id: "kentang-goreng",
    title: "Kentang Goreng / French Fries",
    category: "Camilan",
    url: "https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?w=600&auto=format&fit=crop&q=75",
    keywords: ["kentang", "fries", "french fries", "camilan", "snack", "goreng"],
  },
  {
    id: "dimsum",
    title: "Dimsum Siomay Kukus",
    category: "Camilan",
    url: "https://images.unsplash.com/photo-1541696432-82c6da8ce7bf?w=600&auto=format&fit=crop&q=75",
    keywords: ["dimsum", "siomay", "kukus", "camilan", "dumpling"],
  },
  {
    id: "pisang-goreng",
    title: "Pisang Goreng Keju Cokelat",
    category: "Camilan",
    url: "https://images.unsplash.com/photo-1596797038530-2c107229654b?w=600&auto=format&fit=crop&q=75",
    keywords: ["pisang", "goreng", "keju", "cokelat", "snack", "manis"],
  },
  {
    id: "tahu-crispy",
    title: "Tahu Crispy / Tempe Mendoan",
    category: "Camilan",
    url: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=75",
    keywords: ["tahu", "tempe", "gorengan", "crispy", "camilan"],
  },

  // Kue & Dessert
  {
    id: "kue-cokelat",
    title: "Kue Cokelat Fudge Cake",
    category: "Kue & Dessert",
    url: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&auto=format&fit=crop&q=75",
    keywords: ["cake", "kue", "cokelat", "chocolate", "dessert", "manis"],
  },
  {
    id: "cheesecake",
    title: "Strawberry Cheesecake",
    category: "Kue & Dessert",
    url: "https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=600&auto=format&fit=crop&q=75",
    keywords: ["cheesecake", "keju", "strawberry", "kue", "dessert"],
  },
  {
    id: "waffle-ice-cream",
    title: "Waffle & Es Krim Vanilla",
    category: "Kue & Dessert",
    url: "https://images.unsplash.com/photo-1562376552-0d160a2f238d?w=600&auto=format&fit=crop&q=75",
    keywords: ["waffle", "es krim", "ice cream", "dessert", "manis"],
  },
  {
    id: "donat",
    title: "Donat Aneka Topping",
    category: "Kue & Dessert",
    url: "https://images.unsplash.com/photo-1527515862127-a4fc05baf7a5?w=600&auto=format&fit=crop&q=75",
    keywords: ["donat", "doughnut", "manis", "glaze", "snack"],
  },
];

/**
 * Mengompres file gambar dari komputer/HP secara lokal di browser via HTML5 Canvas
 * Menghasilkan Data URL JPEG yang ringan (~40-80KB) sehingga aman untuk IndexedDB offline
 */
async function compressImageFile(file: File, maxDim = 640, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        let { width, height } = img;
        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(reader.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL("image/jpeg", quality);
        resolve(dataUrl);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

interface ProductImagePickerProps {
  value: string;
  onChange: (url: string) => void;
  productName?: string;
  categoryName?: string;
}

export function ProductImagePicker({
  value,
  onChange,
  productName = "",
}: ProductImagePickerProps) {
  const [tab, setTab] = useState<"upload" | "search" | "gallery" | "url">("upload");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGalleryCategory, setSelectedGalleryCategory] = useState<string>("Semua");
  const [customUrlInput, setCustomUrlInput] = useState(value || "");
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-sync search query when user types product name
  useEffect(() => {
    if (productName && !searchQuery) {
      setSearchQuery(productName);
    }
  }, [productName]);

  // Sync custom URL input when value changes externally
  useEffect(() => {
    setCustomUrlInput(value);
  }, [value]);

  // Filter gallery items based on query and category
  const filteredGallery = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return CULINARY_GALLERY.filter((item) => {
      const matchCat = selectedGalleryCategory === "Semua" || item.category === selectedGalleryCategory;
      if (!matchCat) return false;
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.keywords.some((k) => k.toLowerCase().includes(q))
      );
    });
  }, [searchQuery, selectedGalleryCategory]);

  // Handle local file selection
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processFile(file);
  };

  const processFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Format file tidak didukung. Harap pilih gambar (JPG, PNG, WebP).");
      return;
    }

    try {
      setIsProcessingFile(true);
      toast.info("Mengompresi dan menyiapkan gambar lokal...");
      const compressedDataUrl = await compressImageFile(file, 640, 0.82);
      onChange(compressedDataUrl);
      toast.success("Foto lokal berhasil diunggah dan disimpan!");
    } catch (err) {
      toast.error("Gagal memproses file gambar");
    } finally {
      setIsProcessingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Drag & Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      await processFile(file);
    }
  };

  // Google Images Search Link Generator
  const googleSearchQuery = searchQuery.trim() || productName.trim() || "menu kuliner makanan minuman";
  const googleImagesUrl = `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(googleSearchQuery + " food culinary hd")}`;

  const isLocalImage = value?.startsWith("data:image");

  return (
    <div className="space-y-3 rounded-xl border border-ink/12 bg-mineral/20 p-3.5">
      {/* Header & Live Preview */}
      <div className="flex items-center gap-3">
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-ink/15 bg-white shadow-xs">
          {value ? (
            <img
              src={value}
              alt="Preview produk"
              className="h-full w-full object-cover"
              onError={(e) => {
                // Fallback image
                (e.target as HTMLImageElement).src = CULINARY_GALLERY[0].url;
              }}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-mineral text-ink/30">
              <ImageIcon size={24} />
            </div>
          )}
          {isLocalImage && (
            <span className="absolute bottom-1 right-1 rounded bg-ink/80 px-1 py-0.5 text-[8px] font-bold text-counterlime">
              Lokal
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-wider text-ink/70">
            Foto Produk Terpilih
          </p>
          <p className="truncate text-[11px] font-medium text-ink/50 mt-0.5">
            {isLocalImage
              ? "📁 Foto dari perangkat lokal (Offline Ready)"
              : value
              ? "🌐 Tautan Gambar Web / Unsplash"
              : "Belum ada gambar terpilih"}
          </p>
          <div className="mt-1 flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1 rounded-lg border border-ink/15 bg-white px-2 py-0.5 text-[11px] font-bold text-ink hover:border-ink/40 shadow-2xs transition-colors"
            >
              <Upload size={11} />
              Ganti Foto
            </button>
            <button
              type="button"
              onClick={() => {
                setTab("search");
                if (productName && !searchQuery) setSearchQuery(productName);
              }}
              className="inline-flex items-center gap-1 rounded-lg border border-counterlime-dark/30 bg-counterlime/30 px-2 py-0.5 text-[11px] font-bold text-ink hover:bg-counterlime/50 transition-colors"
            >
              <Search size={11} />
              Cari Online
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-4 gap-1 rounded-lg bg-mineral/70 p-1">
        <TabButton
          active={tab === "upload"}
          icon={<Upload size={12} />}
          label="Upload File"
          onClick={() => setTab("upload")}
        />
        <TabButton
          active={tab === "search"}
          icon={<Search size={12} />}
          label="Cari Gambar"
          onClick={() => setTab("search")}
        />
        <TabButton
          active={tab === "gallery"}
          icon={<Sparkles size={12} />}
          label="Galeri Menu"
          onClick={() => setTab("gallery")}
        />
        <TabButton
          active={tab === "url"}
          icon={<Link2 size={12} />}
          label="Link / URL"
          onClick={() => setTab("url")}
        />
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png, image/jpeg, image/jpg, image/webp"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* TAB 1: UPLOAD LOCAL FILE & DRAG DROP */}
      {tab === "upload" && (
        <div className="space-y-2">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-4 text-center cursor-pointer transition-all",
              isDragging
                ? "border-counterlime bg-counterlime/20 scale-[1.01]"
                : "border-ink/20 bg-white hover:border-ink/40 hover:bg-mineral/20",
            )}
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-mineral text-ink/70 mb-1.5">
              <FolderOpen size={18} />
            </div>
            <p className="font-display text-xs font-bold text-ink">
              {isProcessingFile
                ? "Sedang mengompres gambar..."
                : "Pilih file dari HP / Komputer atau Seret ke Sini"}
            </p>
            <p className="mt-0.5 text-[10px] text-ink/50">
              Mendukung JPG, PNG, WebP (Otomatis dikompres &lt; 100KB untuk mode offline)
            </p>
            <div className="mt-2.5 flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-lg bg-ink px-2.5 py-1 text-[11px] font-bold text-white shadow-2xs">
                <Camera size={12} />
                Buka File / Kamera
              </span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SEARCH WEB & GOOGLE IMAGES ASSISTANT */}
      {tab === "search" && (
        <div className="space-y-2.5">
          <div className="flex gap-1.5">
            <div className="relative flex-1">
              <Search
                size={13}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink/40"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari foto menu (misal: Nasi Goreng, Ayam Bakar)..."
                className="h-8.5 w-full rounded-lg border border-ink/15 bg-white pl-8 pr-3 text-xs text-ink placeholder:text-ink/40 focus:border-ink/40 focus:outline-none focus:ring-1 focus:ring-counterlime"
                onKeyDown={(e) => {
                  if (e.key === "Enter") e.preventDefault();
                }}
              />
            </div>
            <button
              type="button"
              onClick={() => {
                if (productName) setSearchQuery(productName);
              }}
              title="Gunakan nama produk saat ini"
              className="inline-flex items-center gap-1 rounded-lg border border-ink/15 bg-white px-2 text-[11px] font-bold text-ink hover:border-ink/40"
            >
              <RefreshCw size={11} />
              Isi Nama
            </button>
          </div>

          {/* Assistant: Cari Langsung di Google Gambar */}
          <div className="flex items-center justify-between rounded-xl bg-counterlime/20 border border-counterlime-dark/30 p-2.5">
            <div className="min-w-0 pr-2">
              <p className="text-xs font-bold text-ink flex items-center gap-1">
                <span>🔍 Cari di Google Gambar</span>
              </p>
              <p className="text-[10px] text-ink/65 mt-0.5 leading-tight">
                Buka Google Images, salin link gambar (*Copy image address*), lalu paste di tab Link/URL.
              </p>
            </div>
            <a
              href={googleImagesUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="pressable shrink-0 inline-flex items-center gap-1 rounded-lg bg-ink px-2.5 py-1 text-xs font-bold text-counterlime hover:bg-[#1c302c] shadow-2xs"
            >
              <span>Buka Google</span>
              <ExternalLink size={11} />
            </a>
          </div>

          {/* Matching Instant Search Results */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-ink/50 mb-1">
              Rekomendasi Foto Cepat ({filteredGallery.length}):
            </p>
            {filteredGallery.length === 0 ? (
              <div className="rounded-lg border border-dashed border-ink/20 p-3 text-center">
                <p className="text-xs font-semibold text-ink/70">
                  Tidak ditemukan foto untuk "{searchQuery}".
                </p>
                <p className="text-[10px] text-ink/50 mt-0.5">
                  Gunakan tombol "Buka Google" di atas untuk mencari gambar di Google.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-1.5 max-h-40 overflow-y-auto pr-1">
                {filteredGallery.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onChange(item.url)}
                    className={cn(
                      "group relative flex flex-col overflow-hidden rounded-lg border text-left transition-all",
                      value === item.url
                        ? "border-counterlime-dark ring-2 ring-counterlime"
                        : "border-ink/10 bg-white hover:border-ink/30",
                    )}
                  >
                    <div className="relative aspect-[4/3] w-full overflow-hidden bg-ink/5">
                      <img
                        src={item.url}
                        alt={item.title}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                      />
                      {value === item.url && (
                        <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-counterlime text-ink shadow-xs">
                          <Check size={10} strokeWidth={3} />
                        </span>
                      )}
                    </div>
                    <p className="truncate p-1 text-[10px] font-semibold text-ink leading-tight">
                      {item.title}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: CURATED NUSANTARA GALLERY */}
      {tab === "gallery" && (
        <div className="space-y-2">
          {/* Category Filter Chips */}
          <div className="flex flex-wrap gap-1">
            {[
              "Semua",
              "Kopi & Teh",
              "Minuman Dingin",
              "Nasi & Lauk",
              "Mie & Pasta",
              "Roti & Burger",
              "Camilan",
              "Kue & Dessert",
            ].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedGalleryCategory(cat)}
                className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] font-semibold transition-colors border",
                  selectedGalleryCategory === cat
                    ? "bg-ink text-white border-ink"
                    : "bg-white text-ink/65 border-ink/15 hover:border-ink/35 hover:text-ink",
                )}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Gallery Grid */}
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 max-h-44 overflow-y-auto pr-1">
            {filteredGallery.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onChange(item.url)}
                className={cn(
                  "group relative flex flex-col overflow-hidden rounded-lg border text-left transition-all",
                  value === item.url
                    ? "border-counterlime-dark ring-2 ring-counterlime"
                    : "border-ink/10 bg-white hover:border-ink/30",
                )}
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-ink/5">
                  <img
                    src={item.url}
                    alt={item.title}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                  />
                  {value === item.url && (
                    <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-counterlime text-ink shadow-xs">
                      <Check size={10} strokeWidth={3} />
                    </span>
                  )}
                </div>
                <p className="truncate p-1 text-[9px] font-semibold text-ink leading-tight">
                  {item.title}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: CUSTOM LINK / URL */}
      {tab === "url" && (
        <div className="space-y-1.5">
          <label className="block text-xs font-bold uppercase tracking-wider text-ink/70">
            Tautan URL Gambar
          </label>
          <div className="flex gap-2">
            <input
              type="url"
              value={customUrlInput}
              onChange={(e) => setCustomUrlInput(e.target.value)}
              placeholder="https://images.unsplash.com/photo-..."
              className="h-8.5 flex-1 rounded-lg border border-ink/15 bg-white px-3 text-xs text-ink placeholder:text-ink/35 focus:border-ink/40 focus:outline-none focus:ring-1 focus:ring-counterlime"
            />
            <button
              type="button"
              onClick={() => {
                if (customUrlInput.trim()) {
                  onChange(customUrlInput.trim());
                  toast.success("Tautan URL gambar diterapkan!");
                }
              }}
              className="rounded-lg bg-ink px-3 text-xs font-bold text-white hover:bg-ink/90 transition-colors shrink-0"
            >
              Terapkan
            </button>
          </div>
          <p className="text-[10px] text-ink/50">
            💡 Tips: Klik kanan gambar di Google &gt; pilih <i>"Copy image address"</i> lalu tempel di sini.
          </p>
        </div>
      )}
    </div>
  );
}

function TabButton({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "pressable flex items-center justify-center gap-1 rounded-md py-1.5 text-[10px] font-bold transition-all",
        active
          ? "bg-white text-ink shadow-2xs font-extrabold"
          : "text-ink/60 hover:text-ink",
      )}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
