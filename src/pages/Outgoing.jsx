import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

const Outgoing = () => {
  const { year } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ company_name: "", company_email: "", contact_email: "", mail_subject: "", quote_no: "", message: "" });
  const [companies, setCompanies] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [mails, setMails] = useState([]);
  const [filteredMails, setFilteredMails] = useState([]);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [viewMail, setViewMail] = useState(null);
  const [filters, setFilters] = useState({ searchMessage: "", searchCompany: "", searchContactNumber: "", fromDate: "", toDate: "", status: "" });
  const token = localStorage.getItem("accessToken");

  useEffect(() => {
    if (!token) return navigate("/signin");
    const axiosInstance = axios.create({ baseURL: "http://127.0.0.1:8000/sales/", headers: { Authorization: `Bearer ${token}` } });
    axiosInstance.interceptors.response.use(
      response => response,
      error => {
        if (error.response?.status === 401) {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          navigate("/signin");
          setError("Session expired. Please log in again.");
        }
        return Promise.reject(error);
      }
    );
    Promise.all([
      axiosInstance.get("quotation-companies/").then(res => setCompanies(res.data)),
      axiosInstance.get(`quotes/?year=${year}`).then(res => setQuotes(res.data)),
      axiosInstance.get(`outgoing-mails/?year=${year}`).then(res => { setMails(res.data); setFilteredMails(res.data); })
    ]).catch(err => setError("Failed to fetch data"));
  }, [year, token, navigate]);

  useEffect(() => {
    setFilteredMails(mails.filter(mail => (
      (!filters.searchMessage || mail.message.toLowerCase().includes(filters.searchMessage.toLowerCase())) &&
      (!filters.searchCompany || mail.company_name.toLowerCase().includes(filters.searchCompany.toLowerCase())) &&
      (!filters.searchContactNumber || (mail.contact_number || "").toLowerCase().includes(filters.searchContactNumber.toLowerCase())) &&
      (filters.status === "all" || !filters.status || mail.status === filters.status) &&
      (!filters.fromDate && !filters.toDate || (() => {
        const mailDate = new Date(mail.created_on).getTime();
        const from = filters.fromDate ? new Date(filters.fromDate).getTime() : null;
        const to = filters.toDate ? new Date(filters.toDate).getTime() : null;
        return (!from || mailDate >= from) && (!to || mailDate <= to);
      })())
    )));
  }, [filters, mails]);

  const handleFilterChange = e => setFilters({ ...filters, [e.target.name]: e.target.value });

  const handleCompanyChange = e => {
    const companyName = e.target.value;
    const selectedCompany = companies.find(c => c.company_name === companyName);
    setFormData({
      ...formData,
      company_name: companyName,
      company_email: selectedCompany ? selectedCompany.company_email : "",
      contact_email: selectedCompany ? selectedCompany.contact_email : "",
      quote_no: ""
    });
  };

  const handleInputChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleStatusChange = async (id, status) => {
    try {
      const res = await axios.patch(`http://127.0.0.1:8000/sales/outgoing-mails/${id}/`, { status }, { headers: { Authorization: `Bearer ${token}` } });
      setMails(mails.map(mail => mail.id === id ? res.data : mail));
      setFilteredMails(filteredMails.map(mail => mail.id === id ? res.data : mail));
    } catch (err) {
      setError("Failed to update status");
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!token) return navigate("/signin");
    try {
      const res = await axios.post("http://127.0.0.1:8000/sales/outgoing-mails/", { ...formData, year }, { headers: { Authorization: `Bearer ${token}` } });
      setMails([res.data, ...mails]);
      setFilteredMails([res.data, ...mails]);
      setFormData({ company_name: "", company_email: "", contact_email: "", mail_subject: "", quote_no: "", message: "" });
      setShowForm(false);
      setError(null);
    } catch (err) {
      setError(err.response?.status === 401 ? "Session expired. Please log in again." : err.response?.data ? Object.values(err.response.data).flat().join("; ") : "Failed to send email");
      if (err.response?.status === 401) navigate("/signin");
    }
  };

  const handleViewQuotations = () => navigate(`/quotations/${year}`);

  const handleViewMail = mail => setViewMail(mail);

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    navigate("/signin", { replace: true });
  };

  const formatDate = dateString => new Date(dateString).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });

  const filteredQuotes = quotes.filter(quote => quote.company_name === formData.company_name);

  const buttonStyle = { padding: "0.5rem 1rem", backgroundColor: "#000", color: "#fff", border: "none", borderRadius: "5px", fontSize: "0.9rem", cursor: "pointer", textTransform: "uppercase", transition: "background-color 0.3s" };
  const smallButtonStyle = { ...buttonStyle, padding: "0.3rem 0.5rem", fontSize: "0.8rem" };
  const inputStyle = { padding: "0.5rem", border: "1px solid #ccc", borderRadius: "5px", fontSize: "0.9rem", width: "100%", boxSizing: "border-box" };
  const selectStyle = { ...inputStyle, padding: "0.25rem" };
  const modalStyle = { position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0, 0, 0, 0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 };
  const modalContentStyle = { backgroundColor: "#fff", padding: "2rem", borderRadius: "10px", width: "90%", maxWidth: "600px", boxShadow: "0 8px 16px rgba(0, 0, 0, 0.2)", position: "relative", border: "1px solid #e0e0e0" };
  const closeBtnStyle = { position: "absolute", top: "15px", right: "15px", fontSize: "24px", cursor: "pointer", color: "#666", backgroundColor: "transparent", border: "none", width: "30px", height: "30px", display: "flex", alignItems: "center", justifyContent: "center", transition: "color 0.3s, transform 0.3s" };

  return (
    <div style={{ padding: "2rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <h2 style={{ fontSize: "1.5rem", color: "#333" }}>Outgoing Mails - {year}</h2>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button onClick={() => setShowForm(true)} style={buttonStyle} onMouseOver={e => e.target.style.backgroundColor = "#333"} onMouseOut={e => e.target.style.backgroundColor = "#000"} aria-label="Send new quote">Send New Quote</button>
          <button onClick={handleViewQuotations} style={buttonStyle} onMouseOver={e => e.target.style.backgroundColor = "#333"} onMouseOut={e => e.target.style.backgroundColor = "#000"} aria-label="View quotations">View Quotations</button>
          <button onClick={handleLogout} style={buttonStyle} onMouseOver={e => e.target.style.backgroundColor = "#333"} onMouseOut={e => e.target.style.backgroundColor = "#000"} aria-label="Log out">Log Out</button>
        </div>
      </div>
      {error && <div style={{ color: "#dc2626", marginBottom: "1rem" }}>{error}</div>}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", marginBottom: "1rem", alignItems: "center" }}>
        {[
          { name: "searchMessage", label: "Search by Message", width: "200px" },
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
          <select name="status" value={filters.status} onChange={handleFilterChange} style={{ ...selectStyle, width: "150px" }}>
            <option value="all">All Statuses</option>
            <option value="new">New</option>
            <option value="open">Open</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </div>
      {showForm && (
        <div style={modalStyle}>
          <div style={modalContentStyle}>
            <span style={closeBtnStyle} onClick={() => { setShowForm(false); setFormData({ company_name: "", company_email: "", contact_email: "", mail_subject: "", quote_no: "", message: "" }); setError(null); }}>×</span>
            <form onSubmit={handleSubmit} style={{ padding: "1rem 0" }}>
              <h2 style={{ marginBottom: "1rem", fontSize: "1.5rem", color: "#333" }}>Send New Quote</h2>
              {error && <div style={{ color: "#dc2626", marginBottom: "1rem" }}>{error}</div>}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                <div>
                  <label style={{ display: "block", color: "#333", fontSize: "0.9rem", marginBottom: "0.25rem" }}>Company Name</label>
                  <select name="company_name" value={formData.company_name} onChange={handleCompanyChange} style={selectStyle} required>
                    <option value="">Select Company</option>
                    {companies.map(company => <option key={company.company_name} value={company.company_name}>{company.company_name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", color: "#333", fontSize: "0.9rem", marginBottom: "0.25rem" }}>Contact Email</label>
                  <input type="email" name="contact_email" value={formData.contact_email} onChange={handleInputChange} style={inputStyle} />
                </div>
                <div>
                  <label style={{ display: "block", color: "#333", fontSize: "0.9rem", marginBottom: "0.25rem" }}>Company Email</label>
                  <input type="email" name="company_email" value={formData.company_email} onChange={handleInputChange} style={inputStyle} />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                <div>
                  <label style={{ display: "block", color: "#333", fontSize: "0.9rem", marginBottom: "0.25rem" }}>Mail Subject</label>
                  <input type="text" name="mail_subject" value={formData.mail_subject} onChange={handleInputChange} style={inputStyle} required />
                </div>
                <div>
                  <label style={{ display: "block", color: "#333", fontSize: "0.9rem", marginBottom: "0.25rem" }}>Quote No.</label>
                  <select name="quote_no" value={formData.quote_no} onChange={handleInputChange} style={selectStyle}>
                    <option value="">Select Quote</option>
                    {filteredQuotes.length ? filteredQuotes.map(quote => <option key={quote.quote_no} value={quote.quote_no}>{quote.quote_no}</option>) : <option value="" disabled>No Quotes Available</option>}
                  </select>
                </div>
              </div>
              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", color: "#333", fontSize: "0.9rem", marginBottom: "0.25rem" }}>Message</label>
                <textarea name="message" value={formData.message} onChange={handleInputChange} style={{ ...inputStyle, height: "100px" }} required />
              </div>
              <button type="submit" style={{ ...buttonStyle, width: "100%", marginTop: "1rem" }} onMouseOver={e => e.target.style.backgroundColor = "#333"} onMouseOut={e => e.target.style.backgroundColor = "#000"} aria-label="Send email">Send Email</button>
            </form>
          </div>
        </div>
      )}
      {viewMail && (
        <div style={modalStyle}>
          <div style={modalContentStyle}>
            <span style={closeBtnStyle} onClick={() => setViewMail(null)}>×</span>
            <h2 style={{ marginBottom: "1rem", fontSize: "1.5rem", color: "#333" }}>Mail Details</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              {[
                { label: "Company Name", value: viewMail.company_name },
                { label: "Company Email", value: viewMail.company_email },
                { label: "Contact Email", value: viewMail.contact_email },
                { label: "Contact Number", value: viewMail.contact_number },
                { label: "Mail Subject", value: viewMail.mail_subject },
                { label: "Quote No.", value: viewMail.quote_no },
              ].map(({ label, value }) => (
                <div key={label}>
                  <label style={{ display: "block", color: "#333", fontSize: "0.9rem", marginBottom: "0.25rem" }}>{label}</label>
                  <input type="text" value={value || "-"} readOnly style={{ ...inputStyle, backgroundColor: "#f3f4f6" }} />
                </div>
              ))}
            </div>
            <div style={{ marginTop: "1rem" }}>
              <label style={{ display: "block", color: "#333", fontSize: "0.9rem", marginBottom: "0.25rem" }}>Message</label>
              <textarea value={viewMail.message || "-"} readOnly style={{ ...inputStyle, height: "100px", backgroundColor: "#f3f4f6" }} />
            </div>
            <div style={{ marginTop: "1rem" }}>
              <label style={{ display: "block", color: "#333", fontSize: "0.9rem", marginBottom: "0.25rem" }}>Status</label>
              <input type="text" value={viewMail.status || "-"} readOnly style={{ ...inputStyle, backgroundColor: "#f3f4f6" }} />
            </div>
            <div style={{ marginTop: "1rem" }}>
              <label style={{ display: "block", color: "#333", fontSize: "0.9rem", marginBottom: "0.25rem" }}>Created On</label>
              <input type="text" value={formatDate(viewMail.created_on) || "-"} readOnly style={{ ...inputStyle, backgroundColor: "#f3f4f6" }} />
            </div>
          </div>
        </div>
      )}
      <h3 style={{ fontSize: "1.1rem", color: "#333", marginBottom: "0.5rem" }}>Sent Emails</h3>
      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "1rem" }}>
        <thead>
          <tr style={{ backgroundColor: "#000", color: "#fff" }}>
            {["S No.", "Company Name", "Contact Name", "Contact Number", "Status", "Message", "Create Date", "Options"].map(header => (
              <th key={header} style={{ border: "1px solid #000", padding: "0.5rem", textAlign: "center" }}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filteredMails.map((mail, index) => (
            <tr key={mail.id} style={{ backgroundColor: "#fff" }}>
              <td style={{ border: "1px solid #000", padding: "0.5rem", textAlign: "center" }}>{index + 1}</td>
              <td style={{ border: "1px solid #000", padding: "0.5rem", textAlign: "center" }}>{mail.company_name || "-"}</td>
              <td style={{ border: "1px solid #000", padding: "0.5rem", textAlign: "center" }}>{mail.contact_name || "-"}</td>
              <td style={{ border: "1px solid #000", padding: "0.5rem", textAlign: "center" }}>{mail.contact_number || "-"}</td>
              <td style={{ border: "1px solid #000", padding: "0.5rem", textAlign: "center" }}>
                <select value={mail.status} onChange={e => handleStatusChange(mail.id, e.target.value)} style={selectStyle}>
                  <option value="new">New</option>
                  <option value="open">Open</option>
                  <option value="closed">Closed</option>
                </select>
              </td>
              <td style={{ border: "1px solid #000", padding: "0.5rem", textAlign: "center" }}>{mail.message.length > 50 ? `${mail.message.substring(0, 50)}...` : mail.message}</td>
              <td style={{ border: "1px solid #000", padding: "0.5rem", textAlign: "center" }}>{formatDate(mail.created_on) || "-"}</td>
              <td style={{ border: "1px solid #000", padding: "0.5rem", textAlign: "center" }}>
                <button onClick={() => handleViewMail(mail)} style={smallButtonStyle} onMouseOver={e => e.target.style.backgroundColor = "#333"} onMouseOut={e => e.target.style.backgroundColor = "#000"} aria-label="View mail">View</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Outgoing;