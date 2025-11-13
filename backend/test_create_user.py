# test_create_user.py
import asyncio
import httpx
import uuid

BASE = "http://127.0.0.1:8000"


async def main():
    # make a unique email so unique index doesn't collide
    email = f"dani+{uuid.uuid4().hex[:6]}@example.com"

    payload = {
        "email": email,
        "password": "CorrectHorseBatteryStaple1!",  # any password that meets your rules
        "full_name": "Dani DeLuzio",
        # optional fields (if your model has them):
        # "avatar_url": None,
        # "role": "user",
        # "is_active": True
    }

    async with httpx.AsyncClient(base_url=BASE, timeout=20.0) as client:
        r = await client.post("/users", json=payload)
        print("Status:", r.status_code)
        print("Response JSON:", r.json())

        # If you return the created user id, you can fetch it back:
        if (
            r.status_code in (200, 201)
            and isinstance(r.json(), dict)
            and "id" in r.json()
        ):
            user_id = r.json()["id"]
            g = await client.get(f"/users/{user_id}")
            print("GET user status:", g.status_code)
            print("GET user JSON:", g.json())


if __name__ == "__main__":
    asyncio.run(main())
