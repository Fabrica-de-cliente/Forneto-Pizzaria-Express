import { brl } from "@/lib/format";
import { Flame } from "lucide-react";

export function ItemImage({ item, className }) {
  if (item.image_url) {
    return (
      <img
        src={item.image_url}
        alt={item.name}
        loading="lazy"
        className={`w-full object-cover ${className}`}
      />
    );
  }
  return (
    <div
      className={`w-full bg-gradient-to-br from-ember/40 via-surface2 to-ink flex items-center justify-center ${className}`}
    >
      <Flame className="w-8 h-8 text-ember/70" />
    </div>
  );
}

export function PizzaCard({ item, onAdd }) {
  return (
    <div
      data-testid={`menu-item-${item.id}`}
      className="bg-surface2 rounded-2xl p-5 border border-white/10 flex flex-col justify-between"
    >
      <div>
        <div className="w-full h-48 rounded-xl overflow-hidden relative mb-4">
          <ItemImage item={item} className="h-48" />
          {item.badge && (
            <div className="absolute top-3 left-3 bg-ember text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase mono-badge">
              {item.badge}
            </div>
          )}
        </div>
        <div className="flex justify-between items-start gap-2 mb-2">
          <h3 className="text-xl font-black text-white font-display leading-tight">{item.name}</h3>
          <span className="text-lg font-black text-ember mono-badge whitespace-nowrap">
            {item.price_from && <span className="block text-[9px] text-smoke font-bold uppercase">a partir de</span>}
            {brl(item.price)}
          </span>
        </div>
        {item.description && (
          <p className="text-xs text-smoke leading-relaxed mb-4">{item.description}</p>
        )}
      </div>
      <button
        type="button"
        data-testid={`add-to-cart-${item.id}`}
        onClick={() => onAdd(item)}
        className="w-full py-2.5 bg-white/10 hover:bg-ember text-white font-bold text-xs uppercase tracking-wider rounded-lg transition-colors border border-white/10"
      >
        + Adicionar ao Pedido
      </button>
    </div>
  );
}

export function DrinkCard({ item, onAdd }) {
  return (
    <div
      data-testid={`menu-item-${item.id}`}
      className="bg-card2 p-4 rounded-xl border border-white/10 flex flex-col justify-between gap-3"
    >
      <div className="w-full h-32 rounded-lg overflow-hidden">
        <ItemImage item={item} className="h-32" />
      </div>
      <div>
        <h4 className="font-bold text-xs text-white">{item.name}</h4>
        <span className="mono-badge text-xs font-bold text-ember mt-1 block">{brl(item.price)}</span>
      </div>
      <button
        type="button"
        data-testid={`add-to-cart-${item.id}`}
        onClick={() => onAdd(item)}
        className="w-full py-2 bg-white/10 hover:bg-ember text-white font-bold text-[10px] uppercase tracking-wider rounded-lg transition-colors border border-white/10"
      >
        + Adicionar
      </button>
    </div>
  );
}
