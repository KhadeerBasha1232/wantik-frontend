import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Attendance from "./Attendance"; // Assume these components exist
import Overtimes from "./Overtimes";
import Leaves from "./Leaves";
import Fines from "./Fines";
import VisaStatus from "./VisaStatus"; // To be created
import Loans from "./Loans";
import Appraisals from "./Appraisals";
import { useEffect } from "react";

const StaffPerformance = () => {
  const { staff_id, type } = useParams(); // Get staff_id and type from URL
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState(null);

  // Validate type and redirect if invalid
  useEffect(() => {
    if (!["staff", "manpower"].includes(type)) {
      navigate("/hr/home");
    }
  }, [type, navigate]);

  const sections = [
    { label: "Attendance", component: <Attendance staff_id={staff_id} staff_type={type} /> },
    { label: "Overtime", component: <Overtimes staff_id={staff_id} staff_type={type} /> },
    { label: "Leaves", component: <Leaves staff_id={staff_id} staff_type={type} /> },
    { label: "Fines", component: <Fines staff_id={staff_id} staff_type={type} /> },
    { label: "Visa Status", component: <VisaStatus staff_id={staff_id} staff_type={type} /> },
    { label: "Loan", component: <Loans staff_id={staff_id} staff_type={type} /> },
    { label: "Appraisal", component: <Appraisals staff_id={staff_id} staff_type={type} /> },
  ];

  const buttonStyle = {
    padding: "0.5rem 1rem",
    backgroundColor: "#000",
    color: "#fff",
    border: "none",
    borderRadius: "5px",
    fontSize: "0.9rem",
    cursor: "pointer",
    textTransform: "uppercase",
    transition: "background-color 0.3s",
    margin: "0.2rem",
  };

  return (
    <div style={{ padding: "2rem", margin: "0 auto" }}>
      <h2 style={{ marginBottom: "1rem", color: "#333", fontSize: "1.5rem" }}>
        Performance Records for {type === "staff" ? "Staff" : "Manpower"} ID: {staff_id}
      </h2>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", marginBottom: "2rem" }}>
        {sections.map(({ label }) => (
          <button
            key={label}
            onClick={() => setActiveSection(label)}
            style={{
              ...buttonStyle,
              backgroundColor: activeSection === label ? "#333" : "#000",
            }}
            onMouseOver={(e) => (e.target.style.backgroundColor = "#333")}
            onMouseOut={(e) =>
              (e.target.style.backgroundColor =
                activeSection === label ? "#333" : "#000")
            }
          >
            {label}
          </button>
        ))}
      </div>
      <div>
        {sections.find((section) => section.label === activeSection)?.component || (
          <p>Select a category to view records.</p>
        )}
      </div>
    </div>
  );
};

export default StaffPerformance;