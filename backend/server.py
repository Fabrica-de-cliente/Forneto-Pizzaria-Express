from dotenv import load_dotenv
from pathlib import Path

load_dotenv(Path(__file__).parent / ".env")

import logging
import os
import uuid
from datetime import datetime, timedelta, timezone
from typing import List, Optional

import bcrypt
import jwt
from fastapi import APIRouter, Depends, FastAPI, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field
from starlette.middleware.cors import CORSMiddleware

# MongoDB connection
mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

JWT_SECRET = os.environ["JWT_SECRET"]
JWT_ALGORITHM = "HS256"

app = FastAPI()
api_router = APIRouter(prefix="/api")
security = HTTPBearer(auto_error=False)

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)


# ---------- Auth helpers ----------
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


def create_token(email: str) -> str:
    payload = {
        "sub": email,
        "exp": datetime.now(timezone.utc) + timedelta(hours=12),
        "type": "access",
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


async def get_admin(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    if not credentials:
        raise HTTPException(status_code=401, detail="Não autenticado")
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Sessão expirada")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token inválido")
    user = await db.users.find_one({"email": payload["sub"]}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Usuário não encontrado")
    return user


# ---------- Models ----------
class CategoryIn(BaseModel):
    name: str
    group: str = "pizzas"  # pizzas | bebidas
    sort_order: int = 0
    active: bool = True


class Category(CategoryIn):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))


class MenuItemIn(BaseModel):
    category_id: str
    name: str
    description: str = ""
    price: float
    price_from: bool = False
    image_url: str = ""
    badge: str = ""
    flavors: List[str] = []
    max_flavors: int = 1
    sort_order: int = 0
    available: bool = True


class MenuItem(MenuItemIn):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))


class Settings(BaseModel):
    id: str = "store"
    store_name: str = "Forneto Pizzaria Express"
    tagline: str = "A melhor comida da região"
    hero_claim: str = "Pizza no forno pronta em 3 minutos"
    whatsapp_number: str = "556296132571"
    address: str = "Av. Gercina Borges Teixeira, 1014"
    neighborhood: str = "Conjunto Vera Cruz"
    city: str = "Goiânia - GO"
    hours_text: str = "Entrega e Retirada"
    is_open: bool = True


class AddonIn(BaseModel):
    name: str
    price: float
    active: bool = True


class Addon(AddonIn):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))


class ZoneIn(BaseModel):
    neighborhood: str
    fee: float
    active: bool = True


class Zone(ZoneIn):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))


class LoginIn(BaseModel):
    email: str
    password: str


# ---------- Public endpoints ----------
@api_router.get("/")
async def root():
    return {"message": "Forneto Pizzaria Express API"}


@api_router.get("/menu")
async def get_menu():
    categories = await db.categories.find({"active": True}, {"_id": 0}).sort("sort_order", 1).to_list(100)
    items = await db.items.find({"available": True}, {"_id": 0}).sort("sort_order", 1).to_list(500)
    addons = await db.addons.find({"active": True}, {"_id": 0}).to_list(100)
    zones = await db.delivery_zones.find({"active": True}, {"_id": 0}).sort("neighborhood", 1).to_list(200)
    return {"categories": categories, "items": items, "addons": addons, "zones": zones}


@api_router.get("/settings")
async def get_settings():
    doc = await db.settings.find_one({"id": "store"}, {"_id": 0})
    return doc or Settings().model_dump()


# ---------- Auth endpoints ----------
@api_router.post("/auth/login")
async def login(body: LoginIn):
    email = body.email.strip().lower()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(body.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="E-mail ou senha incorretos")
    return {"access_token": create_token(email), "user": {"email": email, "name": user.get("name", "Admin")}}


@api_router.get("/auth/me")
async def me(admin=Depends(get_admin)):
    return admin


# ---------- Admin: categories ----------
@api_router.get("/admin/categories", response_model=List[Category])
async def admin_list_categories(admin=Depends(get_admin)):
    return await db.categories.find({}, {"_id": 0}).sort("sort_order", 1).to_list(200)


@api_router.post("/admin/categories", response_model=Category)
async def admin_create_category(body: CategoryIn, admin=Depends(get_admin)):
    cat = Category(**body.model_dump())
    await db.categories.insert_one(cat.model_dump())
    return cat


@api_router.put("/admin/categories/{cat_id}", response_model=Category)
async def admin_update_category(cat_id: str, body: CategoryIn, admin=Depends(get_admin)):
    res = await db.categories.update_one({"id": cat_id}, {"$set": body.model_dump()})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Categoria não encontrada")
    return await db.categories.find_one({"id": cat_id}, {"_id": 0})


@api_router.delete("/admin/categories/{cat_id}")
async def admin_delete_category(cat_id: str, admin=Depends(get_admin)):
    count = await db.items.count_documents({"category_id": cat_id})
    if count:
        raise HTTPException(status_code=400, detail="Categoria possui itens. Remova os itens primeiro.")
    await db.categories.delete_one({"id": cat_id})
    return {"ok": True}


# ---------- Admin: items ----------
@api_router.get("/admin/items", response_model=List[MenuItem])
async def admin_list_items(admin=Depends(get_admin)):
    return await db.items.find({}, {"_id": 0}).sort("sort_order", 1).to_list(500)


@api_router.post("/admin/items", response_model=MenuItem)
async def admin_create_item(body: MenuItemIn, admin=Depends(get_admin)):
    if not await db.categories.find_one({"id": body.category_id}):
        raise HTTPException(status_code=400, detail="Categoria inválida")
    item = MenuItem(**body.model_dump())
    await db.items.insert_one(item.model_dump())
    return item


@api_router.put("/admin/items/{item_id}", response_model=MenuItem)
async def admin_update_item(item_id: str, body: MenuItemIn, admin=Depends(get_admin)):
    res = await db.items.update_one({"id": item_id}, {"$set": body.model_dump()})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Item não encontrado")
    return await db.items.find_one({"id": item_id}, {"_id": 0})


@api_router.delete("/admin/items/{item_id}")
async def admin_delete_item(item_id: str, admin=Depends(get_admin)):
    await db.items.delete_one({"id": item_id})
    return {"ok": True}


# ---------- Admin: add-ons (bordas, extras) ----------
@api_router.get("/admin/addons", response_model=List[Addon])
async def admin_list_addons(admin=Depends(get_admin)):
    return await db.addons.find({}, {"_id": 0}).to_list(100)


@api_router.post("/admin/addons", response_model=Addon)
async def admin_create_addon(body: AddonIn, admin=Depends(get_admin)):
    addon = Addon(**body.model_dump())
    await db.addons.insert_one(addon.model_dump())
    return addon


@api_router.put("/admin/addons/{addon_id}", response_model=Addon)
async def admin_update_addon(addon_id: str, body: AddonIn, admin=Depends(get_admin)):
    res = await db.addons.update_one({"id": addon_id}, {"$set": body.model_dump()})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Adicional não encontrado")
    return await db.addons.find_one({"id": addon_id}, {"_id": 0})


@api_router.delete("/admin/addons/{addon_id}")
async def admin_delete_addon(addon_id: str, admin=Depends(get_admin)):
    await db.addons.delete_one({"id": addon_id})
    return {"ok": True}


# ---------- Admin: delivery zones (taxa por bairro) ----------
@api_router.get("/admin/zones", response_model=List[Zone])
async def admin_list_zones(admin=Depends(get_admin)):
    return await db.delivery_zones.find({}, {"_id": 0}).sort("neighborhood", 1).to_list(200)


@api_router.post("/admin/zones", response_model=Zone)
async def admin_create_zone(body: ZoneIn, admin=Depends(get_admin)):
    zone = Zone(**body.model_dump())
    await db.delivery_zones.insert_one(zone.model_dump())
    return zone


@api_router.put("/admin/zones/{zone_id}", response_model=Zone)
async def admin_update_zone(zone_id: str, body: ZoneIn, admin=Depends(get_admin)):
    res = await db.delivery_zones.update_one({"id": zone_id}, {"$set": body.model_dump()})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Bairro não encontrado")
    return await db.delivery_zones.find_one({"id": zone_id}, {"_id": 0})


@api_router.delete("/admin/zones/{zone_id}")
async def admin_delete_zone(zone_id: str, admin=Depends(get_admin)):
    await db.delivery_zones.delete_one({"id": zone_id})
    return {"ok": True}


# ---------- Admin: settings ----------
@api_router.put("/admin/settings", response_model=Settings)
async def admin_update_settings(body: Settings, admin=Depends(get_admin)):
    data = body.model_dump()
    data["id"] = "store"
    data["whatsapp_number"] = "".join(c for c in data["whatsapp_number"] if c.isdigit())
    await db.settings.update_one({"id": "store"}, {"$set": data}, upsert=True)
    return data


# ---------- Seed ----------
SAIPOS = "https://static.saipos.com/saipos-estatico/img-items/57581/store_item/"
SEED_CATEGORIES = [
    {"name": "Mais Pedidos", "group": "pizzas", "sort_order": 1},
    {"name": "Pizza-X", "group": "pizzas", "sort_order": 2},
    {"name": "Pizzas Salgadas", "group": "pizzas", "sort_order": 3},
    {"name": "Meio a Meio (2 Sabores)", "group": "pizzas", "sort_order": 4},
    {"name": "Pizzas Doces", "group": "pizzas", "sort_order": 5},
    {"name": "Refrigerantes", "group": "bebidas", "sort_order": 6},
    {"name": "Sucos", "group": "bebidas", "sort_order": 7},
    {"name": "Águas", "group": "bebidas", "sort_order": 8},
]

SEED_ITEMS = [
    # Mais Pedidos
    {"cat": 0, "name": "1 Calabresa G + 1 Chocolate P + Guaraná 2L", "description": "Combo completo: pizza de calabresa grande, pizza doce de chocolate pequena e guaraná 2L gelado.", "price": 58.99, "badge": "Top Pedido", "image_url": "https://images.pexels.com/photos/30343607/pexels-photo-30343607.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940", "sort_order": 1},
    {"cat": 0, "name": "2 Calabresas G + 1 Coca-Cola 2L", "description": "Duas pizzas grandes de calabresa com cebola e uma Coca-Cola 2L.", "price": 74.99, "image_url": "https://images.pexels.com/photos/19786235/pexels-photo-19786235.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940", "sort_order": 2},
    {"cat": 0, "name": "1/2 Calabresa 1/2 Frango c/ Catupiry + Coca-Cola 1L", "description": "Pizza meio a meio de calabresa e frango com catupiry, acompanhada de Coca-Cola 1L.", "price": 59.99, "image_url": SAIPOS + "9b0bb993cf3d3ee3ea56e65a1e90832b.jpeg", "sort_order": 3},
    # Pizza-X
    {"cat": 1, "name": "Pizza-X — Sabor Surpresa", "description": "Sua pizza com sabor surpresa pronta em até 3 minutos. Surpreenda-se!", "price": 32.00, "badge": "Pronta em 3 min", "image_url": SAIPOS + "4d771967a1360997bc1736e92b9d9113.jpeg", "sort_order": 1},
    # Salgadas
    {"cat": 2, "name": "Pizza Salgada P — 4 Fatias", "description": "Escolha 1 sabor salgado. Tamanho P com 4 fatias.", "price": 20.00, "price_from": True, "image_url": SAIPOS + "4d771967a1360997bc1736e92b9d9113.jpeg", "sort_order": 1},
    {"cat": 2, "name": "Pizza Salgada G — 8 Fatias", "description": "Escolha 1 sabor salgado. Tamanho G com 8 fatias.", "price": 30.00, "price_from": True, "image_url": "https://images.pexels.com/photos/29626981/pexels-photo-29626981.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940", "sort_order": 2},
    # Meio a Meio
    {"cat": 3, "name": "Pizza Meio a Meio", "description": "1 pizza com 2 sabores à sua escolha, metade de cada.", "price": 54.99, "price_from": True, "badge": "2 Sabores", "image_url": SAIPOS + "9b0bb993cf3d3ee3ea56e65a1e90832b.jpeg", "sort_order": 1},
    # Doces
    {"cat": 4, "name": "Pizza Doce P — 4 Fatias", "description": "Escolha 1 sabor doce. Tamanho P com 4 fatias.", "price": 30.00, "price_from": True, "image_url": SAIPOS + "fe7114d4733341bc694d34c9ddca7ef1.jpeg", "sort_order": 1},
    {"cat": 4, "name": "Pizza Doce G — 8 Fatias", "description": "Escolha 1 sabor doce. Tamanho G com 8 fatias.", "price": 40.00, "price_from": True, "badge": "Doce", "image_url": "https://images.pexels.com/photos/33457632/pexels-photo-33457632.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940", "sort_order": 2},
    # Refrigerantes
    {"cat": 5, "name": "Coca-Cola 2L", "description": "", "price": 15.00, "image_url": SAIPOS + "45d381fcd3203c03b6783e2865642188.png", "sort_order": 1},
    {"cat": 5, "name": "Coca-Cola Zero 2L", "description": "", "price": 15.00, "image_url": "https://images.pexels.com/photos/19504042/pexels-photo-19504042.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940", "sort_order": 2},
    {"cat": 5, "name": "Guaraná Antártica 2L", "description": "", "price": 15.00, "image_url": SAIPOS + "7508a0e6f5d5ab2ceee7981449ee07cb.jpeg", "sort_order": 3},
    {"cat": 5, "name": "Coca-Cola 1L", "description": "", "price": 10.00, "image_url": SAIPOS + "05afc2d95271fe3d4b181f10227ab99e.png", "sort_order": 4},
    {"cat": 5, "name": "Guaraná Antártica 1L", "description": "", "price": 10.00, "image_url": SAIPOS + "2ebec50857c5aa0ed94df739453f7ac2.jpeg", "sort_order": 5},
    # Sucos
    {"cat": 6, "name": "Suco La Fruit Uva 1L", "description": "", "price": 12.00, "image_url": SAIPOS + "7fcafd5150c5484fb02856c2cefc1ffe.jpeg", "sort_order": 1},
    {"cat": 6, "name": "Suco La Fruit Maracujá 1L", "description": "", "price": 12.00, "image_url": SAIPOS + "bd4a574cc67588306da69796ed8f8f68.jpeg", "sort_order": 2},
    # Águas
    {"cat": 7, "name": "Água com Gás", "description": "", "price": 5.00, "image_url": "", "sort_order": 1},
]


async def seed_admin():
    email = os.environ.get("ADMIN_EMAIL", "admin@forneto.com").strip().lower()
    password = os.environ.get("ADMIN_PASSWORD", "forneto123")
    existing = await db.users.find_one({"email": email})
    if not existing:
        await db.users.insert_one({
            "email": email,
            "password_hash": hash_password(password),
            "name": "Admin Forneto",
            "role": "admin",
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        logger.info("Admin seeded: %s", email)
    elif not verify_password(password, existing["password_hash"]):
        await db.users.update_one({"email": email}, {"$set": {"password_hash": hash_password(password)}})


async def seed_menu():
    if await db.categories.count_documents({}) > 0:
        return
    cat_ids = []
    for c in SEED_CATEGORIES:
        cat = Category(**c)
        await db.categories.insert_one(cat.model_dump())
        cat_ids.append(cat.id)
    for it in SEED_ITEMS:
        data = {k: v for k, v in it.items() if k != "cat"}
        item = MenuItem(category_id=cat_ids[it["cat"]], **data)
        await db.items.insert_one(item.model_dump())
    await db.settings.update_one({"id": "store"}, {"$set": Settings().model_dump()}, upsert=True)
    logger.info("Menu seeded with %d categories and %d items", len(SEED_CATEGORIES), len(SEED_ITEMS))


@app.on_event("startup")
async def startup():
    await db.users.create_index("email", unique=True)
    await seed_admin()
    await seed_menu()
    # migration: flavor picker + open/closed toggle fields
    await db.items.update_many({"flavors": {"$exists": False}}, {"$set": {"flavors": [], "max_flavors": 1}})
    meio_cats = [c["id"] async for c in db.categories.find({"name": {"$regex": "Meio a Meio", "$options": "i"}})]
    if meio_cats:
        await db.items.update_many({"category_id": {"$in": meio_cats}}, {"$set": {"max_flavors": 2}})
    await db.settings.update_one({"id": "store", "is_open": {"$exists": False}}, {"$set": {"is_open": True}})


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
