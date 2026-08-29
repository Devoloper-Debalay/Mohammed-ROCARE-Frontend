import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { Card, Badge } from "@/components/ui/Card";
import { TiltCard } from "@/components/3d/TiltCard";
import { HeroWater3D } from "@/components/3d/HeroWater3D";
import { Interactive3DShowcase } from "@/components/3d/Interactive3DShowcase";
import { GoogleMapsTracker } from "@/components/tracking/GoogleMapsTracker";
import { DemoQrGenerator } from "@/components/qr/DemoQrGenerator";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

const SERVICES_CATALOG = [
  {
    id: "ro-service",
    title: "Water Purifier (RO) Service",
    badge: "Most Booked",
    rating: "4.8 ★ (2,341)",
    time: "45-60 mins",
    discount: "40% OFF",
    price: "₹499",
    features: [
      "Multi-stage filter & membrane deep check",
      "Tank sanitization & sediment flushing",
      "Free on-site TDS & water quality test",
      "90-day comprehensive service warranty",
    ],
    accent: "teal",
    icon: "💧",
  },
  {
    id: "ac-service",
    title: "Air Conditioner (AC) Service",
    badge: "Summer Special",
    rating: "4.9 ★ (3,120)",
    time: "45-60 mins",
    discount: "35% OFF",
    price: "₹599",
    features: [
      "High-pressure jet pump foam coil cleaning",
      "Nitrogen gas leak audit & R32/R410A refill",
      "Inverter PCB circuit diagnostics",
      "Airflow temperature delta calibration",
    ],
    accent: "orange",
    icon: "❄️",
  },
  {
    id: "fridge-service",
    title: "Refrigerator (Fridge) Repair",
    badge: "Fastest Response",
    rating: "4.8 ★ (1,940)",
    time: "30-45 mins",
    discount: "30% OFF",
    price: "₹450",
    features: [
      "Frost-free defrost heater & timer replacement",
      "R134a/Hydrocarbon gas charging & vacuum",
      "Digital inverter compressor relay fix",
      "Magnetic door gasket seal replacement",
    ],
    accent: "teal",
    icon: "🧊",
  },
  {
    id: "geyser-service",
    title: "Water Heater (Geyser) Service",
    badge: "Winter Ready",
    rating: "4.8 ★ (1,420)",
    time: "30-45 mins",
    discount: "25% OFF",
    price: "₹399",
    features: [
      "2000W Incoloy heating element replacement",
      "Tank descaling & mineral scale removal",
      "Thermostat & 5-in-1 safety valve audit",
      "Magnesium anti-corrosion anode rod install",
    ],
    accent: "orange",
    icon: "🔥",
  },
  {
    id: "ro-plant",
    title: "Commercial RO Plant (100-1000 LPH)",
    badge: "Commercial",
    rating: "4.9 ★ (1,856)",
    time: "2-3 hours",
    discount: "20% OFF",
    price: "₹1,999",
    features: [
      "Industrial high-pressure pump overhaul",
      "FRP vessel & sand/carbon media backwash",
      "Membrane CIP chemical descaling",
      "Flow meter & panel automation check",
    ],
    accent: "teal",
    icon: "🏭",
  },
  {
    id: "softener",
    title: "Water Softener Care",
    badge: "Hard Water",
    rating: "4.7 ★ (1,523)",
    time: "1-2 hours",
    discount: "30% OFF",
    price: "₹899",
    features: [
      "Ion-exchange resin bed regeneration",
      "Brine tank salt level & valve tuning",
      "Hardness titration test before/after",
      "Plumbing bypass & multiport valve fix",
    ],
    accent: "orange",
    icon: "🧪",
  },
];

const BRANDS = [
  "Kent RO", "Aquaguard", "Pureit", "Livpure", "Blue Star", "Havells",
  "Voltas", "LG", "Samsung", "Daikin", "Racold", "Bajaj", "V-Guard", "AO Smith"
];

const AMC_PLANS = [
  {
    name: "Basic Care",
    price: "₹999 / year",
    desc: "Essential periodic maintenance for budget households",
    features: ["2 Free doorstep service visits", "Free TDS & water testing", "Priority emergency support", "Discounted spare parts"],
    accent: "slate",
  },
  {
    name: "Comprehensive AMC",
    price: "₹1,999 / year",
    popular: true,
    desc: "Complete protection with all filter replacements included",
    features: ["3 Scheduled maintenance visits", "All Sediment & Carbon filters FREE", "100% Electrical parts covered", "Zero labor charges all year"],
    accent: "teal",
  },
  {
    name: "Platinum Zero-Worry",
    price: "₹2,999 / year",
    desc: "Unlimited breakdown visits and full membrane warranty",
    features: ["Unlimited breakdown service visits", "Original 0.0001µm RO Membrane FREE", "All parts & filters 100% covered", "24/7 dedicated support manager"],
    accent: "orange",
  },
];

const TRUST_METRICS = [
  { value: "6,79,000+", label: "Happy Customers", sub: "Rated 4.8/5 PAN India" },
  { value: "30 Mins", label: "Doorstep Response", sub: "Fastest technician dispatch" },
  { value: "1,250+", label: "Certified Engineers", sub: "Background-verified experts" },
  { value: "90 Days", label: "Service Warranty", sub: "100% Genuine spare parts" },
];

const FAQS = [
  {
    q: "What appliances does ROCARE India service?",
    a: "We provide expert doorstep installation, repair, and maintenance for RO Water Purifiers, Air Conditioners (AC), Refrigerators (Fridges), and Geysers (Water Heaters) across all major brands including Kent, Aquaguard, Voltas, LG, Samsung, Daikin, and Havells.",
  },
  {
    q: "How fast can a technician reach my home in Kolkata?",
    a: "In metro areas like Salt Lake, New Town, Dum Dum, and South Kolkata, our certified technicians arrive within 30 to 45 minutes of booking with live Google Maps GPS tracking.",
  },
  {
    q: "Do I need to pay upfront when booking?",
    a: "No! There is zero advance payment required. You only pay after the job is completed and verified with your digital OTP on-site.",
  },
  {
    q: "Are the spare parts genuine and covered under warranty?",
    a: "Yes, we deal exclusively in 100% authentic, sealed manufacturer-grade components with an official 90-day ROCARE India service and replacement guarantee.",
  },
];

export function LandingPage() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [showLiveTrackerModal, setShowLiveTrackerModal] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);

  // Quick book inputs
  const [applianceInput, setApplianceInput] = useState("RO Water Purifier");
  const [phoneInput, setPhoneInput] = useState("");
  const [cityInput, setCityInput] = useState("Kolkata (Salt Lake & New Town)");

  const handleBookNow = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/customer/signup?appliance=${encodeURIComponent(applianceInput)}&phone=${phoneInput}`);
  };

  const filteredServices = selectedCategory === "ALL"
    ? SERVICES_CATALOG
    : SERVICES_CATALOG.filter(s => s.id.startsWith(selectedCategory.toLowerCase()));

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0a0f18] text-[#0b192c] dark:text-[#ffffff] relative selection:bg-[#0f766e] selection:text-white transition-colors duration-200">

      {/* 1. Official Top Helpline Banner */}
      <div className="bg-[#0b192c] dark:bg-[#042f2e] text-white py-2.5 px-4 sm:px-8 text-xs font-semibold border-b border-teal-500/20">
        <div className="mx-auto max-w-7xl flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="font-bold tracking-wide">RO CARE INDIA • Doorstep Service within 30 Minutes</span>
            <span className="hidden sm:inline text-white/60">|</span>
            <span className="hidden sm:inline text-emerald-300 font-bold">Rated 4.8/5 by 6,79,000+ Customers</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="tel:90516 07464" className="flex items-center gap-1.5 text-amber-300 hover:underline font-mono font-bold">
              <span>📞 24/7 Helpline:</span> <span>90516 07464</span>
            </a>
          </div>
        </div>
      </div>

      {/* 2. Main Navigation Bar */}
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-[#111827]/95 border-b border-gray-200 dark:border-gray-800 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 sm:px-10">
          <Logo size={36} />

          <nav className="hidden items-center gap-7 text-sm font-bold text-gray-800 dark:text-gray-200 lg:flex">
            <a href="#services" className="hover:text-[#0f766e] dark:hover:text-teal-400 transition-colors">Services</a>
            <a href="#3d-lab" className="hover:text-[#0f766e] dark:hover:text-teal-400 transition-colors">3D Appliance Lab</a>
            <a href="#tracking-demo" className="hover:text-[#0f766e] dark:hover:text-teal-400 transition-colors">Google Maps GPS</a>
            <a href="#amc-plans" className="hover:text-[#0f766e] dark:hover:text-teal-400 transition-colors">AMC Plans</a>
            <a href="#brands" className="hover:text-[#0f766e] dark:hover:text-teal-400 transition-colors">Brands</a>
            <a href="#portals" className="hover:text-[#0f766e] dark:hover:text-teal-400 transition-colors">Portals</a>
          </nav>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link to="/customer/login">
              <Button accent="teal" variant="secondary" className="font-bold !py-2 !px-4 text-xs sm:text-sm">
                Customer Sign In
              </Button>
            </Link>
            <Link to="/customer/signup" className="hidden sm:inline-block">
              <Button accent="teal" className="font-bold !py-2 !px-5 text-xs sm:text-sm shadow-md">
                Book in 30 Mins
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* 3. Hero Section with Live Booking Card & 3D Visualizer */}
      <section className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-6 py-12 sm:px-10 lg:grid-cols-[1.15fr_0.85fr] lg:py-20 z-10">
        <div>
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#0f766e]/30 bg-teal-50 dark:bg-teal-950/70 px-4 py-1.5 text-xs font-extrabold uppercase tracking-wider text-[#0f766e] dark:text-teal-300 backdrop-blur-sm shadow-sm">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-teal-600"></span>
            </span>
            RO Care India — Best RO, AC, Fridge &amp; Geyser Service
          </div>

          <h1 className="font-display text-4xl font-extrabold leading-[1.08] tracking-tight text-gray-900 dark:text-white sm:text-5xl lg:text-6xl">
            Pure Water &amp; Home Appliance Care{" "}
            <span className="bg-gradient-to-r from-[#0f766e] via-[#0284c7] to-[#c2410c] bg-clip-text text-transparent">
              at Your Doorstep.
            </span>
          </h1>

          <p className="mt-5 max-w-xl text-base font-semibold text-gray-800 dark:text-gray-200 sm:text-lg leading-relaxed">
            From multi-stage RO filter changes to AC jet cleaning, refrigerator repairs, and geyser servicing — certified technicians arrive in 30 mins with live Google Maps route tracking and a 90-day warranty.
          </p>

          {/* Instant Doorstep Booking Form */}
          <div className="mt-8 rounded-3xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 shadow-2xl">
            <p className="text-xs font-bold uppercase tracking-wider text-[#0f766e] dark:text-teal-400 mb-3 font-mono">
              ⚡ Instant 30-Minute Doorstep Booking
            </p>
            <form onSubmit={handleBookNow} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-900 dark:text-gray-200 mb-1">
                  Appliance Service
                </label>
                <select
                  value={applianceInput}
                  onChange={(e) => setApplianceInput(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2.5 text-xs font-bold text-gray-900 dark:text-white focus:border-[#0f766e] focus:outline-none"
                >
                  <option value="RO Water Purifier">💧 RO Water Purifier Service</option>
                  <option value="Air Conditioner">❄️ Air Conditioner (AC) Service</option>
                  <option value="Refrigerator">🧊 Refrigerator (Fridge) Repair</option>
                  <option value="Water Heater">🔥 Water Heater (Geyser) Service</option>
                  <option value="Commercial RO">🏭 Commercial RO Plant</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-900 dark:text-gray-200 mb-1">
                  Your Mobile Number
                </label>
                <input
                  type="tel"
                  placeholder="e.g. 98301 44520"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2.5 text-xs font-bold text-gray-900 dark:text-white focus:border-[#0f766e] focus:outline-none"
                  required
                />
              </div>

              <div className="flex flex-col justify-end">
                <Button type="submit" accent="teal" className="w-full font-extrabold !py-2.5 text-sm shadow-md">
                  Book Technician →
                </Button>
              </div>
            </form>

            <div className="mt-4 flex flex-wrap items-center justify-between border-t border-gray-100 dark:border-gray-800 pt-3 text-xs font-bold text-gray-700 dark:text-gray-300 gap-2">
              <span className="flex items-center gap-1"><span className="text-emerald-500 font-bold">✓</span> Pay After Job Done</span>
              <span className="flex items-center gap-1"><span className="text-emerald-500 font-bold">✓</span> 90-Day Guarantee</span>
              <span className="flex items-center gap-1"><span className="text-emerald-500 font-bold">✓</span> Google Maps Live ETA</span>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowLiveTrackerModal(true)}
              className="inline-flex items-center gap-2 rounded-2xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-5 py-2.5 text-xs font-bold text-gray-900 dark:text-white shadow-sm hover:border-[#0f766e] transition-all"
            >
              🗺️ Test Google Maps Live Route Tracker
            </button>
            <button
              onClick={() => setShowQrModal(true)}
              className="inline-flex items-center gap-2 rounded-2xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-5 py-2.5 text-xs font-bold text-gray-900 dark:text-white shadow-sm hover:border-[#0f766e] transition-all"
            >
              📱 Demo QR Pass &amp; UPI
            </button>
          </div>
        </div>

        {/* 3D Visualizer in Hero */}
        <div className="flex justify-center lg:justify-end">
          <div className="w-full max-w-md">
            <HeroWater3D />
          </div>
        </div>
      </section>

      {/* 4. Trust & Metrics Bar */}
      <section className="border-y border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 py-10">
        <div className="mx-auto max-w-7xl px-6 sm:px-10">
          <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
            {TRUST_METRICS.map((metric) => (
              <div key={metric.label} className="border-l-4 border-[#0f766e] pl-4">
                <p className="font-display text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white leading-none">
                  {metric.value}
                </p>
                <p className="text-sm font-bold text-gray-900 dark:text-gray-100 mt-1">{metric.label}</p>
                <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mt-0.5">{metric.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. ROCARE Services Grid with Pricing & Discounts */}
      <section id="services" className="py-20 bg-[#f8fafc] dark:bg-[#0a0f18]">
        <div className="mx-auto max-w-7xl px-6 sm:px-10">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-10">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-[#0f766e] dark:text-teal-400 font-mono">
                Verified Doorstep Care
              </p>
              <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white mt-1">
                Popular Services &amp; Packages
              </h2>
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mt-1 max-w-2xl">
                Certified engineers, transparent Indian pricing, genuine parts, and 30-minute doorstep arrival.
              </p>
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap gap-2 rounded-full bg-white dark:bg-gray-900 p-1.5 border border-gray-200 dark:border-gray-800 shadow-sm">
              {["ALL", "RO", "AC", "FRIDGE", "GEYSER"].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`rounded-full px-4 py-1.5 text-xs font-bold transition-all ${selectedCategory === cat
                      ? "bg-[#0f766e] text-white shadow-md"
                      : "text-gray-800 dark:text-gray-200 hover:text-black dark:hover:text-white"
                    }`}
                >
                  {cat === "ALL" ? "All Services" : cat}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredServices.map((srv) => (
              <TiltCard key={srv.id} className="p-6 flex flex-col justify-between border border-gray-200 dark:border-gray-800 hover:shadow-2xl transition-all">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-3xl">{srv.icon}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 px-2 py-0.5 rounded-full border border-amber-300 dark:border-amber-700">
                        {srv.discount}
                      </span>
                      <Badge tone={srv.accent === "teal" ? "teal" : "orange"}>{srv.badge}</Badge>
                    </div>
                  </div>

                  <h3 className="font-display text-lg font-bold text-gray-900 dark:text-white">{srv.title}</h3>
                  <div className="flex items-center gap-3 mt-1 text-xs font-bold text-gray-600 dark:text-gray-400">
                    <span className="text-amber-500 font-bold">{srv.rating}</span>
                    <span>•</span>
                    <span>⏱️ {srv.time}</span>
                  </div>

                  <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Includes:</p>
                    <ul className="mt-2 flex flex-col gap-1.5">
                      {srv.features.map((f) => (
                        <li key={f} className="flex items-center gap-2 text-xs font-semibold text-gray-800 dark:text-gray-200">
                          <span className="text-emerald-600 font-bold">✓</span>
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-gray-500 font-bold uppercase block">Starts at</span>
                    <span className="font-mono text-xl font-bold text-[#0f766e] dark:text-teal-400">{srv.price}</span>
                  </div>
                  <Link to={`/customer/login?service=${srv.id}`}>
                    <Button accent={srv.accent === "teal" ? "teal" : "orange"} className="font-bold !py-2 !px-4 text-xs shadow-sm">
                      Book Service
                    </Button>
                  </Link>
                </div>
              </TiltCard>
            ))}
          </div>
        </div>
      </section>

      {/* 6. 3D Appliance Engineering Lab Section */}
      <section id="3d-lab" className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 py-20">
        <div className="mx-auto max-w-7xl px-6 sm:px-10">
          <div className="mb-10 text-center max-w-3xl mx-auto">
            <p className="text-xs font-bold uppercase tracking-widest text-[#0f766e] dark:text-teal-400 font-mono">
              3D Interactive Engineering
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white mt-1">
              Interactive 3D Appliance Engineering Lab
            </h2>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mt-2">
              Rotate, inspect, and explore multi-stage RO purification chambers, dual-inverter AC copper condenser coils, smart refrigerator multi-airflow vents, and digital geysers in full 3D.
            </p>
          </div>

          <Interactive3DShowcase />
        </div>
      </section>

      {/* 7. Google Maps Real-Time Route Navigation Section */}
      <section id="tracking-demo" className="border-t border-gray-200 dark:border-gray-800 bg-[#f8fafc] dark:bg-[#0a0f18] py-20">
        <div className="mx-auto max-w-7xl px-6 sm:px-10">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-10">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400 font-mono">
                Google Maps GPS Navigation Engine
              </p>
              <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white mt-1">
                Real-Time Google Maps Doorstep Dispatch
              </h2>
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mt-1 max-w-2xl">
                Experience turn-by-turn route navigation with green maneuver banners, live vehicle cursor with heading beam, satellite &amp; traffic layers, and digital start-OTP verification.
              </p>
            </div>
            <span className="rounded-full bg-blue-100 dark:bg-blue-950 px-4 py-1.5 font-mono text-xs font-bold text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-700">
              ● Google Maps Live Route Simulation
            </span>
          </div>

          <GoogleMapsTracker
            isModal={false}
            serviceId="SR-2026-08114"
            serviceTitle="RO Membrane Replacement & Multi-Stage TDS Calibration"
            technicianName="Subhashish Roy"
            customerAddress="Block CF, Sector 1, Salt Lake, Kolkata 700064"
            initialStage="IN_PROGRESS"
          />
        </div>
      </section>

      {/* 8. Brands We Service & Sell */}
      <section id="brands" className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 py-16">
        <div className="mx-auto max-w-7xl px-6 sm:px-10 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-[#0f766e] dark:text-teal-400 font-mono">
            Multi-Brand Authorized Care
          </p>
          <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white mt-1 mb-8">
            Brands We Service, Repair &amp; Support
          </h2>

          <div className="flex flex-wrap justify-center items-center gap-3 sm:gap-4 max-w-5xl mx-auto">
            {BRANDS.map((brand) => (
              <div
                key={brand}
                className="px-5 py-3 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs sm:text-sm font-bold text-gray-800 dark:text-gray-200 shadow-sm"
              >
                {brand}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 9. AMC Annual Maintenance Contract Plans */}
      <section id="amc-plans" className="border-t border-gray-200 dark:border-gray-800 bg-[#f8fafc] dark:bg-[#0a0f18] py-20">
        <div className="mx-auto max-w-7xl px-6 sm:px-10">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <p className="text-xs font-bold uppercase tracking-widest text-[#0f766e] dark:text-teal-400 font-mono">
              Annual Protection
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white mt-1">
              RO &amp; Appliance AMC Plans
            </h2>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mt-2">
              Save up to 60% on maintenance costs with guaranteed free filter changes and priority breakdown response.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {AMC_PLANS.map((plan) => (
              <Card
                key={plan.name}
                className={`p-6 flex flex-col justify-between border ${plan.popular
                    ? "border-[#0f766e] ring-2 ring-[#0f766e]/30 shadow-2xl bg-white dark:bg-gray-900"
                    : "border-gray-200 dark:border-gray-800"
                  }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-display text-xl font-bold text-gray-900 dark:text-white">{plan.name}</h3>
                    {plan.popular && <Badge tone="teal">Most Popular</Badge>}
                  </div>
                  <p className="font-mono text-2xl font-extrabold text-[#0f766e] dark:text-teal-400">{plan.price}</p>
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mt-1">{plan.desc}</p>

                  <ul className="mt-5 flex flex-col gap-2.5 border-t border-gray-100 dark:border-gray-800 pt-4">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-xs font-semibold text-gray-800 dark:text-gray-200">
                        <span className="text-[#0f766e] dark:text-teal-400 font-bold">✓</span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800">
                  <Link to="/customer/login">
                    <Button
                      accent={plan.popular ? "teal" : "slate"}
                      variant={plan.popular ? "primary" : "secondary"}
                      fullWidth
                      className="font-bold !py-2.5 text-xs shadow-sm"
                    >
                      Subscribe AMC Plan
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 10. Frequently Asked Questions */}
      <section className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 py-20">
        <div className="mx-auto max-w-5xl px-6 sm:px-10">
          <div className="text-center mb-12">
            <p className="text-xs font-bold uppercase tracking-widest text-[#0f766e] dark:text-teal-400 font-mono">
              Got Questions?
            </p>
            <h2 className="font-display text-3xl font-extrabold text-gray-900 dark:text-white mt-1">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="flex flex-col gap-4">
            {FAQS.map((faq) => (
              <Card key={faq.q} className="p-5 border border-gray-200 dark:border-gray-800">
                <h4 className="font-display text-base font-bold text-gray-900 dark:text-white mb-1.5">{faq.q}</h4>
                <p className="text-xs font-medium text-gray-700 dark:text-gray-300 leading-relaxed">{faq.a}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 11. Multi-Portal Access Section */}
      <section id="portals" className="mx-auto max-w-7xl px-6 py-20 sm:px-10 border-t border-gray-200 dark:border-gray-800 bg-[#f8fafc] dark:bg-[#0a0f18]">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="text-xs font-bold uppercase tracking-widest text-[#0f766e] dark:text-teal-400 font-mono">
            Platform Portals
          </p>
          <h2 className="font-display text-3xl font-extrabold text-gray-900 dark:text-white mt-1">
            Access Your Portal
          </h2>
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mt-2">
            Separate, secure workspaces for customers, verified doorstep technicians, and branch operations.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {[
            {
              title: "Customer Booking Portal",
              desc: "Book doorstep service for RO, AC, Fridge, and Geysers. Track technician live on Google Maps and manage addresses.",
              to: "/customer/login",
              icon: "🏠",
              badge: "Customers",
              accent: "teal",
            },
            {
              title: "Technician & Vendor Portal",
              desc: "Accept leads, navigate with Google Maps GPS, capture geotagged camera proofs, manage wallet coins, and earn.",
              to: "/vendor/login",
              icon: "🔧",
              badge: "Technicians",
              accent: "orange",
            },
            {
              title: "Admin & Operations Portal",
              desc: "Manage branch queues, dispatch field fleet, verify geotagged photos, and oversee platform analytics end to end.",
              to: "/staff/login",
              icon: "🏢",
              badge: "Staff & Admins",
              accent: "slate",
            },
          ].map((p) => (
            <Link key={p.title} to={p.to}>
              <TiltCard className="group h-full p-6 border border-gray-200 dark:border-gray-800 hover:shadow-2xl transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-3xl">{p.icon}</span>
                  <Badge tone={p.accent === "teal" ? "teal" : p.accent === "orange" ? "orange" : "slate"}>
                    {p.badge}
                  </Badge>
                </div>
                <h3 className="mt-4 font-display text-xl font-bold text-gray-900 dark:text-white">{p.title}</h3>
                <p className="mt-2 text-xs font-medium text-gray-700 dark:text-gray-300 leading-relaxed">{p.desc}</p>
                <div className="mt-6 flex items-center justify-between border-t border-gray-100 dark:border-gray-800 pt-3">
                  <span className="text-xs font-bold text-[#0f766e] dark:text-teal-400 group-hover:underline">
                    Access Portal →
                  </span>
                </div>
              </TiltCard>
            </Link>
          ))}
        </div>
      </section>

      {/* Floating Google Maps Live Route Modal */}
      {showLiveTrackerModal && (
        <GoogleMapsTracker
          isModal
          isOpen={showLiveTrackerModal}
          onClose={() => setShowLiveTrackerModal(false)}
          serviceId="SR-2026-08114"
          serviceTitle="RO Membrane Replacement & Multi-Stage TDS Calibration"
          technicianName="Subhashish Roy"
          customerAddress="Block CF, Sector 1, Salt Lake, Kolkata 700064"
          initialStage="IN_PROGRESS"
        />
      )}

      {/* Demo QR Modal */}
      {showQrModal && (
        <DemoQrGenerator
          isModal
          isOpen={showQrModal}
          onClose={() => setShowQrModal(false)}
          title="ROCARE India Digital Service Pass"
          subtitle="Scan with any UPI or QR scanner app to verify booking & payment"
          initialValue="ROCARE-INDIA:SR-2026-08114:PASS-5812:KOLKATA"
        />
      )}

      {/* 12. Main Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-800 py-12 bg-white dark:bg-gray-900">
        <div className="mx-auto max-w-7xl px-6 sm:px-10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pb-8 border-b border-gray-100 dark:border-gray-800">
            <Logo size={32} />
            <div className="flex flex-wrap items-center justify-center gap-6 text-xs font-bold text-gray-800 dark:text-gray-200">
              <a href="#services" className="hover:underline">Water Purifiers</a>
              <a href="#services" className="hover:underline">Air Conditioners</a>
              <a href="#services" className="hover:underline">Refrigerators</a>
              <a href="#services" className="hover:underline">Geysers</a>
              <a href="#amc-plans" className="hover:underline">AMC Plans</a>
              <a href="tel:9051607464" className="text-amber-600 dark:text-amber-400">📞 90516 07464</a>
            </div>
          </div>
          <p className="text-center text-xs font-medium text-gray-600 dark:text-gray-400 mt-6">
            © {new Date().getFullYear()} ROCARE India Services Pvt. Ltd. (rocareindia.com). All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
