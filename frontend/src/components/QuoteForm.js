import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowRight, 
  Plus, 
  Trash2, 
  Save,
  Calculator
} from "lucide-react";
import axios from "axios";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function QuoteForm({ onSuccess, company }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    customer: {
      name: "",
      tax_number: "",
      street: "",
      neighborhood: "",
      country: "السعودية",
      city: "",
      commercial_registration: "",
      building: "",
      postal_code: "",
      additional_number: "",
      phone: ""
    },
    project_description: "",
    location: "",
    items: [
      {
        description: "",
        quantity: 1,
        unit: "قطعة",
        unit_price: 0,
        total_price: 0
      }
    ],
    subtotal: 0,
    tax_amount: 0,
    total_amount: 0,
    notes: ""
  });

  useEffect(() => {
    if (isEdit) {
      fetchQuote();
    }
  }, [id, isEdit]);

  useEffect(() => {
    calculateTotals();
  }, [formData.items]);

  const fetchQuote = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/quotes/${id}`);
      setFormData(response.data);
    } catch (error) {
      toast.error("حدث خطأ أثناء تحميل عرض السعر");
      console.error("Error fetching quote:", error);
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const calculateTotals = () => {
    const subtotal = formData.items.reduce((sum, item) => sum + (item.total_price || 0), 0);
    const taxAmount = subtotal * 0.15;
    const totalAmount = subtotal + taxAmount;

    setFormData(prev => ({
      ...prev,
      subtotal: parseFloat(subtotal.toFixed(2)),
      tax_amount: parseFloat(taxAmount.toFixed(2)),
      total_amount: parseFloat(totalAmount.toFixed(2))
    }));
  };

  const handleCustomerChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      customer: {
        ...prev.customer,
        [field]: value
      }
    }));
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index] = {
      ...newItems[index],
      [field]: value
    };

    // Calculate total price for this item
    if (field === 'quantity' || field === 'unit_price') {
      newItems[index].total_price = parseFloat(
        (newItems[index].quantity * newItems[index].unit_price).toFixed(2)
      );
    }

    setFormData(prev => ({
      ...prev,
      items: newItems
    }));
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [
        ...prev.items,
        {
          description: "",
          quantity: 1,
          unit: "قطعة",
          unit_price: 0,
          total_price: 0
        }
      ]
    }));
  };

  const removeItem = (index) => {
    if (formData.items.length > 1) {
      const newItems = formData.items.filter((_, i) => i !== index);
      setFormData(prev => ({
        ...prev,
        items: newItems
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.customer.name.trim()) {
      toast.error("يجب إدخال اسم العميل");
      return;
    }

    if (!formData.project_description.trim()) {
      toast.error("يجب إدخال وصف المشروع");
      return;
    }

    if (formData.items.some(item => !item.description.trim())) {
      toast.error("يجب إدخال وصف لجميع البنود");
      return;
    }

    try {
      setLoading(true);
      
      if (isEdit) {
        await axios.put(`${API}/quotes/${id}`, formData);
        toast.success("تم تحديث عرض السعر بنجاح");
      } else {
        await axios.post(`${API}/quotes`, formData);
        toast.success("تم إنشاء عرض السعر بنجاح");
      }
      
      onSuccess();
      navigate("/");
    } catch (error) {
      toast.error("حدث خطأ أثناء حفظ عرض السعر");
      console.error("Error saving quote:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEdit) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-4"
          data-testid="back-button"
        >
          <ArrowRight className="h-4 w-4 ml-2" />
          العودة إلى القائمة
        </Button>
        
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">
            {isEdit ? "تعديل عرض السعر" : "إنشاء عرض سعر جديد"}
          </h1>
          <Badge variant="outline" className="text-lg px-4 py-2">
            <Calculator className="h-4 w-4 ml-2" />
            {formData.total_amount.toLocaleString('ar-SA')} ريال
          </Badge>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Company Header */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 space-x-reverse">
                {company?.logo_path && (
                  <img 
                    src={`${BACKEND_URL}${company.logo_path}`}
                    alt="شعار الشركة"
                    className="h-12 w-12 object-contain"
                  />
                )}
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {company?.name_ar}
                  </h2>
                  <p className="text-sm text-gray-600">
                    {company?.name_en}
                  </p>
                </div>
              </div>
              <div className="text-right text-sm text-gray-600">
                <p>الرقم الضريبي: {company?.tax_number}</p>
                <p>{company?.city}, {company?.country}</p>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Customer Information */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle>معلومات العميل</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="col-span-full">
              <Label htmlFor="customer-name">اسم العميل *</Label>
              <Input
                id="customer-name"
                value={formData.customer.name}
                onChange={(e) => handleCustomerChange('name', e.target.value)}
                placeholder="أدخل اسم العميل"
                required
                data-testid="customer-name-input"
              />
            </div>
            
            <div>
              <Label htmlFor="tax-number">الرقم الضريبي</Label>
              <Input
                id="tax-number"
                value={formData.customer.tax_number}
                onChange={(e) => handleCustomerChange('tax_number', e.target.value)}
                placeholder="الرقم الضريبي"
                data-testid="customer-tax-number-input"
              />
            </div>
            
            <div>
              <Label htmlFor="street">الشارع</Label>
              <Input
                id="street"
                value={formData.customer.street}
                onChange={(e) => handleCustomerChange('street', e.target.value)}
                placeholder="الشارع"
                data-testid="customer-street-input"
              />
            </div>
            
            <div>
              <Label htmlFor="neighborhood">الحي</Label>
              <Input
                id="neighborhood"
                value={formData.customer.neighborhood}
                onChange={(e) => handleCustomerChange('neighborhood', e.target.value)}
                placeholder="الحي"
                data-testid="customer-neighborhood-input"
              />
            </div>
            
            <div>
              <Label htmlFor="city">المدينة</Label>
              <Input
                id="city"
                value={formData.customer.city}
                onChange={(e) => handleCustomerChange('city', e.target.value)}
                placeholder="المدينة"
                data-testid="customer-city-input"
              />
            </div>
            
            <div>
              <Label htmlFor="phone">رقم الهاتف</Label>
              <Input
                id="phone"
                value={formData.customer.phone}
                onChange={(e) => handleCustomerChange('phone', e.target.value)}
                placeholder="رقم الهاتف"
                data-testid="customer-phone-input"
              />
            </div>
          </CardContent>
        </Card>

        {/* Project Information */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle>معلومات المشروع</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="project-description">وصف المشروع *</Label>
              <Textarea
                id="project-description"
                value={formData.project_description}
                onChange={(e) => setFormData(prev => ({ ...prev, project_description: e.target.value }))}
                placeholder="أدخل وصف المشروع"
                required
                data-testid="project-description-input"
              />
            </div>
            
            <div>
              <Label htmlFor="location">الموقع</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                placeholder="موقع المشروع"
                data-testid="project-location-input"
              />
            </div>
          </CardContent>
        </Card>

        {/* Items */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>بنود عرض السعر</CardTitle>
              <Button
                type="button"
                onClick={addItem}
                variant="outline"
                size="sm"
                data-testid="add-item-button"
              >
                <Plus className="h-4 w-4 ml-2" />
                إضافة بند
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {formData.items.map((item, index) => (
              <div 
                key={index} 
                className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 bg-gray-50 rounded-lg"
                data-testid={`item-row-${index}`}
              >
                <div className="md:col-span-1 flex items-center">
                  <Badge variant="secondary" className="text-sm">
                    {index + 1}
                  </Badge>
                </div>
                
                <div className="md:col-span-4">
                  <Label htmlFor={`description-${index}`}>الوصف</Label>
                  <Input
                    id={`description-${index}`}
                    value={item.description}
                    onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                    placeholder="وصف البند"
                    data-testid={`item-description-${index}`}
                  />
                </div>
                
                <div className="md:col-span-2">
                  <Label htmlFor={`quantity-${index}`}>الكمية</Label>
                  <Input
                    id={`quantity-${index}`}
                    type="text"
                    value={item.quantity}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Allow numbers and decimal points
                      if (value === '' || /^\d*\.?\d*$/.test(value)) {
                        handleItemChange(index, 'quantity', value === '' ? 0 : parseFloat(value) || 0);
                      }
                    }}
                    className="numbers-en"
                    placeholder="0.00"
                    data-testid={`item-quantity-${index}`}
                  />
                </div>
                
                <div className="md:col-span-1">
                  <Label htmlFor={`unit-${index}`}>الوحدة</Label>
                  <Input
                    id={`unit-${index}`}
                    value={item.unit}
                    onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                    placeholder="الوحدة"
                    data-testid={`item-unit-${index}`}
                  />
                </div>
                
                <div className="md:col-span-2">
                  <Label htmlFor={`unit-price-${index}`}>سعر الوحدة</Label>
                  <Input
                    id={`unit-price-${index}`}
                    type="text"
                    value={item.unit_price}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Allow numbers and decimal points
                      if (value === '' || /^\d*\.?\d*$/.test(value)) {
                        handleItemChange(index, 'unit_price', value === '' ? 0 : parseFloat(value) || 0);
                      }
                    }}
                    className="numbers-en"
                    placeholder="0.00"
                    data-testid={`item-unit-price-${index}`}
                  />
                </div>
                
                <div className="md:col-span-2">
                  <Label>السعر الإجمالي</Label>
                  <div className="h-10 flex items-center px-3 bg-gray-100 rounded-md text-sm font-medium numbers-en">
                    {item.total_price.toLocaleString('en-US')}
                  </div>
                </div>
                
                {formData.items.length > 1 && (
                  <div className="md:col-span-1 flex items-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItem(index)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      data-testid={`remove-item-${index}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Totals */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <CardContent className="pt-6">
            <div className="space-y-3">
              <div className="flex justify-between items-center text-lg">
                <span>المجموع الفرعي:</span>
                <span data-testid="subtotal-amount">
                  {formData.subtotal.toLocaleString('ar-SA')} ريال
                </span>
              </div>
              
              <div className="flex justify-between items-center text-lg">
                <span>ضريبة القيمة المضافة (15%):</span>
                <span data-testid="tax-amount">
                  {formData.tax_amount.toLocaleString('ar-SA')} ريال
                </span>
              </div>
              
              <Separator />
              
              <div className="flex justify-between items-center text-xl font-bold text-green-600">
                <span>المبلغ الإجمالي:</span>
                <span data-testid="total-amount">
                  {formData.total_amount.toLocaleString('ar-SA')} ريال
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle>ملاحظات</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="أضف أي ملاحظات إضافية..."
              rows={4}
              data-testid="notes-input"
            />
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end space-x-4 space-x-reverse">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/")}
            data-testid="cancel-button"
          >
            إلغاء
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white"
            data-testid="save-quote-button"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <Save className="h-4 w-4 ml-2" />
            )}
            {isEdit ? "تحديث عرض السعر" : "حفظ عرض السعر"}
          </Button>
        </div>
      </form>
    </div>
  );
}