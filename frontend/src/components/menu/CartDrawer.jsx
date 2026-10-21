import { useState } from "react";
import { brl } from "@/lib/format";
import { Minus, Plus, Trash2, X, MessageCircle } from "lucide-react";

const slug = (s) => s.replace(/[^a-zA-Z0-9]/g, "-").slice(0, 40);

export function CartDrawer({ open, onClose, cart, onChangeQty, onRemove, settings }) {
  const [name, setName] = useState("");
  const [mode, setMode] = useState("entrega");
  const [notes, setNotes] = useState("");

  const lines = Object.entries(cart)
    .map(([key, e]) => ({ key, ...e }))
    .filter((l) => l.qty > 0);
  const total = lines.reduce((s, l) => s + l.item.price * l.qty, 0);

  const lineName = (l) => (l.variant ? `${l.item.name} (${l.variant})` : l.item.name);

  const checkout = () => {
    const parts = [
      "*Novo Pedido — Forneto Pizzaria Express*",
      "--------------------------",
      ...lines.map((l) => `${l.qty}x ${lineName(l)} — ${brl(l.item.price * l.qty)}`),
      "--------------------------",
      `*Total: ${brl(total)}*`,
      "",
      `Nome: ${name || "-"}`,
      `Tipo: ${mode === "entrega" ? "Entrega" : "Retirada no balcão"}`,
    ];
    if (notes) parts.push(`Obs: ${notes}`);
    const url = `https://wa.me/${settings.whatsapp_number}?text=${encodeURIComponent(parts.join("\n"))}`;
    window.open(url, "_blank", "noopener");
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60]" data-testid="cart-drawer">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <aside className="absolute right-0 top-0 h-full w-full max-w-md bg-surface2 border-l border-white/10 flex flex-col shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <h2 className="font-display font-black text-xl text-white uppercase">Seu Pedido</h2>
          <button
            type="button"
            data-testid="close-cart-button"
            onClick={onClose}
            className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {lines.length === 0 && (
            <p className="text-smoke text-xs text-center py-10" data-testid="cart-empty-message">
              Sua sacola está vazia. Adicione pizzas e bebidas do cardápio.
            </p>
          )}
          {lines.map((l) => (
            <div
              key={l.key}
              data-testid={`cart-line-${slug(l.key)}`}
              className="flex items-center gap-3 bg-card2 rounded-xl p-3 border border-white/10"
            >
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white">{l.item.name}</p>
                {l.variant && <p className="text-[10px] text-ash truncate">Sabor: {l.variant}</p>}
                <p className="mono-badge text-[11px] text-ember font-bold">{brl(l.item.price)}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  data-testid={`cart-dec-${slug(l.key)}`}
                  onClick={() => onChangeQty(l.key, l.qty - 1)}
                  className="w-7 h-7 rounded-md bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="text-xs font-bold text-white w-4 text-center">{l.qty}</span>
                <button
                  type="button"
                  data-testid={`cart-inc-${slug(l.key)}`}
                  onClick={() => onChangeQty(l.key, l.qty + 1)}
                  className="w-7 h-7 rounded-md bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
                >
                  <Plus className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  data-testid={`cart-remove-${slug(l.key)}`}
                  onClick={() => onRemove(l.key)}
                  className="w-7 h-7 rounded-md bg-red-500/10 hover:bg-red-500/30 flex items-center justify-center text-red-400"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}

          {lines.length > 0 && (
            <div className="space-y-3 pt-2">
              <input
                data-testid="cart-name-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome"
                className="w-full bg-card2 border border-white/10 rounded-lg px-3 py-2.5 text-xs text-white placeholder:text-smoke focus:outline-none focus:border-ember"
              />
              <div className="grid grid-cols-2 gap-2">
                {[
                  { v: "entrega", l: "Entrega" },
                  { v: "retirada", l: "Retirada" },
                ].map((o) => (
                  <button
                    key={o.v}
                    type="button"
                    data-testid={`cart-mode-${o.v}`}
                    onClick={() => setMode(o.v)}
                    className={`py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider border transition-colors ${
                      mode === o.v
                        ? "bg-ember border-ember text-white"
                        : "bg-card2 border-white/10 text-smoke hover:text-white"
                    }`}
                  >
                    {o.l}
                  </button>
                ))}
              </div>
              <textarea
                data-testid="cart-notes-input"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Observações (endereço, ponto de referência...)"
                rows={2}
                className="w-full bg-card2 border border-white/10 rounded-lg px-3 py-2.5 text-xs text-white placeholder:text-smoke focus:outline-none focus:border-ember resize-none"
              />
            </div>
          )}
        </div>

        <div className="p-5 border-t border-white/10 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs uppercase tracking-widest text-smoke font-bold">Total</span>
            <span className="mono-badge text-xl font-black text-ember" data-testid="cart-total">
              {brl(total)}
            </span>
          </div>
          <button
            type="button"
            data-testid="checkout-whatsapp-button"
            disabled={lines.length === 0}
            onClick={checkout}
            className="w-full inline-flex items-center justify-center gap-2 bg-ember hover:bg-ember-dark disabled:opacity-40 disabled:cursor-not-allowed text-white py-3.5 rounded-xl font-bold uppercase text-xs tracking-wider transition-colors shadow-lg shadow-ember/20"
          >
            <MessageCircle className="w-4 h-4" />
            Enviar Pedido no WhatsApp
          </button>
        </div>
      </aside>
    </div>
  );
}
