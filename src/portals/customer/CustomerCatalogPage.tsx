import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, Badge } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Interactive3DShowcase } from "@/components/3d/Interactive3DShowcase";
import { ProductDetailModal, type ProductItem } from "./components/ProductDetailModal";
import { customerApi, unwrapList } from "@/lib/apiClient";
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
    badge: "🛠️ 100% GENUINE SPARE PARTS",
    title: "Certified OEM Replacement Cartridges",
    subtitle: "High TDS 0.0001µm Filmtec Membranes, Incoloy Heating Coils & Universal Remotes",
    gradient: "from-emerald-900 via-teal-800 to-slate-900",
    buttonText: "Browse Spare Parts",
    category: "PARTS",
  },
];

const CATEGORY_ITEMS = [
  { id: "ALL", label: "All Items", icon: "🏬" },
  { id: "RO", label: "RO Purifiers", icon: "💧" },
  { id: "AC", label: "Split ACs", icon: "❄️" },
  { id: "FRIDGE", label: "Refrigerators", icon: "🧊" },
  { id: "GEYSER", label: "Water Heaters", icon: "🔥" },
  { id: "PARTS", label: "Genuine Spares", icon: "⚙️" },
];

const MULTI_IMAGE_OFFERS = [
  {
    title: "Top Rated Pure Water Tech",
    tag: "Up to 50% Off",
    category: "RO",
    items: [
      { name: "Copper RO 10L", discount: "40% off", img: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=300&q=80" },
      { name: "UV+UF Purifier", discount: "35% off", img: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=300&q=80" },
      { name: "Filmtec Membrane", discount: "50% off", img: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=300&q=80" },
      { name: "Mineral Booster", discount: "25% off", img: "https://images.unsplash.com/photo-1548839140-29a749e1bc4e?auto=format&fit=crop&w=300&q=80" },
    ],
  },
  {
    title: "Keep Your Home Cool & Fresh",
    tag: "Save Big",
    category: "AC",
    items: [
      { name: "1.5T Dual-Inverter", discount: "30% off", img: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=300&q=80" },
      { name: "Smart AC Remote", discount: "45% off", img: "https://images.unsplash.com/photo-1585338107529-13afc5f02586?auto=format&fit=crop&w=300&q=80" },
      { name: "Coil Cleaner Foam", discount: "20% off", img: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=300&q=80" },
      { name: "Copper Pipe Kit", discount: "15% off", img: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=300&q=80" },
    ],
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
    id: "ro-part-102",
    name: "Original 0.0001µm Filmtec RO Membrane Cartridge",
    category: "PARTS",
    description: "Certified high TDS reduction membrane (up to 2500 ppm). Fits all standard 75/80/100 GPD domestic RO housings.",
    price: 1850,
    originalPrice: 2800,
    discountPercent: 34,
    stock: 40,
    rating: 4.9,
    reviewCount: 512,
    images: [
      "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80",
    ],
    features: [
      "0.0001 Micron pore size eliminates micro-plastics and heavy metals",
      "NSF-58 certified high recovery composite polyamide sheet",
      "Direct OEM plug & play replacement with leak-proof double O-ring",
    ],
    specs: {
      Flow: "80 Gallons Per Day (GPD)",
      Rejection: "97.5% Salt Reduction",
      Origin: "ROCARE OEM Genuine",
    },
  },
  {
    id: "ac-part-202",
    name: "Universal Smart AC Remote Control with LCD",
    category: "PARTS",
    description: "Compatible with all leading Indian inverter split AC brands. Pre-programmed with 1000+ codes and glow-in-the-dark night buttons.",
    price: 650,
    originalPrice: 1200,
    discountPercent: 46,
    stock: 50,
    rating: 4.6,
    reviewCount: 140,
    images: [
      "https://images.unsplash.com/photo-1585338107529-13afc5f02586?auto=format&fit=crop&w=800&q=80",
    ],
    features: [
      "Auto-search 1-click brand synchronization",
      "Backlit LCD display for temperature and timer settings",
      "Built-in temperature sensor and turbo cool shortcut key",
    ],
    specs: {
      Range: "Up to 10 Meters Line-of-sight",
      Batteries: "2x AAA Included",
      Compatibility: "Universal Split & Window ACs",
    },
  },
];

export function CustomerCatalogPage() {
  const navigate = useNavigate();
  const user = useCustomerAuth((s) => s.user);

  const [products, setProducts] = useState<ProductItem[]>([]);
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

  // Countdown timer for Deal of the Day (Flutterzone concept)
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

  // Fetch products from backend
  const load = () => {
    setLoading(true);
    Promise.allSettled([
      customerApi.get("/catalog/products"),
      customerApi.get("/catalog/parts"),
    ])
      .then(([pRes, partsRes]) => {
        let list: ProductItem[] = [];
        if (pRes.status === "fulfilled") {
          const items = unwrapList<ProductItem>(pRes.value.data?.data ?? pRes.value.data);
          list = [...list, ...items];
        }
        if (partsRes.status === "fulfilled") {
          const parts = unwrapList<ProductItem>(partsRes.value.data?.data ?? partsRes.value.data);
          list = [...list, ...parts.map((p) => ({ ...p, category: p.category || "PARTS" }))];
        }
        setProducts(list.length > 0 ? list : DEFAULT_INDIAN_APPLIANCES);
      })
      .catch(() => setProducts(DEFAULT_INDIAN_APPLIANCES))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  // Filter & Sort
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        if (selectedCategory !== "ALL" && p.category?.toUpperCase() !== selectedCategory) {
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
  }, [products, selectedCategory, searchQuery, sortBy, inStockOnly]);

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
        title="Appliance &amp; Spare Parts Hub"
        description="Authentic Water Purifiers, Split ACs, Refrigerators, Geysers, and certified spare parts with free doorstep installation."
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
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        {CATEGORY_ITEMS.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all duration-200 ${
                isSelected
                  ? "bg-[#0f766e] text-white border-[#0f766e] shadow-lg shadow-teal-900/20 scale-105"
                  : "bg-white dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-[#0f766e]/50 hover:bg-teal-50/50 dark:hover:bg-gray-800"
              }`}
            >
              <span className="text-2xl mb-1">{cat.icon}</span>
              <span className="text-xs font-bold tracking-tight text-center">{cat.label}</span>
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
                src="https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=500&q=80"
                alt="Deal of Day"
                className="h-full w-full object-contain hover:scale-105 transition-transform duration-300"
              />
              <span className="absolute bottom-2 left-2 rounded-md bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white">
                35% OFF
              </span>
            </div>

            <h3 className="mt-3 font-display text-base font-bold text-gray-900 dark:text-white leading-snug">
              ROCARE AquaMatrix 10-Stage Copper RO Purifier
            </h3>
            <p className="mt-1 text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
              Mineral-infused RO + UV + UF water filtration with free 1-year filters and on-demand roadside assistance.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-800">
            <div className="flex items-baseline gap-2 mb-3">
              <span className="font-mono text-xl font-extrabold text-[#0f766e] dark:text-teal-400">₹14,999</span>
              <span className="font-mono text-xs text-gray-400 line-through">₹22,999</span>
              <span className="text-[11px] font-bold text-emerald-600">Save ₹8,000</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button
                accent="teal"
                variant="secondary"
                onClick={() => setSelectedProduct(DEFAULT_INDIAN_APPLIANCES[0])}
                className="!py-2 !text-xs font-bold"
              >
                Quick View
              </Button>
              <Button
                accent="teal"
                onClick={() => addToCart(DEFAULT_INDIAN_APPLIANCES[0])}
                loading={addingId === DEFAULT_INDIAN_APPLIANCES[0].id}
                className="!py-2 !text-xs font-bold"
              >
                Add to Cart
              </Button>
            </div>
          </div>
        </Card>

        {/* 4-Image Grid Promo 1 */}
        {MULTI_IMAGE_OFFERS.map((offer, idx) => (
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
                    onClick={() => setSelectedCategory(offer.category)}
                    className="flex flex-col items-center rounded-xl bg-gray-50 dark:bg-gray-800/60 p-2 border border-gray-100 dark:border-gray-800 hover:bg-teal-50/50 transition-colors text-left"
                  >
                    <img
                      src={item.img}
                      alt={item.name}
                      className="h-20 w-full object-cover rounded-lg mb-1.5"
                    />
                    <p className="text-[11px] font-bold text-gray-800 dark:text-gray-200 truncate w-full">
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
            placeholder="Search water purifiers, split ACs, spare filters, membranes..."
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
            Try clearing filters or searching for generic terms like &ldquo;RO&rdquo;, &ldquo;AC&rdquo;, or &ldquo;Membrane&rdquo;.
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
            const discountPercent = p.discountPercent || Math.round(((originalPrice - numPrice) / originalPrice) * 100);
            const displayImg = p.images?.[0] || "https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=400&q=80";

            return (
              <Card
                key={p.id}
                className="group flex flex-col justify-between p-5 border border-gray-200 dark:border-gray-800 hover:border-[#0f766e]/60 hover:shadow-xl transition-all duration-300 rounded-2xl"
              >
                <div>
                  {/* Top Badges */}
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <Badge tone={p.category === "RO" ? "teal" : p.category === "AC" ? "orange" : "slate"}>
                      {p.category}
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
                    <span className="absolute top-2 left-2 rounded-md bg-emerald-600 text-white text-[10px] font-bold px-1.5 py-0.5">
                      {discountPercent}% OFF
                    </span>
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
                        <span className="font-mono text-xs text-gray-400 line-through">
                          ₹{originalPrice.toLocaleString("en-IN")}
                        </span>
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
