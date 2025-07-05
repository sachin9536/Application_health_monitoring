#!/usr/bin/env python3
"""
Test script to verify add_random_product functionality
"""
import asyncio
import aiohttp
import os
import json
from datetime import datetime

# Service URLs
AUTH_SERVICE_URL = os.getenv("AUTH_SERVICE_URL", "http://localhost:8001")
CATALOG_SERVICE_URL = os.getenv("CATALOG_SERVICE_URL", "http://localhost:8005")

def log_json(level, message, **kwargs):
    log_data = {
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "level": level,
        "service": "test_script",
        "message": message,
    }
    log_data.update(kwargs)
    print(json.dumps(log_data))

async def test_auth_and_add_product():
    """Test authentication and product addition"""
    async with aiohttp.ClientSession() as session:
        # Test user
        user = {"email": "test@example.com", "password": "password123"}
        
        # Step 1: Register user
        log_json("INFO", "Testing user registration...")
        payload = {"email": user["email"], "password": user["password"]}
        try:
            async with session.post(f"{AUTH_SERVICE_URL}/register", json=payload, timeout=10) as resp:
                log_json("INFO", f"Registration response: {resp.status}")
                if resp.status in [200, 201]:
                    log_json("INFO", "User registered successfully")
                else:
                    response_text = await resp.text()
                    log_json("INFO", f"Registration response: {response_text}")
        except Exception as e:
            log_json("ERROR", f"Registration failed", error=str(e))
            return
        
        # Step 2: Sign in to get token
        log_json("INFO", "Testing user signin...")
        try:
            async with session.post(f"{AUTH_SERVICE_URL}/signin", json=payload, timeout=10) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    token = data.get("access_token")
                    log_json("INFO", "Login successful, got token")
                else:
                    log_json("ERROR", f"Login failed: {resp.status}")
                    return
        except Exception as e:
            log_json("ERROR", f"Login failed", error=str(e))
            return
        
        # Step 3: Test catalog service health
        log_json("INFO", "Testing catalog service health...")
        try:
            async with session.get(f"{CATALOG_SERVICE_URL}/health", timeout=5) as resp:
                if resp.status == 200:
                    health_data = await resp.json()
                    log_json("INFO", f"Catalog service health: {health_data}")
                else:
                    log_json("ERROR", f"Catalog service health check failed: {resp.status}")
                    return
        except Exception as e:
            log_json("ERROR", f"Catalog service health check failed", error=str(e))
            return
        
        # Step 4: Test adding a product
        log_json("INFO", "Testing product addition...")
        headers = {"Authorization": f"Bearer {token}"}
        product_payload = {
            "name": f"TestProduct_{1234}",
            "description": "Test product for verification",
            "stock": 50
        }
        
        try:
            async with session.post(
                f"{CATALOG_SERVICE_URL}/api/v1/add_product",
                json=product_payload,
                headers=headers,
                timeout=10
            ) as resp:
                response_text = await resp.text()
                log_json("INFO", f"Add product response: {resp.status} | {response_text}")
                
                if resp.status in [200, 201]:
                    data = await resp.json()
                    product_id = data.get("product_id")
                    log_json("INFO", f"Product added successfully with ID: {product_id}")
                else:
                    log_json("ERROR", f"Failed to add product: {resp.status}")
        except Exception as e:
            log_json("ERROR", f"Product addition failed", error=str(e))

if __name__ == "__main__":
    asyncio.run(test_auth_and_add_product()) 