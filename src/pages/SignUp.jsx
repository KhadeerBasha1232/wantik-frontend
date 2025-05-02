import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const SignUp = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    password2: "",
  });
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("https://wantik-backend-kb.onrender.com/auth/signup/", formData);
      setError(null);
      toast.success("Registration successful! Please sign in.", {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        style: {
          fontSize: "0.9rem",
          color: "#333",
          backgroundColor: "#fff",
          border: "1px solid #22c55e",
        },
      });
      navigate("/signin");
    } catch (err) {
      console.error(err.response?.data);
      let errorMessage = "Registration failed. Please try again.";
      if (err.response?.data) {
        errorMessage = Object.values(err.response.data)
          .flat()
          .join("; ") || "Registration failed. Please check your input.";
      }
      setError(errorMessage);
      toast.error(errorMessage, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        style: {
          fontSize: "0.9rem",
          color: "#333",
          backgroundColor: "#fff",
          border: "1px solid #dc2626",
        },
      });
    }
  };

  const handleSignInClick = () => {
    navigate("/signin");
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        backgroundColor: "#f3f4f6",
        padding: "2rem",
      }}
    >
      <div
        style={{
          backgroundColor: "#fff",
          padding: "2rem",
          borderRadius: "10px",
          width: "100%",
          maxWidth: "400px",
          boxShadow: "0 8px 16px rgba(0, 0, 0, 0.2)",
          border: "1px solid #e0e0e0",
        }}
      >
        <form onSubmit={handleSubmit}>
          <h2
            style={{
              fontSize: "1.5rem",
              color: "#333",
              margin: "0 0 1rem 0",
              textAlign: "center",
            }}
          >
            Sign Up
          </h2>
          {error && (
            <div
              style={{
                color: "#dc2626",
                fontSize: "0.8rem",
                marginBottom: "1rem",
                textAlign: "center",
              }}
            >
              {error}
            </div>
          )}
          <div style={{ marginBottom: "1rem" }}>
            <label
              style={{
                display: "block",
                color: "#333",
                fontSize: "0.9rem",
                marginBottom: "0.25rem",
              }}
            >
              Username
            </label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Enter username"
              required
              style={{
                padding: "0.5rem",
                border: "1px solid #ccc",
                borderRadius: "5px",
                fontSize: "0.9rem",
                width: "100%",
                boxSizing: "border-box",
              }}
            />
          </div>
          <div style={{ marginBottom: "1rem" }}>
            <label
              style={{
                display: "block",
                color: "#333",
                fontSize: "0.9rem",
                marginBottom: "0.25rem",
              }}
            >
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter email"
              required
              style={{
                padding: "0.5rem",
                border: "1px solid #ccc",
                borderRadius: "5px",
                fontSize: "0.9rem",
                width: "100%",
                boxSizing: "border-box",
              }}
            />
          </div>
          <div style={{ marginBottom: "1rem" }}>
            <label
              style={{
                display: "block",
                color: "#333",
                fontSize: "0.9rem",
                marginBottom: "0.25rem",
              }}
            >
              Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter password"
              required
              style={{
                padding: "0.5rem",
                border: "1px solid #ccc",
                borderRadius: "5px",
                fontSize: "0.9rem",
                width: "100%",
                boxSizing: "border-box",
              }}
            />
          </div>
          <div style={{ marginBottom: "1rem" }}>
            <label
              style={{
                display: "block",
                color: "#333",
                fontSize: "0.9rem",
                marginBottom: "0.25rem",
              }}
            >
              Confirm Password
            </label>
            <input
              type="password"
              name="password2"
              value={formData.password2}
              onChange={handleChange}
              placeholder="Confirm password"
              required
              style={{
                padding: "0.5rem",
                border: "1px solid #ccc",
                borderRadius: "5px",
                fontSize: "0.9rem",
                width: "100%",
                boxSizing: "border-box",
              }}
            />
          </div>
          <button
            type="submit"
            style={{
              padding: "0.5rem 1rem",
              backgroundColor: "#000",
              color: "#fff",
              border: "none",
              borderRadius: "5px",
              fontSize: "0.9rem",
              cursor: "pointer",
              textTransform: "uppercase",
              width: "100%",
              transition: "background-color 0.3s",
            }}
            onMouseOver={(e) => (e.target.style.backgroundColor = "#333")}
            onMouseOut={(e) => (e.target.style.backgroundColor = "#000")}
          >
            Register
          </button>
        </form>
        <button
          onClick={handleSignInClick}
          style={{
            padding: "0.5rem 1rem",
            backgroundColor: "#000",
            color: "#fff",
            border: "none",
            borderRadius: "5px",
            fontSize: "0.9rem",
            cursor: "pointer",
            textTransform: "uppercase",
            width: "100%",
            marginTop: "1rem",
            transition: "background-color 0.3s",
          }}
          onMouseOver={(e) => (e.target.style.backgroundColor = "#333")}
          onMouseOut={(e) => (e.target.style.backgroundColor = "#000")}
        >
          Sign In
        </button>
      </div>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </div>
  );
};

export default SignUp;