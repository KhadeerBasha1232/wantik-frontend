import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

const Incoming = () => {
  const { year } = useParams();
  const [inquiries, setInquiries] = useState([]);
  const [filteredInquiries, setFilteredInquiries] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [users, setUsers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({ company_name: "", contact_number: "", inquiry: "" });
  const [filters, setFilters] = useState({ searchInquiry: "", searchCompany: "", searchContactNumber: "", fromDate: "", toDate: "", status: "" });
  const navigate = useNavigate();
  const token = localStorage.getItem("accessToken");

  useEffect(() => {
    if (!token) return console.error("Access token not found.");
    Promise.all([
      axios.get(`https://wantik-backend-kb.onrender.com/sales/inquiries/?year=${year}`, { headers: { Authorization: `Bearer ${token}` } }).then(res => { setInquiries(res.data); setFilteredInquiries(res.data); }),
      axios.get("https://wantik-backend-kb.onrender.com/sales/incoming-companies/", { headers: { Authorization: `Bearer ${token}` } }).then(res => setCompanies(res.data)),
      axios.get("https://wantik-backend-kb.onrender.com/sales/users/", { headers: { Authorization: `Bearer ${token}` } }).then(res => setUsers(res.data))
    ]).catch(err => console.error("Error fetching data:", err));
  }, [year, token]);

  useEffect(() => {
    setFilteredInquiries(inquiries.filter(inquiry => (
      (!filters.searchInquiry || inquiry.inquiry.toLowerCase().includes(filters.searchInquiry.toLowerCase())) &&
      (!filters.searchCompany || inquiry.company_name.toLowerCase().includes(filters.searchCompany.toLowerCase())) &&
      (!filters.searchContactNumber || inquiry.contact_number.toLowerCase().includes(filters.searchContactNumber.toLowerCase())) &&
      (filters.status === "all" || !filters.status || inquiry.status === filters.status) &&
      (!filters.fromDate && !filters.toDate || (() => {
        const inquiryDate = new Date(inquiry.created_on).getTime();
        const from = filters.fromDate ? new Date(filters.fromDate).getTime() : null;
        const to = filters.toDate ? new Date(filters.toDate).getTime() : null;
        return (!from || inquiryDate >= from) && (!to || inquiryDate <= to);
      })())
    )));
  }, [filters, inquiries]);

  const handleFilterChange = e => setFilters({ ...filters, [e.target.name]: e.target.value });

  const handleCreateInquiry = () => {
    setShowForm(true);
    setIsEditing(false);
    setFormData({ company_name: "", contact_number: "", inquiry: "" });
  };

  const handleEditInquiry = inquiry => {
    setShowForm(true);
    setIsEditing(true);
    setEditId(inquiry.id);
    setFormData({ company_name: inquiry.company_name, contact_number: inquiry.contact_number, inquiry: inquiry.inquiry });
  };

  const handleInputChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleCompanyChange = e => {
    const companyName = e.target.value;
    const company = companies.find(c => c.company_name === companyName);
    setFormData({ ...formData, company_name: companyName, contact_number: company ? company.contact_number : "" });
  };

  const handleStatusChange = (id, status) => {
    if (!token) return console.error("Access token not found.");
    axios.patch(`https://wantik-backend-kb.onrender.com/sales/inquiries/${id}/`, { status }, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setInquiries(inquiries.map(inquiry => inquiry.id === id ? { ...inquiry, status: res.data.status } : inquiry)))
      .catch(err => console.error("Error updating status:", err));
  };

  const handleAssignToChange = (id, assignToId) => {
    if (!token) return console.error("Access token not found.");
    axios.patch(`https://wantik-backend-kb.onrender.com/sales/inquiries/${id}/`, { assign_to: assignToId }, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setInquiries(inquiries.map(inquiry => inquiry.id === id ? { ...inquiry, assign_to: res.data.assign_to } : inquiry)))
      .catch(err => console.error("Error updating assign_to:", err));
  };

  const handleSubmit = e => {
    e.preventDefault();
    if (!token) return console.error("Access token not found.");
    axios[isEditing ? "put" : "post"](`https://wantik-backend-kb.onrender.com/sales/inquiries/${isEditing ? `${editId}/` : ""}`, formData, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
        setInquiries(isEditing ? inquiries.map(inquiry => inquiry.id === editId ? res.data : inquiry) : [res.data, ...inquiries]);
        setShowForm(false);
        setIsEditing(false);
        setEditId(null);
      })
      .catch(err => console.error("Error submitting inquiry:", err));
  };

  const buttonStyle = { padding: "0.5rem 1rem", backgroundColor: "#000", color: "#fff", border: "none", borderRadius: "5px", fontSize: "0.9rem", cursor: "pointer", textTransform: "uppercase", transition: "background-color 0.3s" };
  const smallButtonStyle = { ...buttonStyle, padding: "0.3rem 0.5rem", fontSize: "0.8rem" };
  const inputStyle = { padding: "0.5rem", border: "1px solid #ccc", borderRadius: "5px", fontSize: "0.9rem", boxSizing: "border-box" };
  const selectStyle = { padding: "0.25rem", border: "1px solid #ccc", borderRadius: "5px", fontSize: "0.9rem", boxSizing: "border-box" };
  const modalStyle = { position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0, 0, 0, 0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 };
  const modalContentStyle = { backgroundColor: "#fff", padding: "2rem", borderRadius: "10px", width: "90%", maxWidth: "600px", boxShadow: "0 8px 16px rgba(0, 0, 0, 0.2)", position: "relative", border: "1px solid #e0e0e0" };
  const closeBtnStyle = { position: "absolute", top: "15px", right: "15px", fontSize: "24px", cursor: "pointer", color: "#666", backgroundColor: "transparent", border: "none", width: "30px", height: "30px", display: "flex", alignItems: "center", justifyContent: "center", transition: "color 0.3s, transform 0.3s" };

  return (
    <div style={{ padding: "2rem" }}>
      <h2 style={{ marginBottom: "1rem", color: "#333", fontSize: "1.5rem" }}>{`${year} - INCOMING INQUIRIES`}</h2>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "1rem", marginBottom: "1rem" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", alignItems: "center" }}>
          {[
            { name: "searchInquiry", label: "Search by Inquiry", width: "200px" },
            { name: "searchCompany", label: "Search by Company", width: "200px" },
            { name: "searchContactNumber", label: "Search by Contact Number", width: "200px" },
            { name: "fromDate", label: "From", type: "date", width: "150px" },
            { name: "toDate", label: "To", type: "date", width: "150px" },
          ].map(({ name, label, type = "text", width }) => (
            <div key={name}>
              <label style={{ display: "block", color: "#333", fontSize: "0.9rem", marginBottom: "0.25rem" }}>{label}</label>
              <input type={type} name={name} value={filters[name]} onChange={handleFilterChange} style={{ ...inputStyle, width }} />
            </div>
          ))}
          <div>
            <label style={{ display: "block", color: "#333", fontSize: "0.9rem", marginBottom: "0.25rem" }}>Status</label>
            <select name="status" value={filters.status} onChange={handleFilterChange} style={{ ...inputStyle, width: "150px" }}>
              <option value="all">All Statuses</option>
              <option value="new">New</option>
              <option value="open">Open</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>
        <div>
          <button onClick={handleCreateInquiry} style={buttonStyle} onMouseOver={e => e.target.style.backgroundColor = "#333"} onMouseOut={e => e.target.style.backgroundColor = "#000"} aria-label="Add inquiry">Add Inquiry</button>
        </div>
      </div>
      {showForm && (
        <div style={modalStyle}>
          <div style={modalContentStyle}>
            <span onClick={() => setShowForm(false)} style={closeBtnStyle}>×</span>
            <form onSubmit={handleSubmit} style={{ padding: "1rem 0" }}>
              <h2 style={{ marginBottom: "1rem", fontSize: "1.5rem", color: "#333" }}>{isEditing ? "Edit Inquiry" : "Add Inquiry"}</h2>
              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", color: "#333", fontSize: "0.9rem", marginBottom: "0.25rem" }}>Company Name:</label>
                <select name="company_name" value={formData.company_name} onChange={handleCompanyChange} required style={{ ...inputStyle, width: "100%" }}>
                  <option value="">Select Company</option>
                  {companies.map(company => <option key={company.id} value={company.company_name}>{company.company_name}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", color: "#333", fontSize: "0.9rem", marginBottom: "0.25rem" }}>Contact Number:</label>
                <input type="text" name="contact_number" value={formData.contact_number} onChange={handleInputChange} required style={{ ...inputStyle, width: "100%" }} />
              </div>
              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", color: "#333", fontSize: "0.9rem", marginBottom: "0.25rem" }}>Inquiry:</label>
                <textarea name="inquiry" value={formData.inquiry} onChange={handleInputChange} required style={{ ...inputStyle, width: "100%", minHeight: "100px" }} />
              </div>
              <button type="submit" style={{ ...buttonStyle, width: "100%" }} onMouseOver={e => e.target.style.backgroundColor = "#333"} onMouseOut={e => e.target.style.backgroundColor = "#000"} aria-label={isEditing ? "Update inquiry" : "Submit inquiry"}>
                {isEditing ? "Update Inquiry" : "Submit Inquiry"}
              </button>
            </form>
          </div>
        </div>
      )}
      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "1rem" }}>
        <thead>
          <tr style={{ backgroundColor: "#000", color: "#fff" }}>
            {["S.No", "Company Name", "Contact Name", "Contact Number", "Status", "Inquiry", "Assign To", "Create Date", "Actions"].map(header => (
              <th key={header} style={{ border: "1px solid #000", padding: "0.5rem" }}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filteredInquiries.map((inquiry, index) => (
            <tr key={inquiry.id} style={{ backgroundColor: "#fff" }}>
              <td style={{ border: "1px solid #000", padding: "0.5rem" }}>{index + 1}</td>
              <td style={{ border: "1px solid #000", padding: "0.5rem" }}>{inquiry.company_name}</td>
              <td style={{ border: "1px solid #000", padding: "0.5rem" }}>{inquiry.contact_name}</td>
              <td style={{ border: "1px solid #000", padding: "0.5rem" }}>{inquiry.contact_number}</td>
              <td style={{ border: "1px solid #000", padding: "0.5rem" }}>
                <select value={inquiry.status} onChange={e => handleStatusChange(inquiry.id, e.target.value)} style={{ ...selectStyle, width: "100%" }}>
                  <option value="new">New</option>
                  <option value="open">Open</option>
                  <option value="closed">Closed</option>
                </select>
              </td>
              <td style={{ border: "1px solid #000", padding: "0.5rem" }}>{inquiry.inquiry}</td>
              <td style={{ border: "1px solid #000", padding: "0.5rem" }}>
                <select value={inquiry.assign_to || ""} onChange={e => handleAssignToChange(inquiry.id, e.target.value)} style={{ ...selectStyle, width: "100%" }}>
                  <option value="">Select User</option>
                  {users.map(user => <option key={user.id} value={user.id}>{user.username}</option>)}
                </select>
              </td>
              <td style={{ border: "1px solid #000", padding: "0.5rem" }}>{new Date(inquiry.created_on).toLocaleDateString()}</td>
              <td style={{ border: "1px solid #000", padding: "0.5rem" }}>
                <button onClick={() => handleEditInquiry(inquiry)} style={smallButtonStyle} onMouseOver={e => e.target.style.backgroundColor = "#333"} onMouseOut={e => e.target.style.backgroundColor = "#000"} aria-label="Edit inquiry">Edit</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Incoming;