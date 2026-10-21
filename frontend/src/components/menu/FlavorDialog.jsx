import { useEffect, useState } from "react";
import { brl } from "@/lib/format";
import { X, Check } from "lucide-react";

export function FlavorDialog({ item, onConfirm, onClose }) {
  const [selected, setSelected] = useState([]);
  const max = item?.max_flavors || 1;

  useEffect(() => {
    setSelected([]);
  }, [item]);

  if (!item) return null;

  const toggle = (f) => {
    setSelected((s) => {
      if (s.includes(f)) return s.filter((x) => x !== f);
      if (s.length >= max) return max === 1 ? [f] : s;
      return [...s, f];
    });
  };

  return (
    <div className="fixed inset-0 z-[70]" data-testid="flavor-dialog">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-surface2 border border-white/10 rounded-2xl p-6 shadow-2xl">
        <div className="flex items-start justify-between mb-1">
          <h3 className="font-display font-black text-lg text-white leading-tight pr-4">{item.name}</h3>
          <button
            type="button"
            data-testid="flavor-close-button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-[11px] text-smoke mb-4">
          {max === 2 ? "Escolha 2 sabores (meio a meio)" : "Escolha o sabor"} · {brl(item.price)}
        </p>
        <div className="max-h-64 overflow-y-auto space-y-2 mb-5">
          {item.flavors.map((f) => {
            const active = selected.includes(f);
            return (
              <button
                key={f}
                type="button"
                data-testid={`flavor-option-${f.replace(/[^a-zA-Z0-9]/g, "-")}`}
                onClick={() => toggle(f)}
                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg border text-xs font-bold transition-colors ${
                  active
                    ? "bg-ember border-ember text-white"
                    : "bg-card2 border-white/10 text-cream hover:border-ember/50"
                }`}
              >
                <span>{f}</span>
                {active && <Check className="w-3.5 h-3.5" />}
              </button>
            );
          })}
        </div>
        <button
          type="button"
          data-testid="flavor-confirm-button"
          disabled={selected.length !== max}
          onClick={() => onConfirm(selected.join(" / "))}
          className="w-full bg-ember hover:bg-ember-dark disabled:opacity-40 disabled:cursor-not-allowed text-white py-3 rounded-xl font-bold uppercase text-xs tracking-wider transition-colors"
        >
          Adicionar ao Pedido ({selected.length}/{max})
        </button>
      </div>
    </div>
  );
}
