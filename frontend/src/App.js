import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, Link } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import axios from "axios";
import "@/App.css";

// Pages
import QuotesList from "@/components/QuotesList";
import QuoteForm from "@/components/QuoteForm";
import QuoteView from "@/components/QuoteView";
import CompanySettings from "@/components/CompanySettings";

const API = import.meta.env.VITE_API_URL; // للـ API
const API_BASE = import.meta.env.VITE_API_BASE_URL; // للصور



function App() {
  const [quotes, setQuotes] = useState([]);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  useEffect(() => {
    if (isLoggedIn) {
      fetchQuotes();
      fetchCompanyInfo();
    } else {
      setLoading(false);
    }
  }, [isLoggedIn]);

  const fetchQuotes = async () => {
    try {
      const response = await axios.get(`${API}/quotes`);
      setQuotes(response.data);
    } catch (error) {
      console.error("Error fetching quotes:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanyInfo = async () => {
    try {
      const response = await axios.get(`${API}/company`);
      setCompany(response.data);
    } catch (error) {
      console.error("Error fetching company info:", error);
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (username === "admin" && password === "1234") {
      setIsLoggedIn(true);
      setLoginError("");
      setLoading(true);
    } else {
      setLoginError("اسم المستخدم أو كلمة المرور غير صحيحة");
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUsername("");
    setPassword("");
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <form
          onSubmit={handleLogin}
          className="bg-white p-8 rounded-lg shadow-md w-80"
        >
          <h2 className="text-2xl font-bold mb-6 text-center">تسجيل الدخول</h2>
          {loginError && (
            <p className="text-red-500 mb-4 text-center">{loginError}</p>
          )}
          <div className="mb-4">
            <label className="block mb-1 font-medium">اسم المستخدم</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2"
              required
            />
          </div>
          <div className="mb-6">
            <label className="block mb-1 font-medium">كلمة المرور</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
          >
            تسجيل الدخول
          </button>
        </form>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="App min-h-screen bg-gradient-to-br from-slate-50 to-blue-50" dir="rtl">
      <BrowserRouter>
        <div className="flex justify-end p-4 bg-white shadow">
          <button
            onClick={handleLogout}
            className="bg-red-500 text-white px-4 py-1 rounded hover:bg-red-600 transition"
          >
            تسجيل الخروج
          </button>
        </div>
        <Routes>
          <Route
            path="/"
            element={
              <QuotesList
                quotes={quotes}
                onQuotesChange={fetchQuotes}
                company={company}
              />
            }
          />
          <Route
            path="/new"
            element={<QuoteForm onSuccess={fetchQuotes} company={company} />}
          />
          <Route
            path="/edit/:id"
            element={<QuoteForm onSuccess={fetchQuotes} company={company} />}
          />
          <Route path="/view/:id" element={<QuoteView company={company} />} />
          <Route
            path="/settings"
            element={
              <CompanySettings
                company={company}
                onCompanyUpdate={fetchCompanyInfo}
              />
            }
          />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
        <Toaster />
      </BrowserRouter>
    </div>
  );
}

export default App;
