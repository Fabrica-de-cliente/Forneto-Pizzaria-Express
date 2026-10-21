import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { MenuNav, Marquee } from "@/components/menu/MenuNav";
import { PizzaCard, DrinkCard } from "@/components/menu/ItemCard";
import { CartDrawer } from "@/components/menu/CartDrawer";
import { MessageCircle, MapPin, Clock } from "lucide-react";
import { toast } from "sonner";

const HERO_IMG =
  "https://images.pexels.com/photos/29626981/pexels-photo-29626981.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940";

export default function MenuPage() {
  const [menu, setMenu] = useState({ categories: [], items: [] });
  const [settings, setSettings] = useState(null);
  const [cart, setCart] = useState({});
  const [cartOpen, setCartOpen] = useState(false);

  useEffect(() => {
    api.get("/menu").then((r) => setMenu(r.data)).catch(() => {});
    api.get("/settings").then((r) => setSettings(r.data)).catch(() => {});
  }, []);

  const addToCart = (item) => {
    setCart((c) => ({ ...c, [item.id]: (c[item.id] || 0) + 1 }));
    toast.success(`${item.name} adicionado ao pedido`);
  };
  const changeQty = (id, qty) =>
    setCart((c) => {
      const n = { ...c };
      if (qty <= 0) delete n[id];
      else n[id] = qty;
      return n;
    });
  const removeItem = (id) =>
    setCart((c) => {
      const n = { ...c };
      delete n[id];
      return n;
    });

  const cartCount = Object.values(cart).reduce((s, q) => s + q, 0);

  const { pizzaCats, drinkCats } = useMemo(() => {
    const cats = menu.categories;
    return {
      pizzaCats: cats.filter((c) => c.group === "pizzas"),
      drinkCats: cats.filter((c) => c.group === "bebidas"),
    };
  }, [menu]);

  const itemsOf = (catId) => menu.items.filter((i) => i.category_id === catId);

  if (!settings) {
    return (
      <div className="min-h-screen bg-ink flex items-center justify-center" data-testid="menu-loading">
        <span className="mono-badge text-xs uppercase tracking-widest text-ember font-bold animate-pulse">
          Forneto Pizzaria Express
        </span>
      </div>
    );
  }

  return (
    <div className="bg-ink text-cream min-h-screen selection:bg-ember selection:text-white font-display" data-testid="menu-page">
      <MenuNav settings={settings} cartCount={cartCount} onOpenCart={() => setCartOpen(true)} />

      {/* HERO */}
      <section className="py-16 md:py-24 px-6 max-w-6xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-ember/20 border border-ember/30 text-ember text-xs font-bold uppercase tracking-widest mb-6">
          <span>★ Unidade Goiânia</span>
          <span className="text-white/40">·</span>
          <span>{settings.neighborhood}</span>
        </div>

        <h1 className="text-5xl md:text-7xl lg:text-8xl font-black uppercase tracking-tight text-white leading-[0.95] mb-8">
          <span className="fn-ln"><span>Pizza no Forno</span></span>
          <span className="fn-ln"><span className="text-ember">Pronta em</span></span>
          <span className="fn-ln"><span>3 Minutos</span></span>
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end mb-12">
          <div className="lg:col-span-8">
            <p className="text-lg md:text-xl text-ash leading-relaxed max-w-2xl">
              {settings.tagline}, assada no forno contínuo de alta precisão. Peça online e receba rápido em casa ou retire no balcão.
            </p>
          </div>
          <div className="lg:col-span-4 flex gap-3">
            <a
              href="#cardapio"
              data-testid="hero-menu-button"
              className="flex-1 text-center bg-white text-ink hover:bg-ember hover:text-white py-3.5 rounded-xl font-bold uppercase text-xs tracking-wider transition-colors"
            >
              Ver Cardápio
            </a>
            <button
              type="button"
              data-testid="hero-whatsapp-button"
              onClick={() => setCartOpen(true)}
              className="flex-1 text-center bg-ember text-white py-3.5 rounded-xl font-bold uppercase text-xs tracking-wider transition-colors"
            >
              WhatsApp
            </button>
          </div>
        </div>

        <div className="w-full h-80 md:h-[440px] rounded-3xl overflow-hidden relative border border-white/10 shadow-2xl">
          <img src={HERO_IMG} alt="Pizza assando no forno a lenha" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-transparent to-transparent" />
          <div className="absolute bottom-6 left-6 right-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <span className="mono-badge text-[11px] uppercase tracking-widest text-amber-400 font-bold">
                Tecnologia Forneto Express
              </span>
              <p className="text-2xl font-black text-white mt-1">Alta velocidade e padrão gastronômico rigoroso.</p>
            </div>
            <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 text-xs font-bold text-white mono-badge">
              Forno Contínuo: 3 Minutos
            </div>
          </div>
        </div>
      </section>

      <Marquee />

      {/* MENU — PIZZAS */}
      <section id="cardapio" className="py-24 px-6 max-w-6xl mx-auto scroll-mt-20">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div>
            <span className="mono-badge text-xs font-bold uppercase tracking-widest text-ember">Cardápio Digital</span>
            <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tight mt-1 text-white">Nossas Pizzas</h2>
          </div>
          <p className="text-smoke text-xs max-w-xs">
            Escolha seus sabores favoritos e envie direto para o atendente do WhatsApp.
          </p>
        </div>

        {pizzaCats.map((cat) => (
          <div key={cat.id} className="mb-14" data-testid={`category-${cat.id}`}>
            <h3 className="mono-badge text-xs font-bold uppercase tracking-widest text-ash border-l-4 border-ember pl-3 mb-6">
              {cat.name}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {itemsOf(cat.id).map((item) => (
                <PizzaCard key={item.id} item={item} onAdd={addToCart} />
              ))}
            </div>
          </div>
        ))}
      </section>

      {/* DRINKS */}
      <section id="bebidas" className="py-16 bg-surface3 border-y border-white/10 scroll-mt-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
            <div>
              <span className="mono-badge text-xs font-bold uppercase tracking-widest text-ember">Bebidas & Refrigerantes</span>
              <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-white mt-1">Bebidas Geladas</h2>
            </div>
            <p className="text-smoke text-xs max-w-xs">
              Sucos e refrigerantes na temperatura certa para acompanhar seu pedido.
            </p>
          </div>

          {drinkCats.map((cat) => (
            <div key={cat.id} className="mb-10" data-testid={`category-${cat.id}`}>
              <h3 className="mono-badge text-xs font-bold uppercase tracking-widest text-ash border-l-4 border-ember pl-3 mb-5">
                {cat.name}
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {itemsOf(cat.id).map((item) => (
                  <DrinkCard key={item.id} item={item} onAdd={addToCart} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* LOCATION + WHATSAPP CTA */}
      <section id="onde-estamos" className="py-20 px-6 max-w-6xl mx-auto scroll-mt-20">
        <div className="bg-surface2 border border-white/10 p-8 md:p-12 rounded-3xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7">
            <span className="mono-badge text-xs font-bold text-ember uppercase tracking-widest block mb-2">
              Unidade {settings.neighborhood}
            </span>
            <h2 className="text-3xl md:text-4xl font-black uppercase text-white mb-4">Peça agora no WhatsApp</h2>
            <p className="text-xs text-smoke leading-relaxed mb-6 flex items-start gap-2">
              <MapPin className="w-4 h-4 text-ember shrink-0 mt-0.5" />
              {settings.address}, {settings.neighborhood}, {settings.city}. Atendimento ágil para entrega rápida e retirada imediata no balcão.
            </p>
            <p className="text-xs text-smoke leading-relaxed mb-6 flex items-center gap-2">
              <Clock className="w-4 h-4 text-ember shrink-0" />
              {settings.hours_text}
            </p>
            <button
              type="button"
              data-testid="location-whatsapp-button"
              onClick={() => setCartOpen(true)}
              className="inline-flex items-center gap-2 bg-ember hover:bg-ember-dark text-white px-7 py-3.5 rounded-xl font-bold uppercase text-xs tracking-wider transition-colors shadow-lg"
            >
              <MessageCircle className="w-4 h-4" />
              Concluir Pedido no WhatsApp
            </button>
          </div>
          <div className="lg:col-span-5 bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
            <span className="mono-badge text-[10px] text-ember uppercase tracking-widest block mb-2">
              Depoimentos dos Clientes
            </span>
            <div className="text-amber-400 text-base mb-2">★★★★★</div>
            <p className="text-xs text-smoke italic">
              Os depoimentos dos clientes da Forneto Pizzaria Express em Goiânia serão exibidos aqui.
            </p>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/10 bg-ink py-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-smoke">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-white">FORNETO PIZZARIA EXPRESS</span>
            <span>• Goiânia / GO</span>
          </div>
          <a
            href="/admin/login"
            data-testid="admin-link"
            className="mono-badge text-[11px] hover:text-ember transition-colors"
          >
            Dashboard da Equipe: Controle de Estoque & Cardápio
          </a>
          <p>© 2026 Forneto Pizzaria Express. Todos os direitos reservados.</p>
        </div>
      </footer>

      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        cart={cart}
        items={menu.items}
        onChangeQty={changeQty}
        onRemove={removeItem}
        settings={settings}
      />
    </div>
  );
}
