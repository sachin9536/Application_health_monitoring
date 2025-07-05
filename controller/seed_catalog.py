import random
import asyncio
from datetime import datetime

def get_sample_products(n=10):
    names = [
        "Ball Pen", "Notebook", "Pencil", "Eraser", "Marker", "Stapler", "Highlighter", "Folder", "Glue Stick", "Scissors"
    ]
    descs = [
        "Smooth ballpoint pen with blue ink",
        "200-page ruled notebook",
        "HB graphite pencil",
        "Soft eraser for clean erasing",
        "Permanent marker, black",
        "Mini stapler with staples",
        "Yellow highlighter pen",
        "A4 size document folder",
        "Non-toxic glue stick",
        "Stainless steel scissors"
    ]
    products = []
    for i in range(n):
        products.append({
            "name": f"{names[i % len(names)]} {random.randint(1000,9999)}",
            "description": descs[i % len(descs)],
            "stock": random.randint(10, 100)
        })
    return products

async def seed_catalog_with_products(session, token, n=10):
    """
    Populate the catalog with a batch of products.
    """
    if __name__ != "__main__":
        from controller import CATALOG_SERVICE_URL, log_json
    else:
        CATALOG_SERVICE_URL = "http://catalog_service:8000"
        def log_json(level, message, **kwargs):
            print(level, message, kwargs)
    headers = {"Authorization": f"Bearer {token}"}
    products = get_sample_products(n)
    for i, product in enumerate(products):
        try:
            async with session.post(f"{CATALOG_SERVICE_URL}/api/v1/add_product", json=product, headers=headers, timeout=10) as resp:
                if resp.status in [200, 201]:
                    data = await resp.json()
                    log_json("INFO", f"Seeded product {i+1}/{n}: {product['name']}", product_id=data.get("product_id"))
                else:
                    log_json("ERROR", f"Failed to seed product {i+1}/{n}: {product['name']} | {resp.status} | {await resp.text()}")
        except Exception as e:
            log_json("ERROR", f"Exception while seeding product {i+1}/{n}: {product['name']}", error=str(e))
        await asyncio.sleep(0.1)  # Small delay to avoid overwhelming the service 