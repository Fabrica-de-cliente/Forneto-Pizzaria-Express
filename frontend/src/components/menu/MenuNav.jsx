import { ArrowRight, ShoppingBag } from "lucide-react";

export function MenuNav({ settings, cartCount, onOpenCart }) {
  return (
    <header className="sticky top-0 z-50 bg-ink/90 backdrop-blur-md border-b border-white/10">
      <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-3" data-testid="brand-logo">
          <div className="w-10 h-10 rounded-xl bg-ember flex items-center justify-center text-white font-black text-xl shadow-lg font-display">
            F
          </div>
          <div>
            <span className="font-display font-extrabold text-xl tracking-tight text-white block leading-none">
              FORNETO
            </span>
            <span className="mono-badge text-[9px] uppercase tracking-widest text-ember font-bold">
              EXPRESS GOIÂNIA
            </span>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-8 text-xs font-bold uppercase tracking-widest text-smoke">
          <a href="#cardapio" className="hover:text-white transition-colors">Cardápio & Preços</a>
          <a href="#bebidas" className="hover:text-white transition-colors">Bebidas</a>
          <a href="#onde-estamos" className="hover:text-white transition-colors">Vera Cruz</a>
        </nav>

        <button
          type="button"
          data-testid="open-cart-button"
          onClick={onOpenCart}
          className="relative inline-flex items-center gap-2 bg-ember hover:bg-ember-dark text-white px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors shadow-lg shadow-ember/20"
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>Pedir WhatsApp</span>
          {cartCount > 0 && (
            <span
              data-testid="cart-count-badge"
              className="absolute -top-2 -right-2 bg-white text-ink text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center"
            >
              {cartCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}

export function Marquee() {
  const items = [
    "FORNETO EXPRESS GOIÂNIA",
    "PIZZA EM ATÉ 3 MINUTOS",
    "A MELHOR COMIDA DA REGIÃO",
    "DELIVERY & RETIRADA NO BALCÃO",
  ];
  const strip = [...items, ...items];
  return (
    <div className="border-y border-white/10 bg-surface2 py-3.5 overflow-hidden select-none">
      <div className="fn-mq text-xs font-extrabold uppercase tracking-widest text-ember flex items-center gap-10">
        {[...strip, ...strip].map((t, i) => (
          <span key={i} className="flex items-center gap-10">
            <span className={i % 2 === 0 ? "text-white" : ""}>{t}</span>
            <span>•</span>
          </span>
        ))}
      </div>
    </div>
  );
}

export function ScrollHint() {
  return <ArrowRight className="w-3.5 h-3.5" />;
}
