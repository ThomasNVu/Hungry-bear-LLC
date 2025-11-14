# test_auth_flow.py
import asyncio
import httpx
import uuid

BASE = "http://127.0.0.1:8000"


async def main():
    unique = uuid.uuid4().hex[:6]
    email = f"dani+{unique}@example.com"
    password = "TestPass!234"

    async with httpx.AsyncClient(base_url=BASE, timeout=20) as client:
        # 1) Create a user
        r = await client.post(
            "/users",
            json={"email": email, "full_name": "Dani DeLuzio", "password": password},
        )
        print("CREATE:", r.status_code, r.json())
        r.raise_for_status()
        user_id = r.json()["id"]

        # 2) Login to get a token
        r = await client.post("/login", json={"email": email, "password": password})
        print("LOGIN:", r.status_code, r.json())
        r.raise_for_status()
        access_token = r.json().get("access_token")
        if not access_token:
            raise RuntimeError("No access_token returned from /login")

        headers = {"Authorization": f"Bearer {access_token}"}

        # 3) Call a protected endpoint with the token
        r = await client.get(f"/users/{user_id}", headers=headers)
        print("GET /users/{id}:", r.status_code, r.json())

        # Optional: if you have /users/me
        r = await client.get("/users/me", headers=headers)
        print("GET /users/me:", r.status_code, r.json())


if __name__ == "__main__":
    asyncio.run(main())
