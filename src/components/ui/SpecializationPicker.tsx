import { useState } from "react";

export const SPECIALIZATIONS = [
  { value: "RO & Water Purifier", label: "RO & Water Purifier Specialist" },
  { value: "Inverter Split AC", label: "Inverter Split AC Technician" },
  { value: "Refrigerator & Freezers", label: "Refrigerator & Freezers Specialist" },
  { value: "Storage & Instant Geyser", label: "Storage & Instant Geyser Tech" },
  { value: "Multi-Appliance Expert", label: "Multi-Appliance Doorstep Expert" },
] as const;

const KNOWN_VALUES = new Set<string>(SPECIALIZATIONS.map((s) => s.value));

interface SpecializationPickerProps {
  value: string[];
  onChange: (next: string[]) => void;
  accent?: "orange" | "teal";
}

const ACCENTS = {
  orange: {
    checked: "border-orange-500 bg-orange-50 dark:bg-orange-950 text-orange-800 dark:text-orange-300",
    box: "accent-orange-600",
    chip: "bg-orange-100 dark:bg-orange-950 text-orange-800 dark:text-orange-300 border-orange-300 dark:border-orange-700",
    btn: "bg-orange-600 hover:bg-orange-700",
  },
  teal: {
    checked: "border-teal bg-teal-tint text-teal-deep",
    box: "accent-teal",
    chip: "bg-teal-tint text-teal-deep border-teal/30",
    btn: "bg-teal hover:bg-teal-deep",
  },
} as const;

/** Multi-select trade/specialization picker: fixed checkbox list + free-text "add other". */
export function SpecializationPicker({ value, onChange, accent = "orange" }: SpecializationPickerProps) {
  const [customInput, setCustomInput] = useState("");
  const a = ACCENTS[accent];
  const customValues = value.filter((v) => !KNOWN_VALUES.has(v));

  const toggle = (v: string) => {
    onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
  };

  const addCustom = () => {
    const trimmed = customInput.trim();
    if (!trimmed || value.includes(trimmed)) return;
    onChange([...value, trimmed]);
    setCustomInput("");
  };

  const removeCustom = (v: string) => onChange(value.filter((x) => x !== v));

  return (
    <div className="space-y-2.5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {SPECIALIZATIONS.map((s) => {
          const checked = value.includes(s.value);
          return (
            <label
              key={s.value}
              className={`flex items-center gap-2 rounded-xl border p-2.5 text-xs font-semibold cursor-pointer transition-colors ${
                checked
                  ? a.checked
                  : "border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
              }`}
            >
              <input type="checkbox" checked={checked} onChange={() => toggle(s.value)} className={`h-4 w-4 ${a.box}`} />
              {s.label}
            </label>
          );
        })}
      </div>

      {customValues.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {customValues.map((v) => (
            <span key={v} className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-bold ${a.chip}`}>
              {v}
              <button type="button" onClick={() => removeCustom(v)} className="opacity-70 hover:opacity-100" aria-label={`Remove ${v}`}>
                ✕
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <input
          type="text"
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addCustom();
            }
          }}
          placeholder="Not listed? Add another trade..."
          className="flex-1 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-xs font-semibold focus:outline-none"
        />
        <button type="button" onClick={addCustom} className={`rounded-xl px-3 py-2 text-xs font-bold text-white ${a.btn}`}>
          + Add
        </button>
      </div>

      {value.length === 0 && <p className="text-[11px] font-semibold text-red-500">Select at least one specialization.</p>}
    </div>
  );
}
