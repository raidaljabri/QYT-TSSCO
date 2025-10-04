import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowRight, 
  Edit, 
  Download, 
  FileText, 
  FileSpreadsheet,
  Printer
} from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import { useReactToPrint } from "react-to-print";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function QuoteView({ company }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const printRef = useRef();
  
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuote();
  }, [id]);

  const fetchQuote = async () => {
    try {
      const response = await axios.get(`${API}/quotes/${id}`);
      setQuote(response.data);
    } catch (error) {
      toast.error("حدث خطأ أثناء تحميل عرض السعر");
      console.error("Error fetching quote:", error);
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: `Quote_${quote?.quote_number}`
  });

  const handleExport = async (format) => {
    try {
      const response = await axios.get(`${API}/quotes/${id}/export/${format}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      const extension = format === 'excel' ? 'xlsx' : 'pdf';
      link.setAttribute('download', `quote_${quote.quote_number}.${extension}`);
      
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success(`تم تحميل عرض السعر كـ ${format === 'excel' ? 'Excel' : 'PDF'}`);
    } catch (error) {
      toast.error("حدث خطأ أثناء تحميل الملف");
      console.error("Error exporting quote:", error);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>عرض السعر غير موجود</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Action Bar */}
      <div className="mb-6 flex items-center justify-between print:hidden">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          data-testid="back-to-list-button"
        >
          <ArrowRight className="h-4 w-4 ml-2" />
          العودة إلى القائمة
        </Button>

        <div className="flex space-x-3 space-x-reverse">
          <Button
            variant="outline"
            onClick={handlePrint}
            data-testid="print-button"
          >
            <Printer className="h-4 w-4 ml-2" />
            طباعة
          </Button>
          
          <Button
            variant="outline"
            onClick={() => handleExport('pdf')}
            data-testid="export-pdf-button"
          >
            <FileText className="h-4 w-4 ml-2" />
            تحميل PDF
          </Button>
          
          <Button
            variant="outline"
            onClick={() => handleExport('excel')}
            data-testid="export-excel-button"
          >
            <FileSpreadsheet className="h-4 w-4 ml-2" />
            تحميل Excel
          </Button>
          
          <Button
            onClick={() => navigate(`/edit/${quote.id}`)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
            data-testid="edit-quote-button"
          >
            <Edit className="h-4 w-4 ml-2" />
            تعديل
          </Button>
        </div>
      </div>

      {/* Printable Quote */}
      <div ref={printRef} className="bg-white p-8 shadow-lg rounded-lg print:shadow-none print:rounded-none">
        
        {/* Header */}
        <div className="flex items-start justify-between mb-8 border-b pb-6">
          <div className="flex items-center space-x-4 space-x-reverse">
            {company?.logo_path && (
              <img 
                src={`${BACKEND_URL}${company.logo_path}`}
                alt="شعار الشركة"
                className="h-20 w-20 object-contain"
              />
            )}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {company?.name_ar || "شركة مثلث الأنظمة المميزة للمقاولات"}
              </h1>
              <p className="text-gray-600 mt-1">
                {company?.description_ar}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {company?.name_en}
              </p>
            </div>
          </div>
          
          <div className="text-right">
            <Badge variant="secondary" className="text-lg px-4 py-2 mb-4">
              عرض سعر رقم {quote.quote_number}
            </Badge>
            <div className="text-sm text-gray-600 space-y-1">
              <p><strong>التاريخ:</strong> {formatDate(quote.created_date)}</p>
            </div>
          </div>
        </div>

        {/* Company & Customer Info */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          {/* Company Info */}
          <div>
            <h3 className="text-lg font-semibold mb-3 text-blue-600">المورد / Seller</h3>
            <div className="text-sm space-y-1">
              <p><strong>الشركة:</strong> {company?.name_ar}</p>
              <p><strong>الرقم الضريبي:</strong> {company?.tax_number}</p>
              <p><strong>الشارع:</strong> {company?.street}</p>
              <p><strong>الحي:</strong> {company?.neighborhood}</p>
              <p><strong>المدينة:</strong> {company?.city}</p>
              <p><strong>الدولة:</strong> {company?.country}</p>
              <p><strong>السجل التجاري:</strong> {company?.commercial_registration}</p>
              <p><strong>المبنى:</strong> {company?.building}</p>
              <p><strong>الرمز البريدي:</strong> {company?.postal_code}</p>
              <p><strong>الرقم الإضافي:</strong> {company?.additional_number}</p>
            </div>
          </div>

          {/* Customer Info */}
          <div>
            <h3 className="text-lg font-semibold mb-3 text-green-600">العميل / Customer</h3>
            <div className="text-sm space-y-1">
              <p><strong>العميل:</strong> {quote.customer.name}</p>
              {quote.customer.tax_number && (
                <p><strong>الرقم الضريبي:</strong> {quote.customer.tax_number}</p>
              )}
              {quote.customer.street && (
                <p><strong>الشارع:</strong> {quote.customer.street}</p>
              )}
              {quote.customer.neighborhood && (
                <p><strong>الحي:</strong> {quote.customer.neighborhood}</p>
              )}
              {quote.customer.city && (
                <p><strong>المدينة:</strong> {quote.customer.city}</p>
              )}
              {quote.customer.country && (
                <p><strong>الدولة:</strong> {quote.customer.country}</p>
              )}
              {quote.customer.commercial_registration && (
                <p><strong>السجل التجاري:</strong> {quote.customer.commercial_registration}</p>
              )}
              {quote.customer.building && (
                <p><strong>المبنى:</strong> {quote.customer.building}</p>
              )}
              {quote.customer.postal_code && (
                <p><strong>الرمز البريدي:</strong> {quote.customer.postal_code}</p>
              )}
              {quote.customer.additional_number && (
                <p><strong>الرقم الإضافي:</strong> {quote.customer.additional_number}</p>
              )}
              {quote.customer.phone && (
                <p><strong>رقم الهاتف:</strong> {quote.customer.phone}</p>
              )}
            </div>
          </div>
        </div>

        {/* Project Details */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-3 text-purple-600">تفاصيل المشروع</h3>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">وصف المشروع:</p>
                <p className="font-medium">{quote.project_description}</p>
              </div>
              {quote.location && (
                <div>
                  <p className="text-sm text-gray-600">الموقع:</p>
                  <p className="font-medium">{quote.location}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-3">بنود عرض السعر</h3>
          <div className="overflow-x-auto">
            <table className="w-full border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-3 py-2 text-center text-sm font-medium">
                    الرقم التسلسلي
                  </th>
                  <th className="border border-gray-300 px-3 py-2 text-right text-sm font-medium">
                    الوصف
                  </th>
                  <th className="border border-gray-300 px-3 py-2 text-center text-sm font-medium">
                    الكمية
                  </th>
                  <th className="border border-gray-300 px-3 py-2 text-center text-sm font-medium">
                    الوحدة
                  </th>
                  <th className="border border-gray-300 px-3 py-2 text-center text-sm font-medium">
                    سعر الوحدة
                  </th>
                  <th className="border border-gray-300 px-3 py-2 text-center text-sm font-medium">
                    السعر الإجمالي
                  </th>
                </tr>
              </thead>
              <tbody>
                {quote.items.map((item, index) => (
                  <tr key={index}>
                    <td className="border border-gray-300 px-3 py-2 text-center text-sm">
                      {index + 1}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-right text-sm">
                      {item.description}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-center text-sm">
                      {item.quantity}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-center text-sm">
                      {item.unit}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-center text-sm">
                      {item.unit_price.toLocaleString('ar-SA')}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-center text-sm font-medium">
                      {item.total_price.toLocaleString('ar-SA')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totals */}
        <div className="mb-8">
          <div className="flex justify-end">
            <div className="w-80">
              <div className="space-y-3 text-sm">
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span>المجموع الفرعي:</span>
                  <span className="font-medium">{quote.subtotal.toLocaleString('ar-SA')} ريال</span>
                </div>
                
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span>ضريبة القيمة المضافة (15%):</span>
                  <span className="font-medium">{quote.tax_amount.toLocaleString('ar-SA')} ريال</span>
                </div>
                
                <div className="flex justify-between py-3 text-lg font-bold text-green-600 border-t-2 border-gray-400">
                  <span>المبلغ الإجمالي:</span>
                  <span>{quote.total_amount.toLocaleString('ar-SA')} ريال</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        {quote.notes && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-3">ملاحظات</h3>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm whitespace-pre-wrap">{quote.notes}</p>
            </div>
          </div>
        )}

        {/* Footer with Company Contact */}
        <div className="border-t pt-6 mt-8">
          <div className="text-center text-sm text-gray-600 space-y-1">
            <p><strong>معلومات الاتصال</strong></p>
            <p>البريد الإلكتروني: {company?.email}</p>
            <p>{company?.neighborhood}, {company?.city}</p>
            <div className="flex justify-center space-x-4 space-x-reverse">
              <p>جوال: {company?.phone1}</p>
              {company?.phone2 && <p>جوال آخر: {company?.phone2}</p>}
              {company?.phone3 && <p>جوال إضافي: {company?.phone3}</p>}
            </div>
          </div>
        </div>

        {/* Signature Area */}
        <div className="mt-12 pt-8 border-t">
          <div className="grid grid-cols-2 gap-8">
            <div className="text-center">
              <div className="border-t border-gray-400 pt-2 mt-16">
                <p className="text-sm text-gray-600">التوقيع والختم</p>
              </div>
            </div>
            <div className="text-center">
              <div className="border-t border-gray-400 pt-2 mt-16">
                <p className="text-sm text-gray-600">تاريخ الموافقة</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}