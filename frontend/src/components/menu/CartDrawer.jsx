import { useState } from "react";
import { api } from "@/lib/api";
import { brl } from "@/lib/format";
import { Minus, Plus, Trash2, X, MessageCircle } from "lucide-react";

const slug = (s) => s.replace(/[^a-zA-Z0-9]/g, "-").slice(0, 40);

const PAYMENTS = [
  { v: "Pix", l: "Pix" },
  { v: "Cartão", l: "Cartão" },
  { v: "Dinheiro", l: "Dinheiro" },
];

export function CartDrawer({ open, onClose, cart, onChangeQty, onRemove, settings, zones = [] }) {
  const [name, setName] = useState("");
  const [mode, setMode] = useState("entrega");
  const [zoneId, setZoneId] = useState("");
  const [payment, setPayment] = useState("");
  const [changeFor, setChangeFor] = useState("");
  const [notes, setNotes] = useState("");
  const [sending, setSending] = useState(false);

  const lines = Object.entries(cart)
    .map(([key, e]) => ({ key, ...e }))
    .filter((l) => l.qty > 0);
  const subtotal = lines.reduce((s, l) => s + l.unitPrice * l.qty, 0);
  const selectedZone = zones.find((z) => z.id === zoneId);
  const fee = mode === "entrega" && selectedZone ? selectedZone.fee : 0;
  const otherZone = mode === "entrega" && zoneId === "outro";
  const total = subtotal + fee;

  const checkout = async () => {
    setSending(true);
    const parts = [
      "*Novo Pedido — Forneto Pizzaria Express*",
      "--------------------------",
      ...lines.flatMap((l) => {
        const base = `${l.qty}x ${l.item.name}${l.variant ? ` (${l.variant})` : ""} — ${brl(l.unitPrice * l.qty)}`;
        const extras = (l.addons || []).map((a) => `   + ${a.name} (${brl(a.price)})`);
        return [base, ...extras];
      }),
      "--------------------------",
      `Subtotal: ${brl(subtotal)}`,
    ];
    if (mode === "entrega") {
      if (selectedZone) parts.push(`Entrega (${selectedZone.neighborhood}): ${brl(fee)}`);
      if (otherZone) parts.push("Entrega: outro bairro (taxa a combinar)");
    }
    parts.push(`*Total: ${brl(total)}*`, "", `Nome: ${name || "-"}`);
    parts.push(`Tipo: ${mode === "entrega" ? "Entrega" : "Retirada no balcão"}`);
    if (payment) {
      let payLine = `Pagamento: ${payment}`;
      if (payment === "Dinheiro" && changeFor) payLine += ` (troco para ${brl(parseFloat(changeFor.replace(",", ".")) || 0)})`;
      parts.push(payLine);
    }
    if (notes) parts.push(`Obs: ${notes}`);

    // registra o pedido no dashboard da equipe (não bloqueia o envio)
    try {
      await api.post("/orders", {
        customer_name: name,
        mode,
        neighborhood: selectedZone ? selectedZone.neighborhood : otherZone ? "Outro bairro" : "",
        payment,
        change_for: payment === "Dinheiro" && changeFor ? parseFloat(changeFor.replace(",", ".")) || null : null,
        lines: lines.map((l) => ({
          name: l.item.name,
          variant: l.variant || "",
          addons: (l.addons || []).map((a) => `${a.name} (${brl(a.price)})`),
          qty: l.qty,
          unit_price: l.unitPrice,
        })),
        subtotal,
        fee,
        total,
      });
    } catch (e) {
      /* pedido segue pelo WhatsApp mesmo se o registro falhar */
    }

    const url = `https://wa.me/${settings.whatsapp_number}?text=${encodeURIComponent(parts.join("\n"))}`;
    window.open(url, "_blank", "noopener");
    setSending(false);
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
                {l.variant && <p className="text-[10px] text-ash">Sabor: {l.variant}</p>}
                {(l.addons || []).map((a) => (
                  <p key={a.id} className="text-[10px] text-ash">+ {a.name} ({brl(a.price)})</p>
                ))}
                <p className="mono-badge text-[11px] text-ember font-bold">{brl(l.unitPrice)}</p>
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
              {mode === "entrega" && zones.length > 0 && (
                <select
                  data-testid="cart-zone-select"
                  value={zoneId}
                  onChange={(e) => setZoneId(e.target.value)}
                  className="w-full bg-card2 border border-white/10 rounded-lg px-3 py-2.5 text-xs text-white focus:outline-none focus:border-ember"
                >
                  <option value="">Selecione seu bairro</option>
                  {zones.map((z) => (
                    <option key={z.id} value={z.id} data-testid={`zone-option-${z.id}`}>
                      {z.neighborhood} — taxa {brl(z.fee)}
                    </option>
                  ))}
                  <option value="outro">Outro bairro (taxa a combinar)</option>
                </select>
              )}
              <div>
                <p className="mono-badge text-[10px] font-bold uppercase tracking-widest text-smoke mb-2">Pagamento</p>
                <div className="grid grid-cols-3 gap-2">
                  {PAYMENTS.map((o) => (
                    <button
                      key={o.v}
                      type="button"
                      data-testid={`cart-payment-${o.v.toLowerCase()}`}
                      onClick={() => setPayment(payment === o.v ? "" : o.v)}
                      className={`py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider border transition-colors ${
                        payment === o.v
                          ? "bg-ember border-ember text-white"
                          : "bg-card2 border-white/10 text-smoke hover:text-white"
                      }`}
                    >
                      {o.l}
                    </button>
                  ))}
                </div>
                {payment === "Dinheiro" && (
                  <input
                    data-testid="cart-change-input"
                    value={changeFor}
                    onChange={(e) => setChangeFor(e.target.value)}
                    placeholder="Troco para quanto? (opcional)"
                    className="w-full mt-2 bg-card2 border border-white/10 rounded-lg px-3 py-2.5 text-xs text-white placeholder:text-smoke focus:outline-none focus:border-ember"
                  />
                )}
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

        <div className="p-5 border-t border-white/10 space-y-2">
          <div className="flex justify-between items-center text-xs text-smoke">
            <span>Subtotal</span>
            <span className="mono-badge" data-testid="cart-subtotal">{brl(subtotal)}</span>
          </div>
          {mode === "entrega" && selectedZone && (
            <div className="flex justify-between items-center text-xs text-smoke">
              <span>Entrega — {selectedZone.neighborhood}</span>
              <span className="mono-badge" data-testid="cart-fee">{brl(fee)}</span>
            </div>
          )}
          {mode === "entrega" && otherZone && (
            <p className="text-[10px] text-amber-400" data-testid="cart-fee-pending">
              Taxa de entrega a combinar no WhatsApp
            </p>
          )}
          <div className="flex justify-between items-center pt-1">
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
            {sending ? "Enviando..." : "Enviar Pedido no WhatsApp"}
          </button>
        </div>
      </aside>
    </div>
  );
}
