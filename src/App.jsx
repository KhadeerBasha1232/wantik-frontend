import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Route, Routes, Navigate, Outlet, useLocation } from "react-router-dom";
import axios from "axios";
import SignUp from "./pages/SignUp";
import SignIn from "./pages/SignIn";
import Home from "./pages/Home";
import Contacts from "./pages/Contacts";
import Incoming from "./pages/Incoming";
import Outgoing from "./pages/Outgoing";
import Quotation from "./pages/Quotation";
import JobCards from "./pages/JobCards";
import SalesOrder from "./pages/SalesOrder";

const PrivateRoute = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(null); // null = verifying, true = valid, false = invalid
  const token = localStorage.getItem("accessToken");
  const location = useLocation();

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setIsAuthenticated(false);
        return;
      }

      try {
        const res = await axios.post(
          "http://127.0.0.1:8000/auth/verify/",
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (res.data.valid) {
          setIsAuthenticated(true);
        } else {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          setIsAuthenticated(false);
        }
      } catch (err) {
        console.error("Token verification failed:", err.response?.data);
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        setIsAuthenticated(false);
      }
    };

    verifyToken();
  }, [token, location.pathname]); // Re-run on token or pathname change

  // Show loading state while verifying
  if (isAuthenticated === null) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          backgroundColor: "#f3f4f6",
          color: "#333",
          fontSize: "1rem",
        }}
      >
        Verifying...
      </div>
    );
  }

  // Render Outlet if authenticated, otherwise navigate to /signin
  return isAuthenticated ? <Outlet /> : <Navigate to="/signin" replace />;
};

const PublicRoute = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(null); // null = verifying, true = valid, false = invalid
  const token = localStorage.getItem("accessToken");
  const location = useLocation();

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setIsAuthenticated(false);
        return;
      }

      try {
        const res = await axios.post(
          "http://127.0.0.1:8000/auth/verify/",
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (res.data.valid) {
          setIsAuthenticated(true);
        } else {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          setIsAuthenticated(false);
        }
      } catch (err) {
        console.error("Token verification failed:", err.response?.data);
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        setIsAuthenticated(false);
      }
    };

    verifyToken();
  }, [token, location.pathname]); // Re-run on token or pathname change

  // Show loading state while verifying
  if (isAuthenticated === null) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          backgroundColor: "#f3f4f6",
          color: "#333",
          fontSize: "1rem",
        }}
      >
        Verifying...
      </div>
    );
  }

  // Render Outlet if not authenticated, otherwise navigate to /home
  return isAuthenticated ? <Navigate to="/home" replace /> : <Outlet />;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route element={<PublicRoute />}>
          <Route path="/signup" element={<SignUp />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/" element={<Navigate to="/signin" replace />} />
        </Route>
        
        {/* Protected Routes */}
        <Route element={<PrivateRoute />}>
          <Route path="/home" element={<Home />} />
          <Route path="/contacts" element={<Contacts />} />
          <Route path="/jobcards" element={<JobCards />} />
          <Route path="/salesorder" element={<SalesOrder />} />
          <Route path="/incoming/:year" element={<Incoming />} />
          <Route path="/outgoing/:year" element={<Outgoing />} />
          <Route path="/quotations/:year" element={<Quotation />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;