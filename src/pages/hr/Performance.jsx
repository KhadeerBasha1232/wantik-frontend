import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";

const Performance = () => {
  const navigate = useNavigate();
  const { type } = useParams(); // Get the type parameter from the URL
  const [staffList, setStaffList] = useState([]);
  const [error, setError] = useState("");
  const token = localStorage.getItem("accessToken");

  // Validate type and redirect if invalid
  useEffect(() => {
    if (!["staff", "manpower"].includes(type)) {
      navigate("/hr/home");
    }
  }, [type, navigate]);

  useEffect(() => {
    if (!token) {
      setError("Please log in to view staff details.");
      return;
    }
    if (!type) return; // Wait for type validation

    axios
      .get(`http://127.0.0.1:8000/hr/${type}/staffdetails/`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setStaffList(res.data);
        setError("");
      })
      .catch((err) => {
        console.error("Error fetching staff details:", err.response?.data);
        setError("Failed to load staff details.");
      });
  }, [token, type]);

  const handleStaffClick = (staffId) => {
    navigate(`/hr/${type}/performance/${staffId}`);
  };

  return (
    <div className="container-fluid p-5">
      <style>
        {`
          .custom-btn:hover {
            background-color: #555 !important;
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
          }
          .custom-btn {
            width: 100%;
            height: 15vh;
            min-width: 180px;
            min-height: 100px;
            font-size: 1rem;
            border-radius: 10px;
            display: flex;
            justify-content: center;
            align-items: center;
            background-color: #222;
            color: #fff;
            transition: all 0.3s ease;
            border: 1px solid #444;
            text-transform: uppercase;
          }
          .button-grid {
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            gap: 1rem;
          }
          .button-grid .col {
            flex: 0 0 30%;
            max-width: 30%;
          }
          @media (max-width: 768px) {
            .button-grid .col {
              flex: 0 0 100%;
              max-width: 100%;
            }
          }
          .error-text {
            color: red;
            font-size: 0.85rem;
            margin-bottom: 1rem;
          }
          .header {
            color: #333;
            font-size: 1.5rem;
            margin-bottom: 1rem;
            text-align: center;
          }
        `}
      </style>
      <h2 className="header">
        Performance Management - {type === "staff" ? "Staff" : "Manpower"}
      </h2>
      {error && <div className="error-text">{error}</div>}
      <div className="button-grid">
        {staffList.length === 0 ? (
          <p>No {type === "staff" ? "staff" : "manpower"} members found.</p>
        ) : (
          staffList.map((staff) => (
            <div key={staff.staff_id} className="col">
              <button
                onClick={() => handleStaffClick(staff.staff_id)}
                className="custom-btn"
              >
                {staff.staff_id} - {staff.name}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Performance;