import React from "react";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const navigate = useNavigate();

  const buttons = [
    { label: "Contacts", action: () => navigate("/contacts"), aria: "Go to contacts" },
    { label: "Jobcards", action: () => navigate("/jobcards"), aria: "Go to jobcards" },
    { label: "2025 - Incoming", action: () => navigate("/incoming/2025"), aria: "View 2025 incoming quotes" },
    { label: "2025 - Outgoing", action: () => navigate("/outgoing/2025"), aria: "View 2025 outgoing quotes" },
  ];

  return (
    <div className="container-fluid p-5 text-center min-vh-90 position-relative">
      <style>
        {`
          .custom-btn:hover {
            background-color: #333 !important;
          }
          .custom-btn {
            width: 45vw;
            height: 40vh;
            min-width: 200px;
            min-height: 150px;
            font-size: 1.2rem;
            border-radius: 25px;
            display: flex;
            justify-content: center;
            align-items: center;
          }
          .custom-logout-btn {
            font-size: 0.9rem;
            border-radius: 5px;
          }
        `}
      </style>
      <button
        onClick={() => {
          localStorage.clear();
          navigate("/signin");
        }}
        className="btn btn-dark custom-logout-btn text-uppercase position-absolute top-0 end-0 mt-3 me-3"
        aria-label="Logout"
      >
        Logout
      </button>
      <h1 className="mb-5 fs-3 text-dark">Sales</h1>
      <div className="row row-cols-2 g-3" style={{ height: "calc(100vh - 8rem)" }}>
        {buttons.map(({ label, action, aria }) => (
          <div key={label} className="col">
            <button
              onClick={action}
              className="btn btn-dark custom-btn text-uppercase w-100 h-100"
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

export default Home;