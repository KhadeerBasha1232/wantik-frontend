import React from "react";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const navigate = useNavigate();
  const buttonStyle = {
    padding: "0.5rem 1rem", backgroundColor: "#000", color: "#fff", border: "none", borderRadius: "5px",
    fontSize: "0.9rem", cursor: "pointer", textTransform: "uppercase", transition: "background-color 0.3s"
  };
  const handleClick = (year, type) => navigate(`/${type}/${year}`);
  const handleLogout = () => (localStorage.clear(), navigate("/signin"));

  return (
    <div style={{ padding: "2rem", textAlign: "center", minHeight: "100vh", position: "relative" }}>
      <button onClick={handleLogout} style={{ ...buttonStyle, position: "absolute", top: "1rem", right: "1rem" }}
        onMouseOver={(e) => (e.target.style.backgroundColor = "#333")}
        onMouseOut={(e) => (e.target.style.backgroundColor = "#000")} aria-label="Logout">Logout</button>
      <h1 style={{ fontSize: "1.5rem", color: "#333", marginBottom: "2rem" }}>Sales</h1>
      <button onClick={() => navigate("/contacts")} style={{ ...buttonStyle, width: "100%", maxWidth: "300px", margin: "0 auto 1rem auto" }}
        onMouseOver={(e) => (e.target.style.backgroundColor = "#333")}
        onMouseOut={(e) => (e.target.style.backgroundColor = "#000")} aria-label="Go to contacts">Contacts</button>
      <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap", width: "100%" }}>
        {["incoming", "outgoing"].map(type => (
          <button key={type} onClick={() => handleClick(2025, type)} style={{ ...buttonStyle, flex: "1", minWidth: "200px" }}
            onMouseOver={(e) => (e.target.style.backgroundColor = "#333")}
            onMouseOut={(e) => (e.target.style.backgroundColor = "#000")} aria-label={`View 2025 ${type} quotes`}>
            {`2025 - ${type.toUpperCase()}`}
          </button>
        ))}
      </div>
    </div>
  );
};

export default Home;
