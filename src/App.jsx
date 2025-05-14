import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Route, Routes, Navigate, Outlet, useLocation } from "react-router-dom";
import axios from "axios";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import SignUp from "./pages/SignUp";
import SignIn from "./pages/SignIn";
import SalesHome from "./pages/sales/Home";
import Contacts from "./pages/sales/Contacts";
import Incoming from "./pages/sales/Incoming";
import Outgoing from "./pages/sales/Outgoing";
import Quotation from "./pages/sales/Quotation";
import JobCards from "./pages/sales/JobCards";
import SalesOrder from "./pages/sales/SalesOrder";
import Home from "./pages/Home";
import HrHome from "./pages/hr/HrHome";
import StaffPortal from "./pages/hr/StaffPortal";
import StaffDetails from "./pages/hr/StaffDetails";
import VisaStatus from "./pages/hr/VisaStatus";
import Attendance from "./pages/hr/Attendance";
import Leaves from "./pages/hr/Leaves";
import Loans from "./pages/hr/Loans";
import Overtimes from "./pages/hr/Overtimes";
import Fines from "./pages/hr/Fines";
import Appraisals from "./pages/hr/Appraisals";
import Performance from "./pages/hr/Performance";
import StaffPerformance from "./pages/hr/StaffPerformance";
import InventoryHome from "./pages/Inventory/InventoryHome";
import STSInventory from "./pages/Inventory/StsInventory";
import STSInventoryType from "./pages/Inventory/StsInventoryType";
import STSInventoryTypeRemove from "./pages/Inventory/StsInventoryTypeRemove";

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
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
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
          <Route path="/sales/home" element={<SalesHome />} />
          <Route path="/sales/contacts" element={<Contacts />} />
          <Route path="/sales/jobcards" element={<JobCards />} />
          <Route path="/sales/salesorder" element={<SalesOrder />} />
          <Route path="/sales/incoming/:year" element={<Incoming />} />
          <Route path="/sales/outgoing/:year" element={<Outgoing />} />
          <Route path="/sales/quotations/:year" element={<Quotation />} />


          <Route path="/hr/home" element={<HrHome />} />
          <Route path="/hr/:type" element={<StaffPortal />} />
          <Route path="/hr/:type/staffdetails" element={<StaffDetails />} />
          <Route path="/hr/:type/visastatus" element={<VisaStatus />} />
          <Route path="/hr/:type/attendance" element={<Attendance />} />
          <Route path="/hr/:type/leaves" element={<Leaves />} />
          <Route path="/hr/:type/loans" element={<Loans />} />
          <Route path="/hr/:type/overtimes" element={<Overtimes />} />
          <Route path="/hr/:type/fines" element={<Fines />} />
          <Route path="/hr/:type/appraisals" element={<Appraisals />} />
          <Route path="/hr/:type/performance" element={<Performance />} />
          <Route path="/hr/:type/performance/:staff_id" element={<StaffPerformance />} />
          
          
          <Route path="/inventory/home" element={<InventoryHome />} />
          <Route path="/inventory/sts-inventory" element={<STSInventory />} /> 
          <Route path="/inventory/sts-inventory/:type" element={<STSInventoryType />} />
          <Route path="/inventory/sts-inventory/:type/removestock" element={<STSInventoryTypeRemove />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
