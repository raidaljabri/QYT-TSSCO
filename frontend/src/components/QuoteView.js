import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Printer, FileText } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import { useReactToPrint } from "react-to-print";
import html2pdf from "html2pdf.js";

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const sanitizeFileName = (str) => {
    if (!str) return "customer";
    return String(str)
      .replace(/[^a-zA-Z0-9\u0600-\u06FF\-_ ]+/g, "_")
      .replace(/\s+/g, "_")
      .replace(/_+/g, "_")
      .trim()
      .substring(0, 100);
  };

  const customerSafeName = sanitizeFileName(quote?.customer?.name || "customer");
  const defaultQuoteNumber = quote?.quote_number || "draft";
  const fileBaseName = `${customerSafeName}_QYT26-${defaultQuoteNumber}`;

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: fileBaseName,
    pageStyle: `
      @page { size: A4; margin: 12mm; }
      * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
      html, body { background: #fff !important; height: auto !important; overflow: visible !important; font-size: 12px; line-height: 1.2; }
      thead { display: table-header-group; }
      tfoot { display: table-footer-group; }
      tr, td, th, img { page-break-inside: avoid; break-inside: avoid; }
      .avoid-break { page-break-inside: avoid; break-inside: avoid; }
    `,
    removeAfterPrint: true,
    onAfterPrint: () => toast.success("تمت طباعة عرض السعر"),
  });

  // دالة تصدير PDF عالي الدقة
  const handleExport = async () => {
    if (!printRef.current || !quote) return;

    try {
      const element = printRef.current;
      const fileName = `${fileBaseName}.pdf`;

      const opt = {
        margin: [12, 12, 12, 12],
        filename: fileName,
        image: { type: "jpeg", quality: 1 },
        html2canvas: {
          scale: 4, // زيادة الدقة للنصوص والصور
          useCORS: true,
          allowTaint: true,
          backgroundColor: "#ffffff",
          logging: true,
        },
        jsPDF: {
          unit: "mm",
          format: "a4",
          orientation: "p",
        },
        pagebreak: {
          mode: ["css", "legacy"],
          before: ".page-break",
          avoid: [".avoid-break", "tr", "thead", "tfoot", "img"],
        },
      };

      await html2pdf().set(opt).from(element).save();
      toast.success(`تم تحميل عرض السعر PDF عالي الدقة باسم: ${fileName}`);
    } catch (error) {
      toast.error("حدث خطأ أثناء إنشاء PDF عالي الدقة");
      console.error("Error creating high-res PDF:", error);
    }
  };

  const formatHijriDate = (dateString) =>
    new Date(dateString).toLocaleDateString("ar-SA", {
      year: "numeric",
      month: "long",
      day: "numeric",
      calendar: "islamic",
    });

  const formatGregorianDate = (dateString) =>
    new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

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
    <div className="container mx-auto p-4 max-w-6xl">
      {/* شريط الأزرار */}
      <div className="mb-4 flex items-center justify-between print:hidden">
        <Button variant="ghost" onClick={() => navigate("/")}>
          <ArrowRight className="h-4 w-4 ml-2" />
          العودة إلى القائمة
        </Button>

        <div className="flex space-x-2 space-x-reverse">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="h-4 w-4 ml-2" />
          </Button>

          <Button variant="outline" onClick={handleExport}>
            <FileText className="h-4 w-4 ml-2" /> تحميل PDF
          </Button>
        </div>
      </div>

      {/* المحتوى القابل للطباعة */}
      <div
        ref={printRef}
        className="bg-white p-4 shadow-lg rounded-lg print:shadow-none print:rounded-none print:w-[210mm] print:mx-auto print-content"
      >
        <style>
          {`
          @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700&display=swap');
          body, html, .print-content {
            font-family: 'Cairo', Arial, sans-serif !important;
            font-size: 12px !important;
            line-height: 1.2 !important;
          }
          .numbers-en { font-family: Arial, sans-serif !important; }
          .print-content h1 { font-size: 18px !important; }
          .print-content h3 { font-size: 14px !important; }
          .print-content table th, 
          .print-content table td { font-size: 11px !important; padding: 4px 6px !important; text-align: start; }
          @media print {
            thead { display: table-header-group; }
            tfoot { display: table-footer-group; }
            tr, td, th, img, .avoid-break { page-break-inside: avoid; break-inside: avoid; }
            .page-break { page-break-before: always; }
          }
        `}
        </style>

        {/* Header */}
        <div className="flex items-start justify-between mb-4 border-b pb-2 avoid-break">
          <div className="flex items-center space-x-2 space-x-reverse">
            {company?.logo_path && (
              <img
                src={`${BACKEND_URL}${company.logo_path}`}
                alt="شعار الشركة"
                className="h-16 w-16 object-contain"
                crossOrigin="anonymous"
              />
            )}
            <div>
              <h1 className="text-gray-900 font-bold">{company?.name_ar || "شركة مثلث الأنظمة المميزة"}</h1>
              <p className="text-gray-600 mt-1">{company?.description_ar}</p>
              <p className="text-gray-500 text-sm mt-1">{company?.name_en}</p>
            </div>
          </div>

          <div className="text-right">
            <Badge variant="secondary" className="px-3 py-1 mb-2 text-sm">
              عرض سعر رقم QYT26- {quote.quote_number}
            </Badge>
            <div className="text-xs text-gray-600 space-y-0.5">
              <p>
                <strong>التاريخ:</strong>{" "}
                {formatHijriDate(quote.created_date)} / {formatGregorianDate(quote.created_date)}
              </p>
            </div>
          </div>
        </div>

        {/* معلومات الشركة والعميل */}
        <div className="grid grid-cols-2 gap-4 mb-4 avoid-break">
          <div>
            <h3 className="text-blue-600 font-semibold mb-1">المورد / Seller</h3>
            <div className="text-xs space-y-0.5">
              <p><strong>الشركة:</strong> {company?.name_ar}</p>
              <p><strong>الرقم الضريبي:</strong> {company?.tax_number}</p>
              <p><strong>المدينة:</strong> {company?.city}</p>
              <p><strong>الدولة:</strong> {company?.country}</p>
              <p><strong>السجل التجاري:</strong> {company?.commercial_registration}</p>
            </div>
          </div>

          <div>
            <h3 className="text-green-600 font-semibold mb-1">العميل / Customer</h3>
            <div className="text-xs space-y-0.5">
              <p><strong>العميل:</strong> {quote.customer.name}</p>
              {quote.customer.tax_number && <p><strong>الرقم الضريبي:</strong> {quote.customer.tax_number}</p>}
              {quote.customer.city && <p><strong>المدينة:</strong> {quote.customer.city}</p>}
              {quote.customer.phone && <p><strong>رقم الهاتف:</strong> {quote.customer.phone}</p>}
            </div>
          </div>
        </div>

        {/* Project details */}
         <div className="mb-6 avoid-break">
          <h3
            className="text-purple-600 font-semibold mb-4 border-b pb-2"
            dir={/[\u0600-\u06FF]/.test(quote.project_description || "") ? "rtl" : "ltr"}
          >
              تفاصيل المشروع / Project details
             </h3>

            <div
             className="bg-gray-50 p-3 rounded"
             dir={/[\u0600-\u06FF]/.test(quote.project_description || "") ? "rtl" : "ltr"}
              style={{
                textAlign: /[\u0600-\u06FF]/.test(quote.project_description || "") ? "right" : "left",
             }}
           >
           <p className="font-medium break-words">{quote.project_description}</p>

          {quote.location && (
             <p className="font-medium mt-2 break-words">
               { /[\u0600-\u06FF]/.test(quote.location)
                ? `الموقع: ${quote.location}`
               : `Location: ${quote.location}`
                  }
             </p>
           )}
          </div>
        </div>

        {/* Price table */}
        <div className="mb-4">
          <h3 className="font-semibold mb-3 text-sm">جدول الأسعار / Price table </h3>
          <div className="overflow-x-auto avoid-break">
            <table className="w-full border border-gray-300 avoid-break">
              <thead>
                <tr className="bg-gray-100 text-xs">
                  <th className="border px-2 py-1 text-center">الرقم</th>
                  <th className="border px-2 py-1 text-center">الوصف</th>
                  <th className="border px-2 py-1 text-center">الكمية</th>
                  <th className="border px-2 py-1 text-center">الوحدة</th>
                  <th className="border px-2 py-1 text-center">سعر الوحدة</th>
                  <th className="border px-2 py-1 text-center">السعر الإجمالي</th>
                </tr>
              </thead>
              <tbody>
                {quote.items.map((item, i) => (
                  <tr key={i}>
                    <td className="border px-2 py-1 text-center">{i + 1}</td>
                    <td className="border px-2 py-1" dir="auto" style={{ textAlign: "start" }}>{item.description}</td>
                    <td className="border px-2 py-1 text-center numbers-en">{item.quantity}</td>
                    <td className="border px-2 py-1 text-center">{item.unit}</td>
                    <td className="border px-2 py-1 text-center numbers-en">
                      {Number(item.unit_price).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="border px-2 py-1 text-center numbers-en font-medium">
                      {Number(item.total_price).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totals */}
        <div className="flex justify-end mb-6 avoid-break">
          <div className="w-80 space-y-3 text-base">
            <div className="flex justify-between py-2 border-b">
              <span className="text-lg">المجموع الفرعي:</span>
              <span className="font-medium numbers-en text-lg">
                {Number(quote.subtotal).toLocaleString("en-US", { minimumFractionDigits: 2 })} ريال
              </span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-lg">الضريبة (15%):</span>
              <span className="font-medium numbers-en text-lg">
                {Number(quote.tax_amount).toLocaleString("en-US", { minimumFractionDigits: 2 })} ريال
              </span>
            </div>
            <div className="flex justify-between py-3 text-green-600 font-bold border-t-4 border-gray-400">
              <span className="text-xl">الإجمالي:</span>
              <span className="numbers-en text-xl">
                {Number(quote.total_amount).toLocaleString("en-US", { minimumFractionDigits: 2 })} ريال
              </span>
            </div>
          </div>
        </div>

        {/* Terms */}
        {quote.notes && (
          <div className="mb-4 avoid-break">
            <h3 className="font-semibold mb-3 text-sm">الأحكام والشروط / Terms and conditions</h3>
            <div className="bg-white border border-gray-200 rounded p-2">
             <p
              className="text-xs whitespace-pre-wrap break-words"
             dir={/[\u0600-\u06FF]/.test(quote.notes || "") ? "rtl" : "ltr"}
             style={{ textAlign: /[\u0600-\u06FF]/.test(quote.notes || "") ? "right" : "left" }}
             >
              {quote.notes}
           </p>
         </div>

          </div>
        )}

        {/* Contact and signatures */}
        <div className="border-t pt-2 mt-2 text-center text-xs text-gray-600 space-y-1 avoid-break">
          <p><strong>معلومات الاتصال / Contact information</strong></p>
          <p>البريد الإلكتروني: {company?.email}</p>
          <p>{company?.neighborhood}, {company?.city}</p>
          <div className="flex justify-center space-x-2 space-x-reverse">
            <p>جوال: {company?.phone1}</p>
            {company?.phone2 && <p>جوال آخر: {company?.phone2}</p>}
            {company?.phone3 && <p>جوال إضافي: {company?.phone3}</p>}
          </div>

          <div className="mt-4 pt-2 border-t avoid-break">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="border-t border-gray-400 pt-1 mt-8">
                  <p className="text-xs text-gray-600">التوقيع والختم</p>
                </div>
              </div>
              <div className="text-center">
                <div className="border-t border-gray-400 pt-1 mt-8">
                  <p className="text-xs text-gray-600">توقيع العميل</p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}