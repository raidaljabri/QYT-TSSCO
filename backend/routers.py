from fastapi import APIRouter, HTTPException
from models import QuoteModel  # نموذج البيانات
from database import quotes_collection  # الاتصال بـ MongoDB
from bson import ObjectId


api_router = APIRouter(prefix="/api")

# اختبار الـ API
@api_router.get("/test")
async def test():
    return {"message": "API is working!"}

# قراءة كل الاقتباسات
@api_router.get("/quotes")
async def get_quotes():
    quotes = []
    async for quote in quotes_collection.find({}):
        quote["_id"] = str(quote["_id"])  # تحويل ObjectId إلى string
        quotes.append(quote)
    return {"quotes": quotes}

# إضافة اقتباس جديد
@api_router.post("/quotes")
async def add_quote(quote: QuoteModel):
    result = await quotes_collection.insert_one(quote.dict())
    return {"message": "Quote added", "id": str(result.inserted_id)}

# حذف اقتباس
@api_router.delete("/quotes/{quote_id}")
async def delete_quote(quote_id: str):
    result = await quotes_collection.delete_one({"_id": ObjectId(quote_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Quote not found")
    return {"message": "Quote deleted"}
