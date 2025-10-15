from fastapi import FastAPI, APIRouter, UploadFile, File, HTTPException, Form
from fastapi.responses import FileResponse, StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone
import shutil
from openpyxl import Workbook
from io import BytesIO
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib import colors
from reportlab.lib.enums import TA_RIGHT, TA_CENTER
import json

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Upload directory
UPLOAD_DIR = ROOT_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

# Models
class CompanyInfo(BaseModel):
    name_ar: str = "شركة مثلث الأنظمة المميزة للمقاولات"
    name_en: str = "MUTHALLATH AL-ANZIMAH AL-MUMAYYIZAH CONTRACTING CO."
    description_ar: str = "تصميم وتصنيع وتوريد وتركيب مظلات الشد الإنشائي والخيام والسواتر"
    description_en: str = "Design, Manufacture, Supply & Installation of Structure Tension Awnings, Tents & Canopies"
    tax_number: str = "311104439400003"
    street: str = "شارع حائل"
    neighborhood: str = "حي البغدادية الغربية"
    country: str = "السعودية"
    city: str = "جدة"
    commercial_registration: str = "4030255240"
    building: str = "8376"
    postal_code: str = "22231"
    additional_number: str = "3842"
    email: str = "info@tsscoksa.com"
    phone1: str = "+966 50 061 2006"
    phone2: str = "055 538 9792"
    phone3: str = "+966 50 336 5527"
    logo_path: Optional[str] = None

class CustomerInfo(BaseModel):
    name: str
    tax_number: Optional[str] = None
    street: Optional[str] = None
    neighborhood: Optional[str] = None
    country: Optional[str] = "السعودية"
    city: Optional[str] = None
    commercial_registration: Optional[str] = None
    building: Optional[str] = None
    postal_code: Optional[str] = None
    additional_number: Optional[str] = None
    phone: Optional[str] = None

class QuoteItem(BaseModel):
    description: str
    quantity: float
    unit: str
    unit_price: float
    total_price: float

class QuoteCreate(BaseModel):
    customer: CustomerInfo
    project_description: str
    location: str
    items: List[QuoteItem]
    subtotal: float
    tax_amount: float
    total_amount: float
    notes: Optional[str] = None

class Quote(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    quote_number: str
    customer: CustomerInfo
    project_description: str
    location: str
    items: List[QuoteItem]
    subtotal: float
    tax_amount: float
    total_amount: float
    notes: Optional[str] = None
    created_date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class QuoteUpdate(BaseModel):
    customer: Optional[CustomerInfo] = None
    project_description: Optional[str] = None
    location: Optional[str] = None
    items: Optional[List[QuoteItem]] = None
    subtotal: Optional[float] = None
    tax_amount: Optional[float] = None
    total_amount: Optional[float] = None
    notes: Optional[str] = None

# Utility functions
async def get_next_quote_number():
    """Generate next sequential quote number"""
    last_quote = await db.quotes.find_one(sort=[("created_date", -1)])
    if last_quote:
        try:
            last_number = int(last_quote.get("quote_number", "0"))
            return str(last_number + 1)
        except:
            count = await db.quotes.count_documents({})
            return str(count + 1)
    return "1"

# Routes
@api_router.get("/")
async def root():
    return {"message": "Quote Management System API"}

# Company routes
@api_router.get("/company", response_model=CompanyInfo)
async def get_company_info():
    company = await db.company.find_one({})
    if not company:
        # Create default company info
        default_company = CompanyInfo()
        await db.company.insert_one(default_company.dict())
        return default_company
    return CompanyInfo(**company)

@api_router.put("/company", response_model=CompanyInfo)
async def update_company_info(company: CompanyInfo):
    company_dict = company.dict()
    company_dict["updated_date"] = datetime.now(timezone.utc).isoformat()
    
    await db.company.delete_many({})  # Remove old company info
    await db.company.insert_one(company_dict)
    return company

@api_router.post("/company/logo")
async def upload_logo(file: UploadFile = File(...)):
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    # Generate unique filename
    file_extension = os.path.splitext(file.filename)[1]
    filename = f"logo_{uuid.uuid4()}{file_extension}"
    file_path = UPLOAD_DIR / filename
    
    # Save file
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Update company info with logo path
    await db.company.update_one(
        {},
        {"$set": {"logo_path": f"/api/uploads/{filename}"}},
        upsert=True
    )
    
    return {"logo_path": f"/api/uploads/{filename}"}

@api_router.get("/uploads/{filename}")
async def get_uploaded_file(filename: str):
    file_path = UPLOAD_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(file_path)

# Quote routes
@api_router.post("/quotes", response_model=Quote)
async def create_quote(quote_data: QuoteCreate):
    quote_number = await get_next_quote_number()
    quote_dict = quote_data.dict()
    quote_dict["id"] = str(uuid.uuid4())
    quote_dict["quote_number"] = quote_number
    quote_dict["created_date"] = datetime.now(timezone.utc).isoformat()
    quote_dict["updated_date"] = datetime.now(timezone.utc).isoformat()
    
    quote_obj = Quote(**quote_dict)
    await db.quotes.insert_one(quote_obj.dict())
    return quote_obj

@api_router.get("/quotes", response_model=List[Quote])
async def get_quotes(skip: int = 0, limit: int = 100):
    quotes = await db.quotes.find().sort("created_date", -1).skip(skip).limit(limit).to_list(limit)
    return [Quote(**quote) for quote in quotes]

@api_router.get("/quotes/{quote_id}", response_model=Quote)
async def get_quote(quote_id: str):
    quote = await db.quotes.find_one({"id": quote_id})
    if not quote:
        raise HTTPException(status_code=404, detail="Quote not found")
    return Quote(**quote)

@api_router.put("/quotes/{quote_id}", response_model=Quote)
async def update_quote(quote_id: str, quote_update: QuoteUpdate):
    existing_quote = await db.quotes.find_one({"id": quote_id})
    if not existing_quote:
        raise HTTPException(status_code=404, detail="Quote not found")
    
    update_data = {k: v for k, v in quote_update.dict().items() if v is not None}
    update_data["updated_date"] = datetime.now(timezone.utc).isoformat()
    
    await db.quotes.update_one({"id": quote_id}, {"$set": update_data})
    
    updated_quote = await db.quotes.find_one({"id": quote_id})
    return Quote(**updated_quote)

@api_router.delete("/quotes/{quote_id}")
async def delete_quote(quote_id: str):
    result = await db.quotes.delete_one({"id": quote_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Quote not found")
    return {"message": "Quote deleted successfully"}

# Export routes
@api_router.get("/quotes/{quote_id}/export/excel")
async def export_quote_excel(quote_id: str):
    quote = await db.quotes.find_one({"id": quote_id})
    if not quote:
        raise HTTPException(status_code=404, detail="Quote not found")
    
    quote_obj = Quote(**quote)
    company = await get_company_info()
    
    # Create Excel workbook
    wb = Workbook()
    ws = wb.active
    ws.title = f"Quote_{quote_obj.quote_number}"
    
    # Headers
    ws.append([f"Quote #{quote_obj.quote_number}"])
    ws.append([f"Company: {company.name_ar}"])
    ws.append([f"Customer: {quote_obj.customer.name}"])
    ws.append([f"Project: {quote_obj.project_description}"])
    ws.append([f"Location: {quote_obj.location}"])
    ws.append([])
    
    # Items table
    ws.append(["#", "Description", "Quantity", "Unit", "Unit Price", "Total"])
    for i, item in enumerate(quote_obj.items, 1):
        ws.append([i, item.description, item.quantity, item.unit, item.unit_price, item.total_price])
    
    ws.append([])
    ws.append(["", "", "", "", "Subtotal:", quote_obj.subtotal])
    ws.append(["", "", "", "", "Tax (15%):", quote_obj.tax_amount])
    ws.append(["", "", "", "", "Total:", quote_obj.total_amount])
    
    # Save to BytesIO
    output = BytesIO()
    wb.save(output)
    output.seek(0)
    
    headers = {
        'Content-Disposition': f'attachment; filename="quote_{quote_obj.quote_number}.xlsx"'
    }
    
    return StreamingResponse(
        BytesIO(output.read()),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers=headers
    )

@api_router.get("/quotes/{quote_id}/export/pdf")
async def export_quote_pdf(quote_id: str):
    quote = await db.quotes.find_one({"id": quote_id})
    if not quote:
        raise HTTPException(status_code=404, detail="Quote not found")
    
    quote_obj = Quote(**quote)
    company = await get_company_info()
    
    # Create PDF
    buffer = BytesIO()
    p = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4
    
    # Arabic text support (simplified - would need proper Arabic font)
    y_position = height - 50
    
    # Header
    p.setFont("Helvetica-Bold", 16)
    p.drawString(50, y_position, f"Quote #{quote_obj.quote_number}")
    y_position -= 30
    
    p.setFont("Helvetica", 12)
    p.drawString(50, y_position, f"Company: {company.name_en}")
    y_position -= 20
    p.drawString(50, y_position, f"Customer: {quote_obj.customer.name}")
    y_position -= 20
    p.drawString(50, y_position, f"Project: {quote_obj.project_description}")
    y_position -= 20
    p.drawString(50, y_position, f"Location: {quote_obj.location}")
    y_position -= 40
    
    # Table header
    p.setFont("Helvetica-Bold", 10)
    p.drawString(50, y_position, "#")
    p.drawString(80, y_position, "Description")
    p.drawString(250, y_position, "Qty")
    p.drawString(300, y_position, "Unit")
    p.drawString(350, y_position, "Unit Price")
    p.drawString(450, y_position, "Total")
    y_position -= 20
    
    # Items
    p.setFont("Helvetica", 9)
    for i, item in enumerate(quote_obj.items, 1):
        p.drawString(50, y_position, str(i))
        p.drawString(80, y_position, item.description[:25])  # Truncate long descriptions
        p.drawString(250, y_position, str(item.quantity))
        p.drawString(300, y_position, item.unit)
        p.drawString(350, y_position, str(item.unit_price))
        p.drawString(450, y_position, str(item.total_price))
        y_position -= 15
        
        if y_position < 100:  # Start new page if needed
            p.showPage()
            y_position = height - 50
    
    # Totals
    y_position -= 20
    p.setFont("Helvetica-Bold", 10)
    p.drawString(350, y_position, "Subtotal:")
    p.drawString(450, y_position, str(quote_obj.subtotal))
    y_position -= 15
    p.drawString(350, y_position, "Tax (15%):")
    p.drawString(450, y_position, str(quote_obj.tax_amount))
    y_position -= 15
    p.drawString(350, y_position, "Total:")
    p.drawString(450, y_position, str(quote_obj.total_amount))
    
    p.save()
    buffer.seek(0)
    
    headers = {
        'Content-Disposition': f'attachment; filename="quote_{quote_obj.quote_number}.pdf"'
    }
    
    return StreamingResponse(
        BytesIO(buffer.read()),
        media_type="application/pdf",
        headers=headers
    )

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()