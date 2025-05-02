import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Contacts = () => {
  const [contacts, setContacts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editFormData, setEditFormData] = useState({ company_name: "", contact_name: "", company_email: "", contact_email: "", company_number: "", contact_number: "", license_number: "", license_expiry_date: "", tirn_number: "", license_file: null });
  const [editId, setEditId] = useState(null);
  const [filterCompany, setFilterCompany] = useState("");
  const token = localStorage.getItem("accessToken");
  const navigate = useNavigate();

  useEffect(() => { fetchContacts(); }, []);

  const fetchContacts = async () => {
    try {
      const response = await axios.get("https://wantik-backend-kb.onrender.com/sales/contacts/all/", { headers: { Authorization: `Bearer ${token}` } });
      setContacts(response.data);
    } catch (error) {
      console.error("Error fetching contacts", error);
    }
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    name === "filterCompany" ? setFilterCompany(value) : setEditFormData({ ...editFormData, [name]: files ? files[0] : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = new FormData();
    for (let key in editFormData) {
      if (key !== "license_file" || (key === "license_file" && editFormData[key])) {
        payload.append(key, editFormData[key]);
      }
    }
    try {
      await axios[editId ? "put" : "post"](`https://wantik-backend-kb.onrender.com/sales/contacts/${editId ? `${editId}/` : ""}`, payload, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" }
      });
      fetchContacts();
      setShowForm(false);
      setEditId(null);
      setEditFormData({ company_name: "", contact_name: "", company_email: "", contact_email: "", company_number: "", contact_number: "", license_number: "", license_expiry_date: "", tirn_number: "", license_file: null });
    } catch (error) {
      console.error("Error submitting form", error);
    }
  };

  const handleEdit = (contact) => {
    setEditFormData({ ...contact, license_file: null });
    setEditId(contact.id);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditId(null);
    setEditFormData({ company_name: "", contact_name: "", company_email: "", contact_email: "", company_number: "", contact_number: "", license_number: "", license_expiry_date: "", tirn_number: "", license_file: null });
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this contact?")) {
      try {
        await axios.delete(`https://wantik-backend-kb.onrender.com/sales/contacts/${id}/`, { headers: { Authorization: `Bearer ${token}` } });
        fetchContacts();
      } catch (error) {
        console.error("Error deleting contact", error);
      }
    }
  };


  const filteredContacts = contacts.filter((contact) => contact.company_name.toLowerCase().includes(filterCompany.toLowerCase()));
  const buttonStyle = { padding: "0.5rem 1rem", backgroundColor: "#000", color: "#fff", border: "none", borderRadius: "5px", fontSize: "0.9rem", cursor: "pointer", textTransform: "uppercase", transition: "background-color 0.3s" };
  const smallButtonStyle = { ...buttonStyle, padding: "0.3rem 0.5rem", fontSize: "0.8rem", marginRight: "0.5rem" };
  const inputStyle = { width: "100%", padding: "0.5rem", border: "1px solid #ccc", borderRadius: "5px", fontSize: "0.9rem", boxSizing: "border-box" };
  const modalStyle = { position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0, 0, 0, 0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 };
  const modalContentStyle = { backgroundColor: "#fff", padding: "2rem", borderRadius: "10px", width: "90%", maxWidth: "600px", boxShadow: "0 8px 16px rgba(0, 0, 0, 0.2)", position: "relative", border: "1px solid #e0e0e0" };
  const closeBtnStyle = { position: "absolute", top: "15px", right: "15px", fontSize: "24px", cursor: "pointer", color: "#666", backgroundColor: "transparent", border: "none", width: "30px", height: "30px", display: "flex", alignItems: "center", justifyContent: "center", transition: "color 0.3s, transform 0.3s" };

  return (
    <div style={{ padding: "2rem" }}>
      <h1 style={{ fontSize: "1.5rem", color: "#333", marginBottom: "1rem" }}>Contacts</h1>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <input type="text" name="filterCompany" placeholder="Search by Company" value={filterCompany} onChange={handleChange} style={{ ...inputStyle, width: "250px" }} />
        <div>
          <button onClick={() => setShowForm(true)} style={buttonStyle} onMouseOver={(e) => (e.target.style.backgroundColor = "#333")} onMouseOut={(e) => (e.target.style.backgroundColor = "#000")} aria-label="Add contact">
            Add Contact
          </button>
        </div>
      </div>
      {showForm && (
        <div style={modalStyle}>
          <div style={modalContentStyle}>
            <span onClick={handleCloseForm} style={closeBtnStyle}>×</span>
            <form onSubmit={handleSubmit} style={{ padding: "1rem 0" }}>
              <h2 style={{ marginBottom: "1rem", fontSize: "1.5rem", color: "#333" }}>{editId ? "Edit Contact" : "Add Contact"}</h2>
              {[["company_name", "Company Name"], ["contact_name", "Contact Name"], ["company_email", "Company Email"], ["contact_email", "Contact Email"], ["company_number", "Company Number"], ["contact_number", "Contact Number"], ["license_number", "License Number"], ["license_expiry_date", "License Expiry Date"], ["tirn_number", "TIRN Number"]].map(([name, label]) => (
                <div key={name} style={{ marginBottom: "1rem" }}>
                  <label style={{ display: "block", color: "#333", fontSize: "0.9rem", marginBottom: "0.25rem" }}>{label}</label>
                  <input type={name.includes("date") ? "date" : "text"} name={name} value={editFormData[name]} onChange={handleChange} required style={inputStyle} />
                </div>
              ))}
              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", color: "#333", fontSize: "0.9rem", marginBottom: "0.25rem" }}>Upload License PDF</label>
                <input type="file" name="license_file" onChange={handleChange} required={editId === null} style={inputStyle} />
              </div>
              <button type="submit" style={{ ...buttonStyle, width: "100%" }} onMouseOver={(e) => (e.target.style.backgroundColor = "#333")} onMouseOut={(e) => (e.target.style.backgroundColor = "#000")} aria-label={editId ? "Update contact" : "Save contact"}>
                {editId ? "Update Contact" : "Save Contact"}
              </button>
            </form>
          </div>
        </div>
      )}
      <table border="1" cellPadding="10" style={{ marginTop: "20px", width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ backgroundColor: "#000", color: "#fff" }}>
            {["S.No", "Company", "Contact", "Company Email", "Contact Email", "Company Phone", "Contact Phone", "License Number", "License Expiry", "TIRN", "License PDF", "Actions"].map((header) => (
              <th key={header} style={{ border: "1px solid #000" }}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filteredContacts.map((contact, index) => (
            <tr key={contact.id} style={{ backgroundColor: "#fff" }}>
              <td style={{ border: "1px solid #000" }}>{index + 1}</td>
              <td style={{ border: "1px solid #000" }}>{contact.company_name}</td>
              <td style={{ border: "1px solid #000" }}>{contact.contact_name}</td>
              <td style={{ border: "1px solid #000" }}>{contact.company_email}</td>
              <td style={{ border: "1px solid #000" }}>{contact.contact_email}</td>
              <td style={{ border: "1px solid #000" }}>{contact.company_number}</td>
              <td style={{ border: "1px solid #000" }}>{contact.contact_number}</td>
              <td style={{ border: "1px solid #000" }}>{contact.license_number}</td>
              <td style={{ border: "1px solid #000" }}>{contact.license_expiry_date}</td>
              <td style={{ border: "1px solid #000" }}>{contact.tirn_number}</td>
              <td style={{ border: "1px solid #000" }}>
                <button onClick={() => window.open(contact.license_file, "_blank")} style={smallButtonStyle} onMouseOver={(e) => (e.target.style.backgroundColor = "#333")} onMouseOut={(e) => (e.target.style.backgroundColor = "#000")} aria-label="View license">View License</button>
              </td>
              <td style={{ border: "1px solid #000" }}>
                <button onClick={() => handleEdit(contact)} style={smallButtonStyle} onMouseOver={(e) => (e.target.style.backgroundColor = "#333")} onMouseOut={(e) => (e.target.style.backgroundColor = "#000")} aria-label="Edit contact">Edit</button>
                <button onClick={() => handleDelete(contact.id)} style={{ ...smallButtonStyle, marginRight: 0 }} onMouseOver={(e) => (e.target.style.backgroundColor = "#333")} onMouseOut={(e) => (e.target.style.backgroundColor = "#000")} aria-label="Delete contact">Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Contacts;