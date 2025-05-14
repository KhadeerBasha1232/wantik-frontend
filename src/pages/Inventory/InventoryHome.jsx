import React from "react";
import { useNavigate } from "react-router-dom";

const InventoryHome = () => {
  const navigate = useNavigate();

  const buttons = [
    { label: "STS Inventory", action: () => navigate("/inventory/sts-inventory"), aria: "Go to STS Inventory" },
    { label: "Customer Inventory", action: () => navigate("/inventorycustomer-inventory"), aria: "Go to Customer Inventory" },
  ];

  return (
    <div className="container-fluid p-5 text-center min-vh-90 position-relative">
      <style>
        {`
          .custom-btn:hover {
            background-color: #555 !important;
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
          }
          .custom-btn {
            width: 100%;
            height: 20vh;
            min-width: 180px;
            min-height: 120px;
            font-size: 1.1rem;
            border-radius: 15px;
            display: flex;
            justify-content: center;
            align-items: center;
            background-color: #222;
            color: #fff;
            transition: all 0.3s ease;
            border: 1px solid #444;
          }
          .custom-logout-btn {
            font-size: 0.9rem;
            border-radius: 5px;
            background-color: #dc3545;
            border: none;
          }
          .custom-logout-btn:hover {
            background-color: #c82333 !important;
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
        `}
      </style>
      <button
        onClick={() => {
          localStorage.clear();
          navigate("/signin");
        }}
        className="btn custom-logout-btn text-uppercase position-absolute top-0 end-0 mt-3 me-3 text-white"
        aria-label="Logout"
      >
        Logout
      </button>
      <h1 className="mb-5 fs-3 text-dark">Inventory</h1>
      <div className="button-grid">
        {buttons.map(({ label, action, aria }) => (
          <div key={label} className="col">
            <button
              onClick={action}
              className="btn custom-btn text-uppercase w-100"
              aria-label={aria}
            >
              {label}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default InventoryHome;