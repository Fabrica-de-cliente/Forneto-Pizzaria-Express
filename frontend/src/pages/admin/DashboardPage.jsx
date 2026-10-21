import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, apiError } from "@/lib/api";
import { brl } from "@/lib/format";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Flame, LogOut, Pencil, Plus, Trash2 } from "lucide-react";

const EMPTY_ITEM = {
  name: "", description: "", price: "", category_id: "", image_url: "",
  badge: "", price_from: false, available: true, sort_order: 0,
  flavors: [], max_flavors: 1,
};
const EMPTY_CAT = { name: "", group: "pizzas", sort_order: 0, active: true };
const EMPTY_ADDON = { name: "", price: "", active: true };
const EMPTY_ZONE = { neighborhood: "", fee: "", active: true };

const flavorsToText = (fl) =>
  (fl || [])
    .map((f) => (f.price != null ? `${f.name} = ${f.price.toFixed(2).replace(".", ",")}` : f.name))
    .join("\n");

const textToFlavors = (t) =>
  String(t)
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const parts = l.split("=");
      if (parts.length > 1) {
        const p = parseFloat(parts[parts.length - 1].trim().replace(",", "."));
        return { name: parts.slice(0, -1).join("=").trim(), price: isNaN(p) ? null : p };
      }
      return { name: l, price: null };
    });

const ORDER_STATUS = {
  novo: { label: "Novo", cls: "bg-amber-500/15 text-amber-400" },
  preparo: { label: "Em preparo", cls: "bg-blue-500/15 text-blue-400" },
  entrega: { label: "Saiu p/ entrega", cls: "bg-purple-500/15 text-purple-400" },
  concluido: { label: "Concluído", cls: "bg-green-500/15 text-green-400" },
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [settings, setSettings] = useState(null);
  const [addons, setAddons] = useState([]);
  const [zones, setZones] = useState([]);
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState(null);

  const [addonDialog, setAddonDialog] = useState(false);
  const [addonForm, setAddonForm] = useState(EMPTY_ADDON);
  const [editAddonId, setEditAddonId] = useState(null);

  const [zoneDialog, setZoneDialog] = useState(false);
  const [zoneForm, setZoneForm] = useState(EMPTY_ZONE);
  const [editZoneId, setEditZoneId] = useState(null);

  const [itemDialog, setItemDialog] = useState(false);
  const [itemForm, setItemForm] = useState(EMPTY_ITEM);
  const [editItemId, setEditItemId] = useState(null);

  const [catDialog, setCatDialog] = useState(false);
  const [catForm, setCatForm] = useState(EMPTY_CAT);
  const [editCatId, setEditCatId] = useState(null);

  const load = useCallback(async () => {
    try {
      const [cats, its, st, ads, zns, ords, sts] = await Promise.all([
        api.get("/admin/categories"),
        api.get("/admin/items"),
        api.get("/settings"),
        api.get("/admin/addons"),
        api.get("/admin/zones"),
        api.get("/admin/orders"),
        api.get("/admin/stats"),
      ]);
      setCategories(cats.data);
      setItems(its.data);
      setSettings(st.data);
      setAddons(ads.data);
      setZones(zns.data);
      setOrders(ords.data);
      setStats(sts.data);
    } catch (e) {
      if (e?.response?.status === 401) {
        localStorage.removeItem("forneto_token");
        navigate("/admin/login");
      } else {
        toast.error(apiError(e));
      }
    }
  }, [navigate]);

  useEffect(() => {
    if (!localStorage.getItem("forneto_token")) {
      navigate("/admin/login");
      return;
    }
    load().finally(() => setReady(true));
  }, [load, navigate]);

  // ----- items -----
  const openNewItem = () => {
    setEditItemId(null);
    setItemForm({ ...EMPTY_ITEM, category_id: categories[0]?.id || "" });
    setItemDialog(true);
  };
  const openEditItem = (item) => {
    setEditItemId(item.id);
    setItemForm({ ...EMPTY_ITEM, ...item, price: String(item.price) });
    setItemDialog(true);
  };
  const saveItem = async () => {
    const flavors = Array.isArray(itemForm.flavors)
      ? itemForm.flavors
      : textToFlavors(itemForm.flavors);
    const payload = {
      ...itemForm,
      flavors,
      max_flavors: parseInt(itemForm.max_flavors) || 1,
      price: parseFloat(String(itemForm.price).replace(",", ".")) || 0,
    };
    try {
      if (editItemId) await api.put(`/admin/items/${editItemId}`, payload);
      else await api.post("/admin/items", payload);
      toast.success(editItemId ? "Item atualizado" : "Item criado");
      setItemDialog(false);
      load();
    } catch (e) {
      toast.error(apiError(e));
    }
  };
  const deleteItem = async (id) => {
    if (!window.confirm("Excluir este item do cardápio?")) return;
    try {
      await api.delete(`/admin/items/${id}`);
      toast.success("Item excluído");
      load();
    } catch (e) {
      toast.error(apiError(e));
    }
  };

  // ----- categories -----
  const openNewCat = () => {
    setEditCatId(null);
    setCatForm(EMPTY_CAT);
    setCatDialog(true);
  };
  const openEditCat = (cat) => {
    setEditCatId(cat.id);
    setCatForm({ ...cat });
    setCatDialog(true);
  };
  const saveCat = async () => {
    try {
      if (editCatId) await api.put(`/admin/categories/${editCatId}`, catForm);
      else await api.post("/admin/categories", catForm);
      toast.success(editCatId ? "Categoria atualizada" : "Categoria criada");
      setCatDialog(false);
      load();
    } catch (e) {
      toast.error(apiError(e));
    }
  };
  const deleteCat = async (id) => {
    if (!window.confirm("Excluir esta categoria?")) return;
    try {
      await api.delete(`/admin/categories/${id}`);
      toast.success("Categoria excluída");
      load();
    } catch (e) {
      toast.error(apiError(e));
    }
  };

  // ----- settings -----
  const saveSettings = async () => {
    try {
      await api.put("/admin/settings", settings);
      toast.success("Configurações salvas");
    } catch (e) {
      toast.error(apiError(e));
    }
  };

  // ----- orders -----
  const setOrderStatus = async (id, status) => {
    try {
      await api.put(`/admin/orders/${id}`, { status });
      toast.success("Status atualizado");
      load();
    } catch (e) { toast.error(apiError(e)); }
  };

  // ----- addons -----
  const openNewAddon = () => { setEditAddonId(null); setAddonForm(EMPTY_ADDON); setAddonDialog(true); };
  const openEditAddon = (a) => { setEditAddonId(a.id); setAddonForm({ ...a, price: String(a.price) }); setAddonDialog(true); };
  const saveAddon = async () => {
    const payload = { ...addonForm, price: parseFloat(String(addonForm.price).replace(",", ".")) || 0 };
    try {
      if (editAddonId) await api.put(`/admin/addons/${editAddonId}`, payload);
      else await api.post("/admin/addons", payload);
      toast.success(editAddonId ? "Adicional atualizado" : "Adicional criado");
      setAddonDialog(false);
      load();
    } catch (e) { toast.error(apiError(e)); }
  };
  const deleteAddon = async (id) => {
    if (!window.confirm("Excluir este adicional?")) return;
    try { await api.delete(`/admin/addons/${id}`); toast.success("Adicional excluído"); load(); }
    catch (e) { toast.error(apiError(e)); }
  };

  // ----- zones -----
  const openNewZone = () => { setEditZoneId(null); setZoneForm(EMPTY_ZONE); setZoneDialog(true); };
  const openEditZone = (z) => { setEditZoneId(z.id); setZoneForm({ ...z, fee: String(z.fee) }); setZoneDialog(true); };
  const saveZone = async () => {
    const payload = { ...zoneForm, fee: parseFloat(String(zoneForm.fee).replace(",", ".")) || 0 };
    try {
      if (editZoneId) await api.put(`/admin/zones/${editZoneId}`, payload);
      else await api.post("/admin/zones", payload);
      toast.success(editZoneId ? "Bairro atualizado" : "Bairro criado");
      setZoneDialog(false);
      load();
    } catch (e) { toast.error(apiError(e)); }
  };
  const deleteZone = async (id) => {
    if (!window.confirm("Excluir este bairro?")) return;
    try { await api.delete(`/admin/zones/${id}`); toast.success("Bairro excluído"); load(); }
    catch (e) { toast.error(apiError(e)); }
  };

  if (!ready || !settings) {
    return (
      <div className="min-h-screen bg-ink flex items-center justify-center" data-testid="dashboard-loading">
        <span className="mono-badge text-xs uppercase tracking-widest text-ember font-bold animate-pulse">Carregando...</span>
      </div>
    );
  }

  const catName = (id) => categories.find((c) => c.id === id)?.name || "—";

  return (
    <div className="min-h-screen bg-ink text-cream" data-testid="admin-dashboard">
      <header className="border-b border-white/10 bg-surface2/60 backdrop-blur sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-ember flex items-center justify-center">
              <Flame className="w-4 h-4 text-white" />
            </div>
            <span className="font-display font-extrabold text-white">FORNETO <span className="text-ember">DASHBOARD</span></span>
          </div>
          <div className="flex items-center gap-2">
            <a href="/" data-testid="view-menu-link" className="text-xs text-smoke hover:text-white transition-colors mr-2">
              Ver cardápio
            </a>
            <Button
              data-testid="logout-button"
              variant="outline"
              size="sm"
              onClick={() => { localStorage.removeItem("forneto_token"); navigate("/admin/login"); }}
              className="border-white/10 bg-transparent text-cream hover:bg-white/10 hover:text-white"
            >
              <LogOut className="w-3.5 h-3.5 mr-1" /> Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <Tabs defaultValue="items">
          <TabsList className="bg-surface2 border border-white/10">
            <TabsTrigger data-testid="tab-orders" value="orders">Pedidos</TabsTrigger>
            <TabsTrigger data-testid="tab-items" value="items">Itens do Cardápio</TabsTrigger>
            <TabsTrigger data-testid="tab-categories" value="categories">Categorias</TabsTrigger>
            <TabsTrigger data-testid="tab-addons" value="addons">Bordas & Adicionais</TabsTrigger>
            <TabsTrigger data-testid="tab-zones" value="zones">Taxas de Entrega</TabsTrigger>
            <TabsTrigger data-testid="tab-settings" value="settings">Configurações</TabsTrigger>
          </TabsList>

          {/* ORDERS */}
          <TabsContent value="orders" className="mt-6">
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6" data-testid="sales-summary">
                <div className="bg-surface2 border border-white/10 rounded-2xl p-5">
                  <span className="mono-badge text-[10px] font-bold uppercase tracking-widest text-ember block mb-1">Vendido hoje</span>
                  <p className="font-display text-3xl font-black text-white" data-testid="stats-today-total">{brl(stats.today_total)}</p>
                  <p className="text-[11px] text-smoke mt-1" data-testid="stats-today-count">
                    {stats.today_count} {stats.today_count === 1 ? "pedido" : "pedidos"} hoje
                  </p>
                </div>
                <div className="bg-surface2 border border-white/10 rounded-2xl p-5">
                  <span className="mono-badge text-[10px] font-bold uppercase tracking-widest text-ember block mb-1">Total acumulado</span>
                  <p className="font-display text-3xl font-black text-white" data-testid="stats-all-total">{brl(stats.all_total)}</p>
                  <p className="text-[11px] text-smoke mt-1">{orders.length} pedidos no total</p>
                </div>
                <div className="bg-surface2 border border-white/10 rounded-2xl p-5">
                  <span className="mono-badge text-[10px] font-bold uppercase tracking-widest text-ember block mb-2">Sabores mais pedidos</span>
                  {stats.top_flavors.length === 0 && (
                    <p className="text-[11px] text-smoke" data-testid="stats-no-flavors">Sem sabores registrados ainda.</p>
                  )}
                  <ul className="space-y-1" data-testid="stats-top-flavors">
                    {stats.top_flavors.map((f, i) => (
                      <li key={f.name} className="flex justify-between text-[11px]">
                        <span className="text-cream font-bold">{i + 1}. {f.name}</span>
                        <span className="mono-badge text-ember font-bold">{f.qty}x</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
            <div className="flex justify-between items-center mb-4">
              <p className="text-xs text-smoke">{orders.length} pedidos recebidos via WhatsApp</p>
              <Button data-testid="refresh-orders-button" variant="outline" onClick={load} className="border-white/10 bg-transparent text-cream hover:bg-white/10 hover:text-white">
                Atualizar
              </Button>
            </div>
            {orders.length === 0 && (
              <p className="text-xs text-smoke bg-surface2 border border-white/10 rounded-xl p-4" data-testid="orders-empty">
                Nenhum pedido ainda. Quando um cliente enviar o pedido pelo cardápio, ele aparece aqui.
              </p>
            )}
            <div className="space-y-3">
              {orders.map((o) => (
                <div key={o.id} data-testid={`admin-order-${o.id}`} className="bg-surface2 border border-white/10 rounded-xl p-4">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div>
                      <p className="text-sm font-bold text-white">
                        {o.customer_name || "Cliente"} · <span className="mono-badge text-ember">{brl(o.total)}</span>
                      </p>
                      <p className="text-[11px] text-smoke">
                        {new Date(o.created_at).toLocaleString("pt-BR")} · {o.mode === "entrega" ? `Entrega${o.neighborhood ? ` — ${o.neighborhood}` : ""}` : "Retirada"}
                        {o.payment && ` · ${o.payment}${o.change_for ? ` (troco p/ ${brl(o.change_for)})` : ""}`}
                      </p>
                    </div>
                    <Select value={o.status} onValueChange={(v) => setOrderStatus(o.id, v)}>
                      <SelectTrigger data-testid={`order-status-${o.id}`} className={`w-44 border-white/10 text-xs font-bold ${ORDER_STATUS[o.status]?.cls || ""} bg-card2`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-surface2 border-white/10 text-cream">
                        {Object.entries(ORDER_STATUS).map(([v, s]) => (
                          <SelectItem key={v} value={v}>{s.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <ul className="mt-3 space-y-1 border-t border-white/10 pt-3">
                    {o.lines.map((l, i) => (
                      <li key={i} className="text-[11px] text-ash">
                        <span className="text-white font-bold">{l.qty}x</span> {l.name}
                        {l.variant && <span className="text-ember"> ({l.variant})</span>}
                        {l.addons.map((a, j) => (
                          <span key={j} className="text-smoke"> · + {a}</span>
                        ))}
                        <span className="text-smoke"> — {brl(l.unit_price * l.qty)}</span>
                      </li>
                    ))}
                    {o.fee > 0 && <li className="text-[11px] text-smoke">Taxa de entrega — {brl(o.fee)}</li>}
                  </ul>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* ITEMS */}
          <TabsContent value="items" className="mt-6">
            <div className="flex justify-between items-center mb-4">
              <p className="text-xs text-smoke">{items.length} itens cadastrados</p>
              <Button data-testid="new-item-button" onClick={openNewItem} className="bg-ember hover:bg-ember-dark text-white">
                <Plus className="w-4 h-4 mr-1" /> Novo Item
              </Button>
            </div>
            <div className="space-y-2">
              {items.map((item) => (
                <div
                  key={item.id}
                  data-testid={`admin-item-${item.id}`}
                  className="flex items-center gap-4 bg-surface2 border border-white/10 rounded-xl p-3"
                >
                  {item.image_url ? (
                    <img src={item.image_url} alt="" className="w-12 h-12 rounded-lg object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-card2 flex items-center justify-center">
                      <Flame className="w-4 h-4 text-ember/60" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate">{item.name}</p>
                    <p className="text-[11px] text-smoke">{catName(item.category_id)}</p>
                  </div>
                  <span className="mono-badge text-sm font-bold text-ember whitespace-nowrap">
                    {item.price_from && "a partir de "}{brl(item.price)}
                  </span>
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${item.available ? "bg-green-500/15 text-green-400" : "bg-red-500/15 text-red-400"}`}>
                    {item.available ? "Ativo" : "Oculto"}
                  </span>
                  <Button data-testid={`edit-item-${item.id}`} size="icon" variant="ghost" onClick={() => openEditItem(item)} className="text-smoke hover:text-white">
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button data-testid={`delete-item-${item.id}`} size="icon" variant="ghost" onClick={() => deleteItem(item.id)} className="text-red-400 hover:text-red-300">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* CATEGORIES */}
          <TabsContent value="categories" className="mt-6">
            <div className="flex justify-between items-center mb-4">
              <p className="text-xs text-smoke">{categories.length} categorias</p>
              <Button data-testid="new-category-button" onClick={openNewCat} className="bg-ember hover:bg-ember-dark text-white">
                <Plus className="w-4 h-4 mr-1" /> Nova Categoria
              </Button>
            </div>
            <div className="space-y-2">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  data-testid={`admin-category-${cat.id}`}
                  className="flex items-center gap-4 bg-surface2 border border-white/10 rounded-xl p-4"
                >
                  <div className="flex-1">
                    <p className="text-sm font-bold text-white">{cat.name}</p>
                    <p className="text-[11px] text-smoke">
                      {cat.group === "bebidas" ? "Bebidas" : "Pizzas"} · ordem {cat.sort_order} · {cat.active ? "Ativa" : "Oculta"}
                    </p>
                  </div>
                  <Button data-testid={`edit-category-${cat.id}`} size="icon" variant="ghost" onClick={() => openEditCat(cat)} className="text-smoke hover:text-white">
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button data-testid={`delete-category-${cat.id}`} size="icon" variant="ghost" onClick={() => deleteCat(cat.id)} className="text-red-400 hover:text-red-300">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* ADDONS */}
          <TabsContent value="addons" className="mt-6">
            <div className="flex justify-between items-center mb-4">
              <p className="text-xs text-smoke">{addons.length} adicionais (bordas recheadas, extras)</p>
              <Button data-testid="new-addon-button" onClick={openNewAddon} className="bg-ember hover:bg-ember-dark text-white">
                <Plus className="w-4 h-4 mr-1" /> Novo Adicional
              </Button>
            </div>
            {addons.length === 0 && (
              <p className="text-xs text-smoke bg-surface2 border border-white/10 rounded-xl p-4" data-testid="addons-empty">
                Nenhum adicional cadastrado. Ex: Borda Recheada de Catupiry — R$ 10,00.
              </p>
            )}
            <div className="space-y-2">
              {addons.map((a) => (
                <div key={a.id} data-testid={`admin-addon-${a.id}`} className="flex items-center gap-4 bg-surface2 border border-white/10 rounded-xl p-4">
                  <div className="flex-1">
                    <p className="text-sm font-bold text-white">{a.name}</p>
                    <p className="text-[11px] text-smoke">{a.active ? "Ativo" : "Oculto"}</p>
                  </div>
                  <span className="mono-badge text-sm font-bold text-ember">+ {brl(a.price)}</span>
                  <Button data-testid={`edit-addon-${a.id}`} size="icon" variant="ghost" onClick={() => openEditAddon(a)} className="text-smoke hover:text-white">
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button data-testid={`delete-addon-${a.id}`} size="icon" variant="ghost" onClick={() => deleteAddon(a.id)} className="text-red-400 hover:text-red-300">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* DELIVERY ZONES */}
          <TabsContent value="zones" className="mt-6">
            <div className="flex justify-between items-center mb-4">
              <p className="text-xs text-smoke">{zones.length} bairros com taxa cadastrada</p>
              <Button data-testid="new-zone-button" onClick={openNewZone} className="bg-ember hover:bg-ember-dark text-white">
                <Plus className="w-4 h-4 mr-1" /> Novo Bairro
              </Button>
            </div>
            {zones.length === 0 && (
              <p className="text-xs text-smoke bg-surface2 border border-white/10 rounded-xl p-4" data-testid="zones-empty">
                Nenhum bairro cadastrado. Cadastre os bairros atendidos e a taxa de cada um — o cliente escolhe o bairro na sacola e a taxa entra no total.
              </p>
            )}
            <div className="space-y-2">
              {zones.map((z) => (
                <div key={z.id} data-testid={`admin-zone-${z.id}`} className="flex items-center gap-4 bg-surface2 border border-white/10 rounded-xl p-4">
                  <div className="flex-1">
                    <p className="text-sm font-bold text-white">{z.neighborhood}</p>
                    <p className="text-[11px] text-smoke">{z.active ? "Ativo" : "Oculto"}</p>
                  </div>
                  <span className="mono-badge text-sm font-bold text-ember">{brl(z.fee)}</span>
                  <Button data-testid={`edit-zone-${z.id}`} size="icon" variant="ghost" onClick={() => openEditZone(z)} className="text-smoke hover:text-white">
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button data-testid={`delete-zone-${z.id}`} size="icon" variant="ghost" onClick={() => deleteZone(z.id)} className="text-red-400 hover:text-red-300">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* SETTINGS */}
          <TabsContent value="settings" className="mt-6">
            <div className="bg-surface2 border border-white/10 rounded-2xl p-6 max-w-xl space-y-4">
              {[
                ["store_name", "Nome da loja"],
                ["tagline", "Slogan"],
                ["hero_claim", "Frase principal (hero)"],
                ["whatsapp_number", "WhatsApp (somente números, com DDD e país — ex: 5562...)"],
                ["address", "Endereço"],
                ["neighborhood", "Bairro"],
                ["city", "Cidade"],
                ["hours_text", "Atendimento (ex: Entrega e Retirada)"],
              ].map(([key, label]) => (
                <div key={key}>
                  <Label htmlFor={`set-${key}`} className="text-[11px] font-bold uppercase tracking-widest text-smoke">{label}</Label>
                  <Input
                    id={`set-${key}`}
                    data-testid={`settings-${key}-input`}
                    value={settings[key] || ""}
                    onChange={(e) => setSettings({ ...settings, [key]: e.target.value })}
                    className="mt-1.5 bg-card2 border-white/10 text-white"
                  />
                </div>
              ))}
              <label className="flex items-center gap-2 text-xs text-smoke py-2">
                <Switch
                  data-testid="settings-isopen-switch"
                  checked={settings.is_open !== false}
                  onCheckedChange={(v) => setSettings({ ...settings, is_open: v })}
                />
                Loja aberta agora (desative quando fechada)
              </label>
              <Button data-testid="save-settings-button" onClick={saveSettings} className="bg-ember hover:bg-ember-dark text-white w-full">
                Salvar Configurações
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* ITEM DIALOG */}
      <Dialog open={itemDialog} onOpenChange={setItemDialog}>
        <DialogContent className="bg-surface2 border-white/10 text-cream max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white">{editItemId ? "Editar Item" : "Novo Item"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-[11px] uppercase tracking-widest text-smoke">Nome</Label>
              <Input data-testid="item-name-input" value={itemForm.name} onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })} className="mt-1 bg-card2 border-white/10 text-white" />
            </div>
            <div>
              <Label className="text-[11px] uppercase tracking-widest text-smoke">Descrição</Label>
              <Textarea data-testid="item-description-input" value={itemForm.description} onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })} className="mt-1 bg-card2 border-white/10 text-white" rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-[11px] uppercase tracking-widest text-smoke">Preço (R$)</Label>
                <Input data-testid="item-price-input" value={itemForm.price} onChange={(e) => setItemForm({ ...itemForm, price: e.target.value })} className="mt-1 bg-card2 border-white/10 text-white" placeholder="0,00" />
              </div>
              <div>
                <Label className="text-[11px] uppercase tracking-widest text-smoke">Categoria</Label>
                <Select value={itemForm.category_id} onValueChange={(v) => setItemForm({ ...itemForm, category_id: v })}>
                  <SelectTrigger data-testid="item-category-select" className="mt-1 bg-card2 border-white/10 text-white">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent className="bg-surface2 border-white/10 text-cream">
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-[11px] uppercase tracking-widest text-smoke">URL da foto</Label>
              <Input data-testid="item-image-input" value={itemForm.image_url} onChange={(e) => setItemForm({ ...itemForm, image_url: e.target.value })} className="mt-1 bg-card2 border-white/10 text-white" placeholder="https://..." />
            </div>
            <div>
              <Label className="text-[11px] uppercase tracking-widest text-smoke">Selo (opcional — ex: Top Pedido)</Label>
              <Input data-testid="item-badge-input" value={itemForm.badge} onChange={(e) => setItemForm({ ...itemForm, badge: e.target.value })} className="mt-1 bg-card2 border-white/10 text-white" />
            </div>
            <div>
              <Label className="text-[11px] uppercase tracking-widest text-smoke">Sabores — um por linha; preço próprio opcional: "4 Queijos = 50,00"</Label>
              <Textarea
                data-testid="item-flavors-input"
                value={Array.isArray(itemForm.flavors) ? flavorsToText(itemForm.flavors) : itemForm.flavors}
                onChange={(e) => setItemForm({ ...itemForm, flavors: e.target.value })}
                className="mt-1 bg-card2 border-white/10 text-white"
                rows={4}
                placeholder={"Calabresa\nFrango com Catupiry = 45,00\n4 Queijos = 50,00"}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-[11px] uppercase tracking-widest text-smoke">Qtd. de sabores (1 ou 2 p/ meio a meio)</Label>
                <Input data-testid="item-maxflavors-input" type="number" min="1" max="2" value={itemForm.max_flavors} onChange={(e) => setItemForm({ ...itemForm, max_flavors: e.target.value })} className="mt-1 bg-card2 border-white/10 text-white" />
              </div>
            </div>
            <div className="flex items-center gap-6 pt-1">
              <label className="flex items-center gap-2 text-xs text-smoke">
                <Switch data-testid="item-pricefrom-switch" checked={itemForm.price_from} onCheckedChange={(v) => setItemForm({ ...itemForm, price_from: v })} />
                "A partir de"
              </label>
              <label className="flex items-center gap-2 text-xs text-smoke">
                <Switch data-testid="item-available-switch" checked={itemForm.available} onCheckedChange={(v) => setItemForm({ ...itemForm, available: v })} />
                Disponível no cardápio
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button data-testid="save-item-button" onClick={saveItem} className="bg-ember hover:bg-ember-dark text-white w-full">
              {editItemId ? "Salvar Alterações" : "Criar Item"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CATEGORY DIALOG */}
      <Dialog open={catDialog} onOpenChange={setCatDialog}>
        <DialogContent className="bg-surface2 border-white/10 text-cream max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">{editCatId ? "Editar Categoria" : "Nova Categoria"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-[11px] uppercase tracking-widest text-smoke">Nome</Label>
              <Input data-testid="category-name-input" value={catForm.name} onChange={(e) => setCatForm({ ...catForm, name: e.target.value })} className="mt-1 bg-card2 border-white/10 text-white" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-[11px] uppercase tracking-widest text-smoke">Seção</Label>
                <Select value={catForm.group} onValueChange={(v) => setCatForm({ ...catForm, group: v })}>
                  <SelectTrigger data-testid="category-group-select" className="mt-1 bg-card2 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-surface2 border-white/10 text-cream">
                    <SelectItem value="pizzas">Pizzas</SelectItem>
                    <SelectItem value="bebidas">Bebidas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[11px] uppercase tracking-widest text-smoke">Ordem</Label>
                <Input data-testid="category-order-input" type="number" value={catForm.sort_order} onChange={(e) => setCatForm({ ...catForm, sort_order: parseInt(e.target.value) || 0 })} className="mt-1 bg-card2 border-white/10 text-white" />
              </div>
            </div>
            <label className="flex items-center gap-2 text-xs text-smoke">
              <Switch data-testid="category-active-switch" checked={catForm.active} onCheckedChange={(v) => setCatForm({ ...catForm, active: v })} />
              Visível no cardápio
            </label>
          </div>
          <DialogFooter>
            <Button data-testid="save-category-button" onClick={saveCat} className="bg-ember hover:bg-ember-dark text-white w-full">
              {editCatId ? "Salvar Alterações" : "Criar Categoria"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* ADDON DIALOG */}
      <Dialog open={addonDialog} onOpenChange={setAddonDialog}>
        <DialogContent className="bg-surface2 border-white/10 text-cream max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">{editAddonId ? "Editar Adicional" : "Novo Adicional"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-[11px] uppercase tracking-widest text-smoke">Nome (ex: Borda Recheada de Catupiry)</Label>
              <Input data-testid="addon-name-input" value={addonForm.name} onChange={(e) => setAddonForm({ ...addonForm, name: e.target.value })} className="mt-1 bg-card2 border-white/10 text-white" />
            </div>
            <div>
              <Label className="text-[11px] uppercase tracking-widest text-smoke">Acréscimo (R$)</Label>
              <Input data-testid="addon-price-input" value={addonForm.price} onChange={(e) => setAddonForm({ ...addonForm, price: e.target.value })} className="mt-1 bg-card2 border-white/10 text-white" placeholder="0,00" />
            </div>
            <label className="flex items-center gap-2 text-xs text-smoke">
              <Switch data-testid="addon-active-switch" checked={addonForm.active} onCheckedChange={(v) => setAddonForm({ ...addonForm, active: v })} />
              Disponível no cardápio
            </label>
          </div>
          <DialogFooter>
            <Button data-testid="save-addon-button" onClick={saveAddon} className="bg-ember hover:bg-ember-dark text-white w-full">
              {editAddonId ? "Salvar Alterações" : "Criar Adicional"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ZONE DIALOG */}
      <Dialog open={zoneDialog} onOpenChange={setZoneDialog}>
        <DialogContent className="bg-surface2 border-white/10 text-cream max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">{editZoneId ? "Editar Bairro" : "Novo Bairro"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-[11px] uppercase tracking-widest text-smoke">Bairro</Label>
              <Input data-testid="zone-name-input" value={zoneForm.neighborhood} onChange={(e) => setZoneForm({ ...zoneForm, neighborhood: e.target.value })} className="mt-1 bg-card2 border-white/10 text-white" placeholder="Ex: Conjunto Vera Cruz" />
            </div>
            <div>
              <Label className="text-[11px] uppercase tracking-widest text-smoke">Taxa de entrega (R$)</Label>
              <Input data-testid="zone-fee-input" value={zoneForm.fee} onChange={(e) => setZoneForm({ ...zoneForm, fee: e.target.value })} className="mt-1 bg-card2 border-white/10 text-white" placeholder="0,00" />
            </div>
            <label className="flex items-center gap-2 text-xs text-smoke">
              <Switch data-testid="zone-active-switch" checked={zoneForm.active} onCheckedChange={(v) => setZoneForm({ ...zoneForm, active: v })} />
              Atendemos este bairro
            </label>
          </div>
          <DialogFooter>
            <Button data-testid="save-zone-button" onClick={saveZone} className="bg-ember hover:bg-ember-dark text-white w-full">
              {editZoneId ? "Salvar Alterações" : "Criar Bairro"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
