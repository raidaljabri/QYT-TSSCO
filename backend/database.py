from motor.motor_asyncio import AsyncIOMotorClient
import os

MONGO_DETAILS = os.environ.get("MONGO_URL")
DB_NAME = os.environ.get("DB_NAME", "QYTR")

client = AsyncIOMotorClient(MONGO_DETAILS)
database = client[DB_NAME]
quotes_collection = database.quotes
