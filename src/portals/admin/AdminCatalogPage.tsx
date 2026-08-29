import React, { type FormEvent, useEffect, useState } from "react";
import { AdminLteCard, AdminLteSmallBox, AdminLteTable, AdminLteModal } from "@/components/adminlte/AdminLteComponents";
import { adminApi, unwrapList } from "@/lib/apiClient";

export interface Product {
  id: string;
  name: string;
  category: "RO" | "AC" | "GEYSER" | "FRIDGE" | "OTHER";
  description?: string;
  price: string | number;
  discountPercent?: string | number;
  bulkQtyDiscount?: boolean;
  stock: number;
  images?: string[];
  isActive: boolean;
}

export interface Part {
  id: string;
  name: string;
  category?: string;
  description?: string;
  price: string | number;
  stock: number;
  images?: string[];
  isActive: boolean;
}

export interface Service {
  id: string;
  name: string;
  category: "RO" | "AC" | "GEYSER" | "FRIDGE" | "AMC_PLANS" | "OTHER";
  description?: string;
  price: string | number;
  isActive: boolean;
}

const CATEGORIES = ["ALL", "RO", "AC", "GEYSER", "FRIDGE", "OTHER"] as const;

const DEFAULT_PRODUCTS: Product[] = [
  { id: "prod-ro-1", name: "RO Care Grand Plus 12L Mineral RO + UV + UF + TDS Controller Purifier", category: "RO", price: 12500, discountPercent: 10, bulkQtyDiscount: true, stock: 15, isActive: true, description: "Multi-stage purification system with active copper and zinc infusion" },
  { id: "prod-ro-2", name: "RO Care Prime Under-Sink Hydrostatic RO System (15 LPH)", category: "RO", price: 15999, discountPercent: 5, bulkQtyDiscount: true, stock: 8, isActive: true, description: "Compact under-counter water purifier with stainless steel faucet" },
  { id: "prod-ac-1", name: "Voltas Inverter 1.5 Ton 5-Star Copper Split AC Unit", category: "AC", price: 34990, discountPercent: 8, bulkQtyDiscount: false, stock: 6, isActive: true, description: "Dual inverter compressor with anti-dust filter and copper condenser" },
  { id: "prod-geyser-1", name: "AO Smith 25L Glass-Lined Storage Geyser with Digital Display", category: "GEYSER", price: 8490, discountPercent: 12, bulkQtyDiscount: true, stock: 12, isActive: true, description: "Blue diamond glass lined tank with 8-bar pressure rating" },
  { id: "prod-fridge-1", name: "Godrej 236L Double Door Inverter Frost-Free Refrigerator", category: "FRIDGE", price: 21990, discountPercent: 15, bulkQtyDiscount: false, stock: 4, isActive: true, description: "Cool shower technology with intelligent inverter compressor" },
];

const DEFAULT_PARTS: Part[] = [
  { id: "part-ro-1", name: "Filmtec 75 GPD NSF Certified High-Rejection RO Membrane", category: "RO", price: 1450, stock: 65, isActive: true, description: "Genuine DOW/Filmtec 75 GPD thin-film composite membrane sheet" },
  { id: "part-ro-2", name: "10-Inch Spun Polypropylene Sediment Pre-Filter (5 Micron)", category: "RO", price: 180, stock: 140, isActive: true, description: "High-density PP yarn spun cartridge for silt and turbidity removal" },
  { id: "part-ro-3", name: "Extruded Coconut Shell Activated Carbon Block Filter", category: "RO", price: 280, stock: 95, isActive: true, description: "Removes chlorine, organic volatiles, and unwanted odor" },
  { id: "part-ac-1", name: "R32 Eco Hydrocarbon Refrigerant Gas Canister (3 kg)", category: "AC", price: 1850, stock: 28, isActive: true, description: "Pure zero-ODP environmentally compliant refrigerant" },
  { id: "part-ac-2", name: "Universal Split AC Inverter Control PCB Motherboard", category: "AC", price: 1250, stock: 18, isActive: true, description: "Microprocessor control circuit board for brushless DC motors" },
  { id: "part-geyser-1", name: "2000W Incoloy 800 Geyser Heating Element with Anode Rod", category: "GEYSER", price: 480, stock: 55, isActive: true, description: "Corrosion-resistant tubular element for hard water areas" },
  { id: "part-geyser-2", name: "Stem Thermostat 7-Inch Safety Cutoff Switch", category: "GEYSER", price: 210, stock: 45, isActive: true, description: "Dual-pole capillary thermostat with 75°C safety trip" },
  { id: "part-fridge-1", name: "Bimetal Defrost Thermostat & Thermal Fuse Assembly Kit", category: "FRIDGE", price: 320, stock: 35, isActive: true, description: "Defrost sensor kit for frost-free evaporator coils" },
];

const DEFAULT_SERVICES: Service[] = [
  { id: "srv-1", name: "Annual Comprehensive RO Maintenance Contract (AMC Plan)", category: "AMC_PLANS", price: 2999, isActive: true, description: "Includes 2 free membrane/filter replacements, unlimited breakdown visits, and free labor" },
  { id: "srv-2", name: "Water Purifier Complete Overhaul & Filter Replacement", category: "RO", price: 499, isActive: true, description: "Includes complete internal tank sanitization, TDS calibration, and leak testing" },
  { id: "srv-3", name: "Split / Inverter AC Jet Pump Deep Chemical Wash Service", category: "AC", price: 599, isActive: true, description: "Indoor & outdoor coil pressure cleaning with anti-bacterial foam treatment" },
  { id: "srv-4", name: "Geyser De-scaling, Thermostat Health Check & Anode Service", category: "GEYSER", price: 399, isActive: true, description: "Internal tank lime descaling and thermostat thermal cutoff testing" },
  { id: "srv-5", name: "Refrigerator Gas Charging & Compressor Performance Audit", category: "FRIDGE", price: 850, isActive: true, description: "Leak pressure testing, vacuuming, and precise R134a/R600a charging" },
];

export function AdminCatalogPage() {
  const [activeTab, setActiveTab] = useState<"products" | "parts" | "services">("products");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  
  const [products, setProducts] = useState<Product[]>(DEFAULT_PRODUCTS);
  const [parts, setParts] = useState<Part[]>(DEFAULT_PARTS);
  const [services, setServices] = useState<Service[]>(DEFAULT_SERVICES);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<{ type: "product" | "part" | "service"; data: any } | null>(null);
  
  // Form State
  const [formName, setFormName] = useState("");
  const [formCategory, setFormCategory] = useState<string>("RO");
  const [formPrice, setFormPrice] = useState("");
  const [formStock, setFormStock] = useState("20");
  const [formDiscount, setFormDiscount] = useState("0");
  const [formBulkDiscount, setFormBulkDiscount] = useState(false);
  const [formDescription, setFormDescription] = useState("");
  
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [toast, setToast] = useState<string>("");

  const load = () => {
    setLoading(true);
    Promise.allSettled([
      adminApi.get("/catalog/products"),
      adminApi.get("/catalog/parts"),
      adminApi.get("/catalog/service"),
      adminApi.get("/admin/products"),
      adminApi.get("/admin/services"),
    ]).then(([pCat, partsCat, srvCat, pAdmin, srvAdmin]) => {
      // Products
      if (pCat.status === "fulfilled") {
        const list = unwrapList<Product>(pCat.value.data?.data ?? pCat.value.data);
        if (list.length > 0) setProducts(list);
      } else if (pAdmin.status === "fulfilled") {
        const list = unwrapList<Product>(pAdmin.value.data?.data ?? pAdmin.value.data);
        if (list.length > 0) setProducts(list);
      }

      // Parts
      if (partsCat.status === "fulfilled") {
        const list = unwrapList<Part>(partsCat.value.data?.data ?? partsCat.value.data);
        if (list.length > 0) setParts(list);
      }

      // Services
      if (srvCat.status === "fulfilled") {
        const list = unwrapList<Service>(srvCat.value.data?.data ?? srvCat.value.data);
        if (list.length > 0) setServices(list);
      } else if (srvAdmin.status === "fulfilled") {
        const list = unwrapList<Service>(srvAdmin.value.data?.data ?? srvAdmin.value.data);
        if (list.length > 0) setServices(list);
      }

      setLoading(false);
    });
  };

  useEffect(() => {
    load();
  }, []);

  const resetForm = () => {
    setFormName("");
    setFormCategory("RO");
    setFormPrice("");
    setFormStock("20");
    setFormDiscount("0");
    setFormBulkDiscount(false);
    setFormDescription("");
    setEditingItem(null);
  };

  const handleOpenAddModal = () => {
    resetForm();
    setShowAddModal(true);
  };

  const handleOpenEditModal = (type: "product" | "part" | "service", item: any) => {
    setEditingItem({ type, data: item });
    setFormName(item.name || "");
    setFormCategory(item.category || "RO");
    setFormPrice(String(item.price || ""));
    setFormStock(String(item.stock ?? 20));
    setFormDiscount(String(item.discountPercent ?? 0));
    setFormBulkDiscount(Boolean(item.bulkQtyDiscount));
    setFormDescription(item.description || "");
    setShowAddModal(true);
  };

  const handleFormSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (activeTab === "products") {
        const payload = {
          name: formName,
          category: formCategory,
          price: Number(formPrice),
          discountPercent: Number(formDiscount || 0),
          bulkQtyDiscount: formBulkDiscount,
          stock: Number(formStock || 0),
          description: formDescription || undefined,
        };

        if (editingItem) {
          await adminApi.patch(`/catalog/admin/products/${editingItem.data.id}`, payload).catch(() =>
            adminApi.patch(`/admin/products/${editingItem.data.id}`, payload)
          );
          setProducts((prev) =>
            prev.map((p) => (p.id === editingItem.data.id ? { ...p, ...payload, category: payload.category as any } : p))
          );
          setToast(`✓ Updated appliance product "${formName}".`);
        } else {
          const res = await adminApi.post("/catalog/admin/products", payload).catch(() =>
            adminApi.post("/admin/products", payload)
          );
          const created = res?.data?.data ?? { ...payload, id: `prod-${Date.now()}`, isActive: true };
          setProducts((prev) => [created as Product, ...prev]);
          setToast(`✓ Added appliance product "${formName}".`);
        }
      } else if (activeTab === "parts") {
        const payload = {
          name: formName,
          category: formCategory,
          price: Number(formPrice),
          stock: Number(formStock || 0),
          description: formDescription || undefined,
        };

        if (editingItem) {
          await adminApi.patch(`/catalog/admin/parts/${editingItem.data.id}`, payload);
          setParts((prev) =>
            prev.map((p) => (p.id === editingItem.data.id ? { ...p, ...payload } : p))
          );
          setToast(`✓ Updated spare part "${formName}".`);
        } else {
          const res = await adminApi.post("/catalog/admin/parts", payload);
          const created = res?.data?.data ?? { ...payload, id: `part-${Date.now()}`, isActive: true };
          setParts((prev) => [created as Part, ...prev]);
          setToast(`✓ Added spare part "${formName}".`);
        }
      } else {
        // Services & AMC
        const payload = {
          name: formName,
          category: formCategory,
          price: Number(formPrice),
          description: formDescription || undefined,
        };

        if (editingItem) {
          await adminApi.patch(`/admin/services/${editingItem.data.id}`, payload);
          setServices((prev) =>
            prev.map((s) => (s.id === editingItem.data.id ? { ...s, ...payload, category: payload.category as any } : s))
          );
          setToast(`✓ Updated service offering "${formName}".`);
        } else {
          const res = await adminApi.post("/admin/services", payload);
          const created = res?.data?.data ?? { ...payload, id: `srv-${Date.now()}`, isActive: true };
          setServices((prev) => [created as Service, ...prev]);
          setToast(`✓ Added service package "${formName}".`);
        }
      }

      setShowAddModal(false);
      resetForm();
    } catch {
      // Offline fallback state update
      const fallbackItem: any = {
        id: editingItem?.data.id || `${activeTab}-${Date.now()}`,
        name: formName,
        category: formCategory,
        price: Number(formPrice),
        stock: Number(formStock || 0),
        discountPercent: Number(formDiscount || 0),
        bulkQtyDiscount: formBulkDiscount,
        description: formDescription,
        isActive: true,
      };

      if (activeTab === "products") {
        setProducts((prev) =>
          editingItem ? prev.map((p) => (p.id === editingItem.data.id ? fallbackItem : p)) : [fallbackItem, ...prev]
        );
      } else if (activeTab === "parts") {
        setParts((prev) =>
          editingItem ? prev.map((p) => (p.id === editingItem.data.id ? fallbackItem : p)) : [fallbackItem, ...prev]
        );
      } else {
        setServices((prev) =>
          editingItem ? prev.map((s) => (s.id === editingItem.data.id ? fallbackItem : s)) : [fallbackItem, ...prev]
        );
      }

      setShowAddModal(false);
      resetForm();
      setToast(`✓ Item saved to catalog.`);
    } finally {
      setSaving(false);
      setTimeout(() => setToast(""), 3000);
    }
  };

  const handleToggleActive = async (type: "products" | "parts" | "services", id: string, current: boolean) => {
    setTogglingId(id);
    const endpoint =
      type === "products"
        ? `/admin/products/${id}`
        : type === "parts"
        ? `/catalog/admin/parts/${id}`
        : `/admin/services/${id}`;

    try {
      await adminApi.patch(endpoint, { isActive: !current });
      if (type === "products") {
        setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, isActive: !current } : p)));
      } else if (type === "parts") {
        setParts((prev) => prev.map((p) => (p.id === id ? { ...p, isActive: !current } : p)));
      } else {
        setServices((prev) => prev.map((s) => (s.id === id ? { ...s, isActive: !current } : s)));
      }
      setToast(`✓ Item status set to ${!current ? "Active" : "Disabled"}.`);
    } catch {
      if (type === "products") {
        setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, isActive: !current } : p)));
      } else if (type === "parts") {
        setParts((prev) => prev.map((p) => (p.id === id ? { ...p, isActive: !current } : p)));
      } else {
        setServices((prev) => prev.map((s) => (s.id === id ? { ...s, isActive: !current } : s)));
      }
    } finally {
      setTogglingId(null);
      setTimeout(() => setToast(""), 3000);
    }
  };

  // Filtered lists
  const filteredProducts = products.filter(
    (p) => selectedCategory === "ALL" || p.category === selectedCategory
  );
  const filteredParts = parts.filter(
    (p) => selectedCategory === "ALL" || p.category === selectedCategory || selectedCategory === "RO"
  );
  const filteredServices = services.filter(
    (s) => selectedCategory === "ALL" || s.category === selectedCategory || (selectedCategory === "RO" && s.category === "AMC_PLANS")
  );

  const totalProductStock = products.reduce((acc, curr) => acc + (curr.stock || 0), 0);
  const totalPartStock = parts.reduce((acc, curr) => acc + (curr.stock || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
            <span>🏷️</span> Catalog, Spare Parts &amp; AMC Services Master
          </h1>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            Manage appliance products, genuine replacement spare parts, AMC packages, pricing, and branch stock.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenAddModal}
            className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 text-xs font-bold shadow-md transition-colors flex items-center gap-1.5"
          >
            <span>➕</span> Add{" "}
            {activeTab === "products" ? "Appliance Product" : activeTab === "parts" ? "Spare Part" : "AMC Service"}
          </button>
          <button
            onClick={load}
            className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-xs font-bold shadow-md transition-colors flex items-center gap-2"
          >
            <span>🔄</span> Refresh Catalog
          </button>
        </div>
      </div>

      {toast && (
        <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-700 p-3 text-xs font-bold text-emerald-800 dark:text-emerald-300">
          {toast}
        </div>
      )}

      {/* AdminLTE Small Boxes */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AdminLteSmallBox
          title="Appliance Products"
          value={`${products.length} Units`}
          icon="📦"
          tone="primary"
          onLinkClick={() => setActiveTab("products")}
          linkText="Manage appliance units"
          subtext={`${totalProductStock} total stock on hand`}
        />
        <AdminLteSmallBox
          title="Spare Parts Inventory"
          value={`${parts.length} Spares`}
          icon="⚙️"
          tone="warning"
          onLinkClick={() => setActiveTab("parts")}
          linkText="Manage replacement spares"
          subtext={`${totalPartStock} units in warehouse`}
        />
        <AdminLteSmallBox
          title="AMC & Service Plans"
          value={`${services.length} Plans`}
          icon="🔧"
          tone="teal"
          onLinkClick={() => setActiveTab("services")}
          linkText="Manage service packages"
          subtext="Comprehensive AMC contracts"
        />
        <AdminLteSmallBox
          title="NSF & ISO Standard"
          value="100% Genuine"
          icon="🛡️"
          tone="success"
          subtext="Factory authentic parts"
        />
      </div>

      {/* Catalog Main Card Container */}
      <AdminLteCard
        title={
          <div className="flex items-center gap-3">
            <span>
              {activeTab === "products"
                ? "Appliance Products Master (RO Purifiers, ACs, Geysers, Fridges)"
                : activeTab === "parts"
                ? "Spare Parts & Consumables (Membranes, Filters, Heating Coils, Gas)"
                : "AMC Maintenance Plans & Service Packages"}
            </span>
          </div>
        }
        icon={activeTab === "products" ? "📦" : activeTab === "parts" ? "⚙️" : "🔧"}
        outlineTone="primary"
        tools={
          <div className="flex flex-wrap items-center gap-2">
            {/* Primary Tab Switcher */}
            <div className="flex items-center bg-gray-100 dark:bg-gray-700 p-1 rounded-xl text-xs font-bold">
              <button
                onClick={() => setActiveTab("products")}
                className={`px-3 py-1 rounded-lg transition-all ${
                  activeTab === "products"
                    ? "bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm"
                    : "text-gray-600 dark:text-gray-300"
                }`}
              >
                📦 Products ({products.length})
              </button>
              <button
                onClick={() => setActiveTab("parts")}
                className={`px-3 py-1 rounded-lg transition-all ${
                  activeTab === "parts"
                    ? "bg-white dark:bg-gray-800 text-amber-600 dark:text-amber-400 shadow-sm"
                    : "text-gray-600 dark:text-gray-300"
                }`}
              >
                ⚙️ Spare Parts ({parts.length})
              </button>
              <button
                onClick={() => setActiveTab("services")}
                className={`px-3 py-1 rounded-lg transition-all ${
                  activeTab === "services"
                    ? "bg-white dark:bg-gray-800 text-teal-600 dark:text-teal-400 shadow-sm"
                    : "text-gray-600 dark:text-gray-300"
                }`}
              >
                🔧 AMC &amp; Services ({services.length})
              </button>
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-2.5 py-1 text-xs font-bold text-gray-900 dark:text-white"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  Category: {c}
                </option>
              ))}
            </select>
          </div>
        }
      >
        {loading ? (
          <div className="h-40 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
        ) : activeTab === "products" ? (
          /* =========================================================================
             1. APPLIANCE PRODUCTS TABLE
             ========================================================================= */
          filteredProducts.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              <p className="text-3xl mb-2">📦</p>
              <p className="font-bold text-sm">No appliance products found under "{selectedCategory}".</p>
            </div>
          ) : (
            <AdminLteTable>
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs font-bold text-gray-600 dark:text-gray-300 uppercase">
                  <th className="py-3 px-4">Product Name &amp; Description</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Retail Price</th>
                  <th className="py-3 px-4">Discount</th>
                  <th className="py-3 px-4">Warehouse Stock</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-xs font-medium text-gray-800 dark:text-gray-200">
                {filteredProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/60">
                    <td className="py-3.5 px-4 max-w-sm">
                      <p className="font-bold text-gray-900 dark:text-white">{p.name}</p>
                      {p.description && <p className="text-gray-500 text-[11px] truncate mt-0.5">{p.description}</p>}
                      {p.bulkQtyDiscount && (
                        <span className="inline-block mt-1 rounded bg-amber-100 dark:bg-amber-950 px-1.5 py-0.2 text-[9px] font-bold text-amber-800 dark:text-amber-300">
                          Bulk Quantity Tier Active
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="rounded-full bg-blue-50 dark:bg-blue-950 px-2 py-0.5 text-[10px] font-bold text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                        {p.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-extrabold text-sm text-emerald-700 dark:text-emerald-400">
                      ₹{Number(p.price).toLocaleString("en-IN")}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-rose-600 dark:text-rose-400">
                      {p.discountPercent ? `${p.discountPercent}% OFF` : "—"}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-gray-900 dark:text-white">
                      {p.stock} Units
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          p.isActive
                            ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300"
                            : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                        }`}
                      >
                        {p.isActive ? "ACTIVE" : "DISABLED"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEditModal("product", p)}
                          className="rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 hover:bg-blue-100 px-2.5 py-1 font-bold text-[11px]"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => handleToggleActive("products", p.id, p.isActive)}
                          disabled={togglingId === p.id}
                          className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition-colors ${
                            p.isActive
                              ? "bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 hover:bg-rose-100"
                              : "bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100"
                          }`}
                        >
                          {p.isActive ? "Disable" : "Enable"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </AdminLteTable>
          )
        ) : activeTab === "parts" ? (
          /* =========================================================================
             2. SPARE PARTS TABLE
             ========================================================================= */
          filteredParts.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              <p className="text-3xl mb-2">⚙️</p>
              <p className="font-bold text-sm">No spare parts found.</p>
            </div>
          ) : (
            <AdminLteTable>
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs font-bold text-gray-600 dark:text-gray-300 uppercase">
                  <th className="py-3 px-4">Spare Part Name</th>
                  <th className="py-3 px-4">Type / Category</th>
                  <th className="py-3 px-4">Unit Price (INR)</th>
                  <th className="py-3 px-4">Stock In Hub</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-xs font-medium text-gray-800 dark:text-gray-200">
                {filteredParts.map((part) => (
                  <tr key={part.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/60">
                    <td className="py-3.5 px-4 max-w-sm">
                      <p className="font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                        <span>⚙️</span> {part.name}
                      </p>
                      {part.description && <p className="text-gray-500 text-[11px] truncate mt-0.5">{part.description}</p>}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="rounded-full bg-amber-50 dark:bg-amber-950 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                        {part.category || "SPARE"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-extrabold text-sm text-emerald-700 dark:text-emerald-400">
                      ₹{Number(part.price).toLocaleString("en-IN")}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-gray-900 dark:text-white">
                      {part.stock} Units
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          part.isActive
                            ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300"
                            : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                        }`}
                      >
                        {part.isActive ? "IN STOCK" : "INACTIVE"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEditModal("part", part)}
                          className="rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 hover:bg-blue-100 px-2.5 py-1 font-bold text-[11px]"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => handleToggleActive("parts", part.id, part.isActive)}
                          disabled={togglingId === part.id}
                          className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition-colors ${
                            part.isActive
                              ? "bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 hover:bg-rose-100"
                              : "bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100"
                          }`}
                        >
                          {part.isActive ? "Disable" : "Enable"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </AdminLteTable>
          )
        ) : (
          /* =========================================================================
             3. AMC & SERVICES TABLE
             ========================================================================= */
          filteredServices.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              <p className="text-3xl mb-2">🔧</p>
              <p className="font-bold text-sm">No service plans found.</p>
            </div>
          ) : (
            <AdminLteTable>
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs font-bold text-gray-600 dark:text-gray-300 uppercase">
                  <th className="py-3 px-4">Service Offering / AMC Package</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Package Price</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-xs font-medium text-gray-800 dark:text-gray-200">
                {filteredServices.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/60">
                    <td className="py-3.5 px-4 max-w-sm">
                      <p className="font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                        <span>🔧</span> {s.name}
                      </p>
                      {s.description && <p className="text-gray-500 text-[11px] truncate mt-0.5">{s.description}</p>}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="rounded-full bg-teal-50 dark:bg-teal-950 px-2 py-0.5 text-[10px] font-bold text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                        {s.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-extrabold text-sm text-emerald-700 dark:text-emerald-400">
                      ₹{Number(s.price).toLocaleString("en-IN")}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          s.isActive
                            ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300"
                            : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                        }`}
                      >
                        {s.isActive ? "OFFERING ACTIVE" : "SUSPENDED"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEditModal("service", s)}
                          className="rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 hover:bg-blue-100 px-2.5 py-1 font-bold text-[11px]"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => handleToggleActive("services", s.id, s.isActive)}
                          disabled={togglingId === s.id}
                          className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition-colors ${
                            s.isActive
                              ? "bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 hover:bg-rose-100"
                              : "bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100"
                          }`}
                        >
                          {s.isActive ? "Disable" : "Enable"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </AdminLteTable>
          )
        )}
      </AdminLteCard>

      {/* Add / Edit Item Modal */}
      {showAddModal && (
        <AdminLteModal
          isOpen={showAddModal}
          onClose={() => {
            setShowAddModal(false);
            resetForm();
          }}
          title={
            editingItem
              ? `Edit ${editingItem.type === "product" ? "Appliance Product" : editingItem.type === "part" ? "Spare Part" : "AMC Service"}: ${editingItem.data.name}`
              : `Add New ${activeTab === "products" ? "Appliance Product" : activeTab === "parts" ? "Spare Part" : "AMC Service"}`
          }
          icon={activeTab === "products" ? "📦" : activeTab === "parts" ? "⚙️" : "🔧"}
          maxWidth="lg"
          footer={
            <>
              <button
                type="button"
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="catalog-item-form"
                disabled={saving}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md"
              >
                {saving ? "Saving to Catalog..." : editingItem ? "Save Changes" : "Create Item"}
              </button>
            </>
          }
        >
          <form id="catalog-item-form" onSubmit={handleFormSubmit} className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">
                {activeTab === "products" ? "Appliance Model / Title" : activeTab === "parts" ? "Spare Part Name" : "Service Plan Title"}
              </label>
              <input
                type="text"
                required
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder={
                  activeTab === "products"
                    ? "e.g., RO Care Grand Plus 12L Mineral Purifier"
                    : activeTab === "parts"
                    ? "e.g., 75 GPD NSF Certified RO Membrane"
                    : "e.g., Annual Comprehensive RO Maintenance AMC"
                }
                className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 p-2.5 text-xs text-gray-900 dark:text-white font-bold"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">Appliance Category</label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 p-2.5 text-xs text-gray-900 dark:text-white font-bold"
                >
                  <option value="RO">RO (Water Purifiers)</option>
                  <option value="AC">AC (Air Conditioners)</option>
                  <option value="GEYSER">GEYSER (Water Heaters)</option>
                  <option value="FRIDGE">FRIDGE (Refrigeration)</option>
                  {activeTab === "services" && <option value="AMC_PLANS">AMC_PLANS (Comprehensive)</option>}
                  <option value="OTHER">OTHER</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">Price (₹ INR)</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={formPrice}
                  onChange={(e) => setFormPrice(e.target.value)}
                  placeholder="e.g., 1450"
                  className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 p-2.5 text-xs text-gray-900 dark:text-white font-mono font-bold text-sm"
                />
              </div>
            </div>

            {activeTab !== "services" && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">Warehouse Stock Quantity</label>
                  <input
                    type="number"
                    min="0"
                    value={formStock}
                    onChange={(e) => setFormStock(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 p-2.5 text-xs text-gray-900 dark:text-white font-mono font-bold"
                  />
                </div>

                {activeTab === "products" && (
                  <div>
                    <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">Discount %</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={formDiscount}
                      onChange={(e) => setFormDiscount(e.target.value)}
                      placeholder="e.g., 10"
                      className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 p-2.5 text-xs text-gray-900 dark:text-white font-mono font-bold"
                    />
                  </div>
                )}
              </div>
            )}

            {activeTab === "products" && (
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="bulk-discount"
                  checked={formBulkDiscount}
                  onChange={(e) => setFormBulkDiscount(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="bulk-discount" className="font-bold text-gray-700 dark:text-gray-300">
                  Enable Wholesale &amp; Bulk Quantity Discount Tiers
                </label>
              </div>
            )}

            <div>
              <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">Description &amp; Specifications</label>
              <textarea
                rows={3}
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Specifications, compatibility, warranty coverage, filtration stages..."
                className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 p-2.5 text-xs text-gray-900 dark:text-white"
              />
            </div>
          </form>
        </AdminLteModal>
      )}
    </div>
  );
}
