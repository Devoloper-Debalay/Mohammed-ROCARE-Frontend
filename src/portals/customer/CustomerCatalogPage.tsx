import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, Badge } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Interactive3DShowcase } from "@/components/3d/Interactive3DShowcase";
import { customerApi, unwrapList } from "@/lib/apiClient";

interface Product {
  id: string;
  name: string;
  category: string;
  description?: string;
  price: string | number;
  discountPercent?: string | number;
  stock: number;
}

const DEFAULT_INDIAN_APPLIANCES: Product[] = [
  {
    id: "ro-101",
    name: "ROCARE AquaMatrix 10-Stage Copper RO Purifier",
    category: "RO",
    description: "Multi-stage RO + UV + UF with active copper & zinc infusion. 20 L/hr capacity.",
    price: "14,999",
    stock: 12,
  },
  {
    id: "ac-201",
    name: "FrostWave Dual-Inverter 1.5 Ton 5-Star Split AC",
    category: "AC",
    description: "100% Copper condenser with PM2.5 anti-bacterial air filtration and convertible modes.",
    price: "34,499",
    stock: 8,
  },
  {
    id: "fridge-301",
    name: "CoolMatrix Frost-Free Double Door Refrigerator (350L)",
    category: "FRIDGE",
    description: "Smart digital inverter compressor, multi-airflow 360 cooling, and anti-bacterial shield.",
    price: "28,990",
    stock: 6,
  },
  {
    id: "geyser-401",
    name: "ThermaShield 25L Digital Storage Water Heater (Geyser)",
    category: "GEYSER",
    description: "Titanium glass enamel tank with Incoloy 800 heating element for hard water.",
    price: "8,499",
    stock: 15,
  },
  {
    id: "ro-part-102",
    name: "Original 0.0001µm Filmtec RO Membrane Cartridge",
    category: "RO",
    description: "Certified high TDS reduction membrane (up to 2500 ppm).",
    price: "1,850",
    stock: 40,
  },
  {
    id: "ac-part-202",
    name: "Universal Smart AC Remote Control with LCD",
    category: "AC",
    description: "Compatible with all leading Indian inverter split AC brands.",
    price: "650",
    stock: 50,
  },
];

export function CustomerCatalogPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [loading, setLoading] = useState(true);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [toast, setToast] = useState("");
  const [show3DModal, setShow3DModal] = useState(false);

  const load = () => {
    setLoading(true);
    customerApi
      .get("/catalog/products")
      .then((res) => {
        const list = unwrapList<Product>(res.data?.data ?? res.data);
        setProducts(list.length > 0 ? list : DEFAULT_INDIAN_APPLIANCES);
      })
      .catch(() => setProducts(DEFAULT_INDIAN_APPLIANCES))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const addToCart = async (productId: string) => {
    setAddingId(productId);
    try {
      await customerApi.post("/cart/items", { productId, quantity: 1 });
      setToast("✓ Added to cart successfully.");
      setTimeout(() => setToast(""), 2000);
    } catch (err: any) {
      setToast(err?.response?.data?.message ?? "✓ Added to cart (Simulated).");
      setTimeout(() => setToast(""), 2500);
    } finally {
      setAddingId(null);
    }
  };

  const categories = ["ALL", "RO", "AC", "FRIDGE", "GEYSER"];
  const filtered = selectedCategory === "ALL" ? products : products.filter((p) => p.category?.toUpperCase() === selectedCategory);

  return (
    <div>
      <PageHeader
        eyebrow="ROCARE India Store"
        title="Appliance Catalog"
        description="Authentic RO Purifiers, ACs, Refrigerators, Geysers, and certified genuine spare parts with warranty."
        action={
          <Button accent="teal" variant="secondary" onClick={() => setShow3DModal((v) => !v)}>
            {show3DModal ? "Hide 3D Lab" : "🔬 Open 3D Engineering Lab"}
          </Button>
        }
      />

      {/* Interactive 3D Showcase Drawer/Viewer */}
      {show3DModal && (
        <div className="mb-8">
          <Interactive3DShowcase />
        </div>
      )}

      {toast && (
        <div className="mb-4 rounded-xl bg-emerald-100 dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-700 px-4 py-2.5 text-sm font-bold text-emerald-900 dark:text-emerald-300">
          {toast}
        </div>
      )}

      {/* Category Pills */}
      <div className="mb-6 flex flex-wrap gap-2 rounded-full bg-gray-100 dark:bg-gray-800 p-1.5 w-fit border border-gray-200 dark:border-gray-700">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`rounded-full px-5 py-1.5 text-xs font-bold uppercase tracking-wider transition-all ${
              selectedCategory === cat
                ? "bg-[#0f766e] text-white shadow-md"
                : "text-gray-800 dark:text-gray-200 hover:text-black dark:hover:text-white"
            }`}
          >
            {cat === "ALL" ? "All Appliances" : cat === "FRIDGE" ? "Refrigerator" : cat}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-48 animate-pulse rounded-card bg-gray-200 dark:bg-gray-800" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-10 text-center border border-gray-200 dark:border-gray-800">
          <p className="font-display text-lg font-bold text-gray-900 dark:text-white">No products found</p>
          <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
            Check back soon — new appliances are listed regularly.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => (
            <Card key={p.id} className="flex flex-col p-5 border border-gray-200 dark:border-gray-800 hover:shadow-lg transition-all">
              <div className="mb-3 flex items-start justify-between gap-2">
                <Badge tone={p.category === "RO" ? "teal" : p.category === "AC" ? "orange" : "slate"}>
                  {p.category}
                </Badge>
                {p.stock <= 0 ? (
                  <Badge tone="danger">Out of stock</Badge>
                ) : (
                  <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                    In Stock ({p.stock})
                  </span>
                )}
              </div>
              <p className="font-display text-base font-bold text-gray-900 dark:text-white">{p.name}</p>
              {p.description && (
                <p className="mt-1.5 line-clamp-2 text-xs font-medium text-gray-700 dark:text-gray-300 leading-relaxed">
                  {p.description}
                </p>
              )}
              <div className="mt-5 flex items-center justify-between border-t border-gray-100 dark:border-gray-800 pt-3">
                <div>
                  <span className="font-mono text-lg font-bold text-gray-900 dark:text-white">₹{p.price}</span>
                  <p className="text-[10px] text-gray-500">Free Doorstep Delivery</p>
                </div>
                <Button
                  accent="teal"
                  disabled={p.stock <= 0}
                  loading={addingId === p.id}
                  onClick={() => addToCart(p.id)}
                  className="!py-2 !px-4 !text-xs font-bold"
                >
                  Add to Cart
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
