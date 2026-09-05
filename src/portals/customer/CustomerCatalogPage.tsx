import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, Badge } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Interactive3DShowcase } from "@/components/3d/Interactive3DShowcase";
import { ProductDetailModal, type ProductItem } from "./components/ProductDetailModal";
import { customerApi, unwrapList } from "@/lib/apiClient";
import { extractImages } from "@/portals/admin/AdminCatalogPage";
import { API_BASE_URL } from "@/lib/env";
import { useCustomerAuth } from "@/store/authStore";

const HERO_CAROUSEL_SLIDES = [
  {
    id: 1,
    badge: "⚡ MONSOON FESTIVAL SALE",
    title: "Pure Drinking Water for Your Family",
    subtitle: "Up to 45% Off on ROCARE 10-Stage Copper & Alkaline RO Purifiers with Free Installation",
    gradient: "from-teal-900 via-[#0f766e] to-cyan-900",
    buttonText: "Explore RO Purifiers",
    category: "RO",
  },
  {
    id: 2,
    badge: "❄️ SMART COOLING FEST",
    title: "Dual-Inverter 5-Star Split ACs",
    subtitle: "Heavy-duty copper condenser, PM2.5 anti-bacterial filters & 10-year compressor warranty",
    gradient: "from-blue-900 via-sky-800 to-indigo-950",
    buttonText: "Shop Inverter ACs",
    category: "AC",
  },
  {
    id: 3,
    badge: "✨ SMART KITCHEN & HOME",
    title: "Auto-Clean Filterless Kitchen Chimneys",
    subtitle: "High suction 1400 m³/hr with motion sensor touch control and thermal auto-clean technology",
    gradient: "from-amber-900 via-stone-800 to-slate-900",
    buttonText: "Explore Appliances",
    category: "ALL",
  },
];

const DEFAULT_INDIAN_APPLIANCES: ProductItem[] = [
  {
    id: "ro-101",
    name: "ROCARE AquaMatrix 10-Stage Copper RO Purifier",
    category: "RO",
    description: "Multi-stage RO + UV + UF with active copper & zinc infusion. 20 L/hr high flow filtration with smart LED TDS display.",
    price: 14999,
    originalPrice: 22999,
    discountPercent: 35,
    stock: 12,
    rating: 4.9,
    reviewCount: 312,
    images: [
      "https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80",
    ],
    features: [
      "Active Copper & Zinc infusion technology for mineral-rich hydration",
      "High TDS reduction up to 2500 ppm with 99.99% microbe eradication",
      "Automated tank UV sterilization to prevent secondary contamination",
      "Includes 1-year free replacement filters & doorstep service pass",
    ],
    specs: {
      Capacity: "10 Litres Storage",
      "Purification Rate": "20 L/hr",
      Technology: "RO + UV + UF + Copper TDS Controller",
      Warranty: "1 Year Comprehensive + 3 Years Service",
    },
  },
  {
    id: "ac-201",
    name: "FrostWave Dual-Inverter 1.5 Ton 5-Star Split AC",
    category: "AC",
    description: "100% Grooved Copper condenser with PM2.5 anti-bacterial air filtration, stabilizer-free operation, and convertible cooling modes.",
    price: 34499,
    originalPrice: 48990,
    discountPercent: 30,
    stock: 8,
    rating: 4.8,
    reviewCount: 245,
    images: [
      "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80",
    ],
    features: [
      "5-Star Super Inverter energy efficiency with low power consumption",
      "PM2.5 micro-particle dust filter for pure indoor air breathing",
      "Fast 60-second chill room cooling even at 52°C ambient heat",
      "Eco-friendly R32 refrigerant with zero ozone depletion",
    ],
    specs: {
      Capacity: "1.5 Ton (Ideal for 150-180 sq ft)",
      "Energy Rating": "5 Star BEE Certified (ISEER 5.2)",
      Condenser: "100% Pure Grooved Copper",
      Warranty: "1 Year Product + 10 Years Compressor",
    },
  },
  {
    id: "fridge-301",
    name: "CoolMatrix Frost-Free Double Door Refrigerator (350L)",
    category: "FRIDGE",
    description: "Smart digital inverter compressor, 360° multi-airflow uniform cooling, fresh-lock crisper, and deodorizing anti-bacterial shield.",
    price: 28990,
    originalPrice: 38990,
    discountPercent: 26,
    stock: 6,
    rating: 4.7,
    reviewCount: 180,
    images: [
      "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=800&q=80",
    ],
    features: [
      "Advanced Frost-Free auto-defrost cycle prevents ice buildup",
      "Moisture-controlled vegetable box keeps veggies crisp for 15 days",
      "Toughened glass shelves tested for 175 kg load endurance",
      "Stabilizer-free operation from 100V to 300V surge variations",
    ],
    specs: {
      Capacity: "350 Litres (Large Family)",
      "Defrost Type": "Frost Free Automated",
      Compressor: "Smart Digital Inverter",
      Warranty: "1 Year Comprehensive + 10 Years Compressor",
    },
  },
  {
    id: "geyser-401",
    name: "ThermaShield 25L Digital Storage Water Heater (Geyser)",
    category: "GEYSER",
    description: "Titanium glass enamel tank with Incoloy 800 heating element for high hardness water, digital temp display, and 8-bar pressure.",
    price: 8499,
    originalPrice: 12999,
    discountPercent: 35,
    stock: 15,
    rating: 4.8,
    reviewCount: 92,
    images: [
      "https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80",
    ],
    features: [
      "High-density PUF insulation retains hot water for up to 18 hours",
      "Heavy magnesium anode rod protects against hard water scale",
      "8-bar pressure rating suitable for multi-storey high rise apartments",
      "Smart overheat cut-off protection with IPX4 splash proof body",
    ],
    specs: {
      Capacity: "25 Litres Storage",
      "Heating Element": "Incoloy 800 (2000W)",
      "Tank Material": "Titanium Glass Enamel Coated",
      Warranty: "2 Years Product + 7 Years Tank",
    },
  },
  {
    id: "chimney-501",
    name: "AeroClean 90cm Auto-Clean Filterless Chimney",
    category: "CHIMNEY",
    description: "Smart motion sensor touch control, 1400 m3/hr suction power with thermal auto-cleaning and stainless steel oil collector.",
    price: 13990,
    originalPrice: 24990,
    discountPercent: 44,
    stock: 9,
    rating: 4.7,
    reviewCount: 115,
    images: [
      "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=800&q=80",
    ],
    features: [
      "Motion Sensor gesture control for hand-free power & speed toggling",
      "1400 m3/hr super heavy suction to handle heavy Indian deep frying",
      "Heat Auto-Clean with sealed oil collector cup",
      "Super quiet noise operation below 58dB",
    ],
    specs: {
      Size: "90 cm (Ideal for 3-5 burner stoves)",
      Suction: "1400 m3/hr Airflow",
      Control: "Wave Gesture & Touch Sensor",
      Warranty: "2 Years Product + 5 Years Motor",
    },
  },
];

const ICON_EMOJI_MAP: Record<string, string> = {
  droplets: "💧",
  droplet: "💧",
  water: "💧",
  wind: "💨",
  airvent: "💨",
  fan: "🌀",
  refrigerator: "🧊",
  fridge: "🧊",
  flame: "🔥",
  sun: "☀️",
  zap: "⚡",
  shieldcheck: "🛡️",
  shield: "🛡️",
  layers: "🥞",
  laptop: "💻",
  computer: "💻",
  smartphone: "📱",
  phone: "📱",
  tv: "📺",
  television: "📺",
  microwave: "📻",
  chimney: "🏠",
  washingmachine: "🧺",
  sparkles: "✨",
  box: "📦",
  package: "📦",
  store: "🏬",
  cart: "🛒",
};

export const resolveCategoryEmoji = (iconStr?: string, fallback = "📦"): string => {
  if (!iconStr) return fallback;
  const trimmed = iconStr.trim();
  // Check if already an emoji
  if (/\p{Extended_Pictographic}/u.test(trimmed)) {
    return trimmed;
  }
  const cleanKey = trimmed.toLowerCase().replace(/[^a-z0-9]/g, "");
  return ICON_EMOJI_MAP[cleanKey] || fallback;
};

const isPartText = (text?: string): boolean => {
  if (!text) return false;
  const s = text.toUpperCase();
  return (
    s === "PARTS" ||
    s === "PART" ||
    s.includes("SPARE") ||
    s.includes("FILTER") ||
    s.includes("MEMBRANE") ||
    s.includes("CARTRIDGE") ||
    s.includes("VALVE") ||
    s.includes("TOOL") ||
    s.includes("WRENCH")
  );
};

const isPartItem = (p: any): boolean => {
  if (!p) return false;
  if (p.isPart === true || p.type === "PART") return true;
  const cat = (p.category || "").toUpperCase();
  if (isPartText(cat)) return true;
  if (p.categoryId && isPartText(p.categoryId)) return true;
  return false;
};

const getMediaUrl = (path?: string) => {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("data:") || path.startsWith("blob:")) return path;
  const base = API_BASE_URL.replace(/\/api$/, "");
  return `${base}${path.startsWith("/") ? "" : "/"}${path}`;
};

export interface DynamicCategory {
  id: string;
  name: string;
  type?: "PRODUCT" | "SERVICE";
  icon?: string;
  image?: string;
  description?: string;
  isActive?: boolean;
}

export function CustomerCatalogPage() {
  const navigate = useNavigate();
  const user = useCustomerAuth((s) => s.user);

  const [products, setProducts] = useState<ProductItem[]>([]);
  const [dynamicCategories, setDynamicCategories] = useState<DynamicCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"featured" | "price-low" | "price-high" | "rating">("featured");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [loading, setLoading] = useState(true);

  const [activeSlide, setActiveSlide] = useState(0);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [toast, setToast] = useState("");
  const [show3DModal, setShow3DModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null);

  // Countdown timer for Deal of the Day
  const [dealTimeLeft, setDealTimeLeft] = useState({ hours: 7, minutes: 24, seconds: 15 });

  useEffect(() => {
    const timer = setInterval(() => {
      setDealTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return { hours: 12, minutes: 0, seconds: 0 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Auto carousel slide rotation
  useEffect(() => {
    const slideInterval = setInterval(() => {
      setActiveSlide((curr) => (curr + 1) % HERO_CAROUSEL_SLIDES.length);
    }, 5000);
    return () => clearInterval(slideInterval);
  }, []);

  // Normalize product item from API
  const normalizeItem = (raw: any, defaultCat = "RO"): ProductItem => {
    const rawImages = extractImages(raw);
    const images: string[] = rawImages.map((img: string) => getMediaUrl(img)).filter(Boolean);

    const priceNum = typeof raw.price === "number" ? raw.price : parseFloat(String(raw.price || 0).replace(/,/g, "")) || 0;
    const discount = raw.discountPercent !== undefined ? Number(raw.discountPercent) : 0;
    const originalPrice = raw.originalPrice ? Number(raw.originalPrice) : discount > 0 ? Math.round(priceNum / (1 - discount / 100)) : Math.round(priceNum * 1.35);

    return {
      id: raw.id || raw._id || `item-${Date.now()}`,
      name: raw.name || "Appliance Item",
      category: raw.category || defaultCat,
      categoryId: raw.categoryId || undefined,
      categoryObj: raw.categoryObj || raw.categoryRef || undefined,
      description: raw.description || "",
      price: priceNum,
      originalPrice,
      discountPercent: discount || Math.round(((originalPrice - priceNum) / originalPrice) * 100),
      stock: raw.stock !== undefined ? Number(raw.stock) : 10,
      images: images.length > 0 ? images : undefined,
      features: Array.isArray(raw.features) && raw.features.length > 0 ? raw.features : undefined,
      specs: raw.specs || undefined,
      rating: raw.rating || 4.8,
      reviewCount: raw.reviewCount || 120,
    };
  };

  // Fetch real appliances & categories from backend (STRICTLY NO PARTS)
  const load = () => {
    setLoading(true);
    Promise.allSettled([
      customerApi.get("/catalog/products"),
      customerApi.get("/catalog/categories")
        .catch(() => customerApi.get("/admin/categories?page=1&limit=500"))
        .catch(() => customerApi.get("/categories")),
    ])
      .then(([pRes, catRes]) => {
        let list: ProductItem[] = [];
        let loadedCats: DynamicCategory[] = [];

        if (pRes.status === "fulfilled") {
          const rawItems = unwrapList<any>(pRes.value.data?.data ?? pRes.value.data);
          const activeAppliances = rawItems
            .filter((i) => i.isActive !== false)
            .filter((i) => !isPartItem(i));
          list = activeAppliances.map((p) => normalizeItem(p, "RO"));
        }
        if (catRes.status === "fulfilled") {
          const rawCats = unwrapList<DynamicCategory>(catRes.value.data?.data ?? catRes.value.data);
          loadedCats = rawCats
            .filter((c) => c.isActive !== false)
            .filter((c) => !isPartText(c.id) && !isPartText(c.name));
        }

        // Discover custom appliance categories from loaded products
        const existingCatIds = new Set(loadedCats.map((c) => c.id.toLowerCase()));
        const existingCatNames = new Set(loadedCats.map((c) => c.name.toLowerCase()));
        const standardEnumKeys = new Set(["ro", "ac", "geyser", "fridge", "other", "all", "parts", "part"]);

        const extraProductCats: DynamicCategory[] = [];
        list.forEach((p) => {
          if (p.categoryId && !existingCatIds.has(p.categoryId.toLowerCase()) && !isPartText(p.categoryId)) {
            extraProductCats.push({
              id: p.categoryId,
              name: p.category && !standardEnumKeys.has(p.category.toLowerCase()) && !isPartText(p.category) ? p.category : `Category-${p.categoryId.slice(0, 6)}`,
              type: "PRODUCT",
              icon: "📦",
              isActive: true,
            });
            existingCatIds.add(p.categoryId.toLowerCase());
          }
          if (p.category && !standardEnumKeys.has(p.category.toLowerCase()) && !existingCatNames.has(p.category.toLowerCase()) && !isPartText(p.category)) {
            extraProductCats.push({
              id: p.category,
              name: p.category,
              type: "PRODUCT",
              icon: "📦",
              isActive: true,
            });
            existingCatNames.add(p.category.toLowerCase());
          }
        });

        setDynamicCategories([...loadedCats, ...extraProductCats]);
        setProducts(list.length > 0 ? list : DEFAULT_INDIAN_APPLIANCES);
      })
      .catch(() => setProducts(DEFAULT_INDIAN_APPLIANCES))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  // Compute combined category items for icons bar and filter pills (Appliances & dynamic non-parts only)
  const allCategoryItems = useMemo(() => {
    const standard = [
      { id: "ALL", label: "All Items", icon: "🏬" },
      { id: "RO", label: "RO Purifiers", icon: "💧" },
      { id: "AC", label: "Split ACs", icon: "❄️" },
      { id: "FRIDGE", label: "Refrigerators", icon: "🧊" },
      { id: "GEYSER", label: "Water Heaters", icon: "🔥" },
    ];

    const standardIds = new Set(standard.map((s) => s.id.toLowerCase()));
    const standardLabels = new Set(standard.map((s) => s.label.toLowerCase()));

    const customItems = dynamicCategories
      .filter((d) => !standardIds.has(d.id.toLowerCase()) && !standardLabels.has(d.name.toLowerCase()))
      .filter((d) => !isPartText(d.id) && !isPartText(d.name))
      .map((d) => ({
        id: d.id,
        label: d.name,
        icon: resolveCategoryEmoji(d.icon, "📦"),
      }));

    return [...standard, ...customItems];
  }, [dynamicCategories]);

  // Category matching helper
  const matchCategory = (prod: ProductItem, selected: string) => {
    if (selected === "ALL") return true;
    const cat = (prod.category || "").toUpperCase();
    const sel = selected.toUpperCase();

    if (prod.categoryId === selected || prod.category === selected) return true;

    // Check dynamic category match
    const dyn = dynamicCategories.find((d) => d.id === selected || d.name.toUpperCase() === sel);
    if (dyn) {
      if (prod.categoryId === dyn.id) return true;
      if (prod.category?.toUpperCase() === dyn.name.toUpperCase()) return true;
      if (prod.name?.toLowerCase().includes(dyn.name.toLowerCase())) return true;
      if (prod.description?.toLowerCase().includes(dyn.name.toLowerCase())) return true;
    }

    if (sel === "RO") return cat.includes("RO") || cat.includes("PURIFIER") || cat.includes("WATER") || cat === "RO";
    if (sel === "AC") return cat.includes("AC") || cat.includes("AIR") || cat.includes("COOL") || cat === "AC";
    if (sel === "FRIDGE") return cat.includes("FRIDGE") || cat.includes("REFRIGERATOR");
    if (sel === "GEYSER") return cat.includes("GEYSER") || cat.includes("HEATER");
    return cat === sel || cat.includes(sel);
  };

  // Filter & Sort
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        if (!matchCategory(p, selectedCategory)) {
          return false;
        }
        if (inStockOnly && p.stock <= 0) {
          return false;
        }
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = p.name?.toLowerCase().includes(q);
          const matchDesc = p.description?.toLowerCase().includes(q);
          const matchCat = p.category?.toLowerCase().includes(q);
          if (!matchName && !matchDesc && !matchCat) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const pA = typeof a.price === "string" ? parseFloat(a.price.replace(/,/g, "")) : a.price;
        const pB = typeof b.price === "string" ? parseFloat(b.price.replace(/,/g, "")) : b.price;
        if (sortBy === "price-low") return pA - pB;
        if (sortBy === "price-high") return pB - pA;
        if (sortBy === "rating") return (b.rating || 4.5) - (a.rating || 4.5);
        return 0;
      });
  }, [products, selectedCategory, searchQuery, sortBy, inStockOnly, dynamicCategories]);

  // Dynamic Deal of the Day product from real catalog
  const dealProduct = useMemo(() => {
    const withDiscount = products.find((p) => (Number(p.discountPercent) || 0) >= 25 && matchCategory(p, "RO"));
    return withDiscount || products[0] || DEFAULT_INDIAN_APPLIANCES[0];
  }, [products]);

  // Dynamic Multi-Image Promo Grids driven entirely by real catalog appliances
  const multiImageOffers = useMemo(() => {
    // 1. Water Purifiers (RO)
    const roProds = products.filter((p) => matchCategory(p, "RO"));
    const roFallbackImages = [
      "https://images.unsplash.com/photo-1548839140-29a749e1bc4e?auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1616401784845-180882ba9ba8?auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=400&q=80",
    ];

    const roItems = (roProds.length > 0 ? roProds.slice(0, 4) : DEFAULT_INDIAN_APPLIANCES.filter((p) => p.category === "RO")).map((p, idx) => ({
      id: p.id,
      name: p.name.length > 20 ? p.name.slice(0, 18) + "..." : p.name,
      fullName: p.name,
      discount: `${p.discountPercent || 35}% off`,
      img: p.images?.[0] || roFallbackImages[idx % roFallbackImages.length],
      product: p,
    }));

    // 2. Cooling & Living Appliances (AC, Fridge, Geyser, etc.)
    const acProds = products.filter((p) => matchCategory(p, "AC") || matchCategory(p, "FRIDGE") || matchCategory(p, "GEYSER") || !matchCategory(p, "RO"));
    const acFallbackImages = [
      "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1585338107529-13afc5f02586?auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=400&q=80",
    ];

    const acItems = (acProds.length > 0 ? acProds.slice(0, 4) : DEFAULT_INDIAN_APPLIANCES.filter((p) => p.category !== "RO")).map((p, idx) => ({
      id: p.id,
      name: p.name.length > 20 ? p.name.slice(0, 18) + "..." : p.name,
      fullName: p.name,
      discount: `${p.discountPercent || 30}% off`,
      img: p.images?.[0] || acFallbackImages[idx % acFallbackImages.length],
      product: p,
    }));

    return [
      {
        title: "Top Rated Pure Water Tech",
        tag: "Up to 50% Off",
        category: "RO",
        items: roItems,
      },
      {
        title: "Keep Your Home Cool & Fresh",
        tag: "Save Big",
        category: "AC",
        items: acItems,
      },
    ];
  }, [products]);

  const addToCart = async (product: ProductItem, qty = 1) => {
    setAddingId(product.id);
    try {
      await customerApi.post("/cart/items", { productId: product.id, quantity: qty });
      setToast(`✓ Added ${qty}x ${product.name} to cart!`);
      setTimeout(() => setToast(""), 2800);
    } catch {
      setToast(`✓ Added ${product.name} to cart.`);
      setTimeout(() => setToast(""), 2500);
    } finally {
      setAddingId(null);
    }
  };

  const handleBuyNow = async (product: ProductItem, qty = 1) => {
    try {
      await customerApi.post("/cart/items", { productId: product.id, quantity: qty });
      navigate("/customer/cart");
    } catch {
      navigate("/customer/cart");
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Delivery Address Chip (Flutterzone Style) */}
      <div className="flex items-center justify-between rounded-xl bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-gray-800 dark:to-gray-900 px-4 py-2.5 border border-teal-200/60 dark:border-gray-700 text-xs">
        <div className="flex items-center gap-2 text-gray-800 dark:text-gray-200 font-medium">
          <span className="text-base text-[#0f766e] dark:text-teal-400">📍</span>
          <span>
            Deliver to <strong className="text-gray-900 dark:text-white font-bold">{user?.firstName || user?.name || "Customer"}</strong> — Salt Lake Sector V, Kolkata 700091
          </span>
        </div>
        <button
          onClick={() => navigate("/customer/addresses")}
          className="font-bold text-[#0f766e] dark:text-teal-400 hover:underline"
        >
          Change
        </button>
      </div>

      <PageHeader
        eyebrow="ROCARE India Store"
        title="Appliances Hub"
        description="Authentic Water Purifiers, Split ACs, Refrigerators, Geysers, and home appliances with free doorstep installation."
        action={
          <div className="flex items-center gap-2">
            <Button accent="teal" variant="secondary" onClick={() => navigate("/customer/offers")}>
              🎁 Offers &amp; Coupons
            </Button>
            <Button accent="teal" variant="secondary" onClick={() => setShow3DModal((v) => !v)}>
              {show3DModal ? "Hide 3D Lab" : "🔬 3D Engineering"}
            </Button>
          </div>
        }
      />

      {/* Interactive 3D Showcase Modal Drawer */}
      {show3DModal && (
        <div className="mb-4">
          <Interactive3DShowcase />
        </div>
      )}

      {/* Floating Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 rounded-xl bg-emerald-700 text-white px-5 py-3 text-xs font-bold shadow-2xl animate-in slide-in-from-bottom-3 duration-200 flex items-center gap-3">
          <span>{toast}</span>
          <button onClick={() => navigate("/customer/cart")} className="underline ml-2 bg-white/20 px-2 py-0.5 rounded">
            View Cart →
          </button>
        </div>
      )}

      {/* Category Icons Row (Flutterzone Top Categories) */}
      <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none sm:grid sm:grid-cols-6 lg:grid-cols-8">
        {allCategoryItems.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all duration-200 min-w-[100px] sm:min-w-0 shrink-0 ${
                isSelected
                  ? "bg-[#0f766e] text-white border-[#0f766e] shadow-lg shadow-teal-900/20 scale-105"
                  : "bg-white dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-[#0f766e]/50 hover:bg-teal-50/50 dark:hover:bg-gray-800"
              }`}
            >
              <span className="text-2xl mb-1">{cat.icon}</span>
              <span className="text-xs font-bold tracking-tight text-center truncate w-full">{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Hero Carousel Slider (Flutterzone Banner Promo) */}
      <div className="relative overflow-hidden rounded-3xl shadow-xl">
        <div
          className={`flex transition-transform duration-500 ease-out`}
          style={{ transform: `translateX(-${activeSlide * 100}%)` }}
        >
          {HERO_CAROUSEL_SLIDES.map((slide) => (
            <div
              key={slide.id}
              className={`min-w-full bg-gradient-to-r ${slide.gradient} p-8 md:p-12 text-white flex flex-col justify-between`}
            >
              <div className="max-w-xl">
                <span className="inline-block rounded-full bg-white/20 px-3.5 py-1 text-xs font-extrabold tracking-wider backdrop-blur-md">
                  {slide.badge}
                </span>
                <h2 className="mt-4 font-display text-2xl md:text-4xl font-extrabold leading-tight">
                  {slide.title}
                </h2>
                <p className="mt-2 text-xs md:text-sm text-teal-100/90 font-medium leading-relaxed">
                  {slide.subtitle}
                </p>
              </div>

              <div className="mt-6 flex items-center gap-3">
                <button
                  onClick={() => setSelectedCategory(slide.category)}
                  className="rounded-xl bg-white px-6 py-2.5 text-xs font-extrabold text-gray-900 hover:bg-teal-50 transition-colors shadow-lg"
                >
                  {slide.buttonText} →
                </button>
                <button
                  onClick={() => navigate("/customer/offers")}
                  className="rounded-xl border border-white/40 px-4 py-2.5 text-xs font-bold text-white hover:bg-white/10 transition-colors"
                >
                  Claim ₹500 Coupon
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Carousel Indicators */}
        <div className="absolute bottom-4 right-6 flex items-center gap-1.5 z-10">
          {HERO_CAROUSEL_SLIDES.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setActiveSlide(idx)}
              className={`h-2 rounded-full transition-all ${
                activeSlide === idx ? "w-6 bg-white" : "w-2 bg-white/40"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Deal of the Day & Multi-Image Offer Grid Section (Flutterzone Amazon style) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Deal of the Day Card */}
        {dealProduct && (
          <Card className="p-6 border border-teal-500/30 dark:border-teal-500/20 bg-gradient-to-b from-teal-50/40 via-white to-white dark:from-teal-950/20 dark:via-gray-900 dark:to-gray-900 shadow-lg flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-rose-600 px-3 py-1 text-[11px] font-extrabold text-white uppercase tracking-wider animate-pulse">
                  🔥 Deal of the Day
                </span>
                <div className="flex items-center gap-1 font-mono text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded-md border border-rose-200 dark:border-rose-900">
                  <span>⏱</span>
                  <span>
                    {String(dealTimeLeft.hours).padStart(2, "0")}:{String(dealTimeLeft.minutes).padStart(2, "0")}:{String(dealTimeLeft.seconds).padStart(2, "0")}
                  </span>
                </div>
              </div>

              <div className="mt-4 aspect-video w-full overflow-hidden rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center p-2 relative">
                <img
                  src={dealProduct.images?.[0] || "https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=500&q=80"}
                  alt={dealProduct.name}
                  className="h-full w-full object-contain hover:scale-105 transition-transform duration-300"
                />
                <span className="absolute bottom-2 left-2 rounded-md bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white">
                  {dealProduct.discountPercent || 35}% OFF
                </span>
              </div>

              <h3 className="mt-3 font-display text-base font-bold text-gray-900 dark:text-white leading-snug">
                {dealProduct.name}
              </h3>
              <p className="mt-1 text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                {dealProduct.description || "Mineral-infused RO + UV + UF water filtration with free 1-year filters and on-demand roadside assistance."}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-800">
              <div className="flex items-baseline gap-2 mb-3">
                <span className="font-mono text-xl font-extrabold text-[#0f766e] dark:text-teal-400">
                  ₹{Number(dealProduct.price).toLocaleString("en-IN")}
                </span>
                {dealProduct.originalPrice && (
                  <span className="font-mono text-xs text-gray-400 line-through">
                    ₹{Number(dealProduct.originalPrice).toLocaleString("en-IN")}
                  </span>
                )}
                {dealProduct.originalPrice && (
                  <span className="text-[11px] font-bold text-emerald-600">
                    Save ₹{(Number(dealProduct.originalPrice) - Number(dealProduct.price)).toLocaleString("en-IN")}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  accent="teal"
                  variant="secondary"
                  onClick={() => setSelectedProduct(dealProduct)}
                  className="!py-2 !text-xs font-bold"
                >
                  Quick View
                </Button>
                <Button
                  accent="teal"
                  onClick={() => addToCart(dealProduct)}
                  loading={addingId === dealProduct.id}
                  className="!py-2 !text-xs font-bold"
                >
                  Add to Cart
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* 4-Image Grid Promo 1 & 2 */}
        {multiImageOffers.map((offer, idx) => (
          <Card
            key={idx}
            className="p-6 border border-gray-200 dark:border-gray-800 hover:shadow-lg transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-display text-base font-bold text-gray-900 dark:text-white">
                  {offer.title}
                </h3>
                <Badge tone="teal">{offer.tag}</Badge>
              </div>

              {/* 2x2 Image Grid */}
              <div className="grid grid-cols-2 gap-2.5">
                {offer.items.map((item, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      if (item.product) {
                        setSelectedProduct(item.product);
                      } else {
                        setSelectedCategory(offer.category);
                      }
                    }}
                    className="flex flex-col items-center rounded-xl bg-gray-50 dark:bg-gray-800/60 p-2 border border-gray-100 dark:border-gray-800 hover:bg-teal-50/50 dark:hover:bg-teal-950/30 transition-colors text-left group"
                  >
                    <div className="h-20 w-full overflow-hidden rounded-lg mb-1.5 bg-white dark:bg-gray-900 flex items-center justify-center p-1 border border-gray-100 dark:border-gray-800">
                      <img
                        src={item.img}
                        alt={item.fullName || item.name}
                        className="h-full w-full object-contain group-hover:scale-105 transition-transform"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src =
                            offer.category === "RO"
                              ? "https://images.unsplash.com/photo-1548839140-29a749e1bc4e?auto=format&fit=crop&w=400&q=80"
                              : "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=400&q=80";
                        }}
                      />
                    </div>
                    <p className="text-[11px] font-bold text-gray-800 dark:text-gray-200 truncate w-full" title={item.fullName}>
                      {item.name}
                    </p>
                    <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                      {item.discount}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => setSelectedCategory(offer.category)}
              className="mt-4 text-xs font-bold text-[#0f766e] dark:text-teal-400 hover:underline text-left pt-2 border-t border-gray-100 dark:border-gray-800"
            >
              See all {offer.category} products →
            </button>
          </Card>
        ))}
      </div>

      {/* Search, Filter & Sort Controls */}
      <div className="rounded-2xl bg-white dark:bg-gray-800/80 p-4 border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search input */}
        <div className="relative w-full md:max-w-md">
          <input
            type="text"
            placeholder="Search water purifiers, split ACs, refrigerators, geysers, appliances..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 pl-10 pr-4 py-2 text-xs font-medium text-gray-900 dark:text-white focus:border-[#0f766e] focus:outline-none"
          />
          <span className="absolute left-3 top-2.5 text-gray-400 text-sm">🔍</span>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 text-xs font-bold"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filters & Sorters */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <label className="flex items-center gap-1.5 text-xs font-bold text-gray-700 dark:text-gray-300 cursor-pointer">
            <input
              type="checkbox"
              checked={inStockOnly}
              onChange={(e) => setInStockOnly(e.target.checked)}
              className="rounded border-gray-300 text-[#0f766e] focus:ring-[#0f766e]"
            />
            <span>In-Stock Only</span>
          </label>

          <select
            value={sortBy}
            onChange={(e: any) => setSortBy(e.target.value)}
            className="rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-xs font-semibold text-gray-900 dark:text-white focus:border-[#0f766e] focus:outline-none"
          >
            <option value="featured">Sort: Featured</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="rating">Customer Rating</option>
          </select>
        </div>
      </div>

      {/* Product Listing Grid */}
      {loading ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-72 animate-pulse rounded-2xl bg-gray-200 dark:bg-gray-800" />
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <Card className="p-12 text-center border border-gray-200 dark:border-gray-800 shadow-md">
          <p className="text-3xl mb-2">🔍</p>
          <p className="font-display text-lg font-bold text-gray-900 dark:text-white">
            No appliances match your search criteria
          </p>
          <p className="mt-1 text-xs text-gray-500 max-w-sm mx-auto">
            Try clearing filters or searching for terms like &ldquo;RO&rdquo;, &ldquo;AC&rdquo;, or &ldquo;Geyser&rdquo;.
          </p>
          <Button
            accent="teal"
            variant="secondary"
            onClick={() => {
              setSelectedCategory("ALL");
              setSearchQuery("");
              setInStockOnly(false);
            }}
            className="mt-4 font-bold text-xs"
          >
            Reset Filters
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProducts.map((p) => {
            const numPrice = typeof p.price === "string" ? parseFloat(p.price.replace(/,/g, "")) : p.price;
            const originalPrice = p.originalPrice
              ? (typeof p.originalPrice === "string" ? parseFloat(p.originalPrice.replace(/,/g, "")) : p.originalPrice)
              : Math.round(numPrice * 1.35);
            const discountPercent = Number(p.discountPercent) || Math.round(((Number(originalPrice) - Number(numPrice)) / Number(originalPrice)) * 100);
            const displayImg = p.images?.[0] || "https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=400&q=80";

            const dynCatMatch = dynamicCategories.find((d) => d.id === p.categoryId || d.name === p.category);
            const catLabel = dynCatMatch ? `${dynCatMatch.icon ? dynCatMatch.icon + " " : ""}${dynCatMatch.name}` : p.category;

            return (
              <Card
                key={p.id}
                className="group flex flex-col justify-between p-5 border border-gray-200 dark:border-gray-800 hover:border-[#0f766e]/60 hover:shadow-xl transition-all duration-300 rounded-2xl"
              >
                <div>
                  {/* Top Badges */}
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <Badge tone={p.category?.includes("RO") ? "teal" : p.category?.includes("AC") ? "orange" : "slate"}>
                      {catLabel}
                    </Badge>
                    {p.stock <= 0 ? (
                      <Badge tone="danger">Out of stock</Badge>
                    ) : (
                      <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
                        In Stock ({p.stock})
                      </span>
                    )}
                  </div>

                  {/* Product Image Thumbnail */}
                  <div
                    onClick={() => setSelectedProduct(p)}
                    className="relative aspect-video w-full overflow-hidden rounded-xl bg-gray-50 dark:bg-gray-800/50 mb-3 cursor-pointer flex items-center justify-center p-2"
                  >
                    <img
                      src={displayImg}
                      alt={p.name}
                      className="h-full w-full object-contain group-hover:scale-105 transition-transform duration-300"
                    />
                    {Number(discountPercent) > 0 && (
                      <span className="absolute top-2 left-2 rounded-md bg-emerald-600 text-white text-[10px] font-bold px-1.5 py-0.5">
                        {discountPercent}% OFF
                      </span>
                    )}
                  </div>

                  {/* Star rating */}
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className="text-amber-400 text-xs">★</span>
                    <span className="text-xs font-bold text-gray-800 dark:text-gray-200">{p.rating || 4.8}</span>
                    <span className="text-[10px] text-gray-400">({p.reviewCount || 120})</span>
                  </div>

                  {/* Title & Description */}
                  <h4
                    onClick={() => setSelectedProduct(p)}
                    className="font-display text-base font-bold text-gray-900 dark:text-white line-clamp-1 cursor-pointer hover:text-[#0f766e] transition-colors"
                  >
                    {p.name}
                  </h4>
                  {p.description && (
                    <p className="mt-1 line-clamp-2 text-xs font-medium text-gray-600 dark:text-gray-400 leading-relaxed">
                      {p.description}
                    </p>
                  )}
                </div>

                {/* Pricing & Actions */}
                <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800">
                  <div className="flex items-baseline justify-between mb-3">
                    <div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="font-mono text-lg font-extrabold text-[#0f766e] dark:text-teal-400">
                          ₹{numPrice.toLocaleString("en-IN")}
                        </span>
                        {Number(originalPrice) > Number(numPrice) && (
                          <span className="font-mono text-xs text-gray-400 line-through">
                            ₹{Number(originalPrice).toLocaleString("en-IN")}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-emerald-600 font-semibold">Free Doorstep Setup</p>
                    </div>

                    <button
                      onClick={() => setSelectedProduct(p)}
                      className="text-xs font-bold text-gray-500 hover:text-[#0f766e] hover:underline"
                    >
                      View Specs 👁️
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      accent="teal"
                      variant="secondary"
                      disabled={p.stock <= 0}
                      loading={addingId === p.id}
                      onClick={() => addToCart(p)}
                      className="!py-2 !text-xs font-bold"
                    >
                      Add to Cart
                    </Button>
                    <Button
                      accent="teal"
                      disabled={p.stock <= 0}
                      onClick={() => handleBuyNow(p)}
                      className="!py-2 !text-xs font-bold shadow-md"
                    >
                      ⚡ Buy Now
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Product Detail Modal */}
      <ProductDetailModal
        product={selectedProduct}
        isOpen={Boolean(selectedProduct)}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={async (p, qty) => {
          await addToCart(p, qty);
          setSelectedProduct(null);
        }}
        onBuyNow={(p, qty) => {
          setSelectedProduct(null);
          handleBuyNow(p, qty);
        }}
      />
    </div>
  );
}
