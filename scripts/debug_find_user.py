import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

async def find_user():
    uri = os.getenv("MONGODB_URI")
    client = AsyncIOMotorClient(uri)
    
    # List all databases
    db_list = await client.list_database_names()
    print(f"Databases found: {db_list}")
    
    for db_name in db_list:
        db = client[db_name]
        if "users" in await db.list_collection_names():
            user = await db.users.find_one({"email": "admin@brightsmiledental.demo"})
            if user:
                print(f"✅ FOUND user in database: {db_name}")
                print(f"   ID: {user['_id']}")
                return
    print("❌ User not found in any database.")

asyncio.run(find_user())