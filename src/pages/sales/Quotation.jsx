import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

const Quotation = () => {
  const { year } = useParams();
  const [quotes, setQuotes] = useState([]);
  const [filteredQuotes, setFilteredQuotes] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [users, setUsers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({
    quote_title: "",
    company_name: "",
    contact_email: "",
    company_email: "",
    vat_applicable: false,
    vat_percentage: 0,
    notes_remarks: "",
    products: [{ product: "", specification: "", qty: 1, unit_price: 0 }],
  });
  const [errors, setErrors] = useState({});
  const [filters, setFilters] = useState({
    searchQuoteTitle: "",
    searchQuoteNo: "",
    searchCompany: "",
    searchContactNumber: "",
    fromDate: "",
    toDate: "",
    status: "",
  });

  const styles = {
    input: { border: "1px solid #ccc", padding: "0.5rem", width: "100%", borderRadius: "5px", fontSize: "0.9rem", boxSizing: "border-box" },
    errorInput: { border: "1px solid #dc2626" },
    label: { display: "block", color: "#333", fontSize: "0.9rem", marginBottom: "0.25rem" },
    button: { padding: "0.5rem 1rem", backgroundColor: "#000", color: "#fff", border: "none", borderRadius: "5px", fontSize: "0.9rem", cursor: "pointer", transition: "background-color 0.3s" },
    smallButton: { padding: "0.3rem 0.5rem", fontSize: "0.8rem" },
    removeButton: { padding: "0.3rem 0.5rem", backgroundColor: "#dc2626", color: "#fff", border: "none", borderRadius: "5px", fontSize: "0.8rem", cursor: "pointer", transition: "background-color 0.3s" },
    tableCell: { border: "1px solid #000", padding: "0.5rem", textAlign: "center", backgroundColor: "#fff" },
    tableHeader: { border: "1px solid #000", padding: "0.5rem", backgroundColor: "#000", color: "#fff" },
    modal: { position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 },
    modalContent: { backgroundColor: "#fff", padding: "2rem", borderRadius: "10px", width: "90%", maxWidth: "600px", boxShadow: "0 8px 16px rgba(0,0,0,0.2)", position: "relative", border: "1px solid #e0e0e0" },
    closeBtn: { position: "absolute", top: "15px", right: "15px", fontSize: "24px", cursor: "pointer", color: "#666", backgroundColor: "transparent", border: "none", width: "30px", height: "30px", display: "flex", alignItems: "center", justifyContent: "center" },
    flexRow: { display: "flex", justifyContent: "space-between", alignItems: "center" },
    errorText: { color: "#dc2626", fontSize: "0.8rem" },
  };

  const getAuthToken = () => localStorage.getItem("accessToken");

  const calculateTotals = () => {
    const subtotal = form.products.reduce((sum, p) => sum + p.qty * p.unit_price, 0);
    const vat_amount = form.vat_applicable ? (subtotal * form.vat_percentage) / 100 : 0;
    return { subtotal, vat_amount, grand_total: subtotal + vat_amount };
  };

  const fetchQuotes = async () => {
    try {
      const res = await axios.get(`http://127.0.0.1:8000/sales/quotes/?year=${year}`, { headers: { Authorization: `Bearer ${getAuthToken()}` } });
      setQuotes(res.data);
      setFilteredQuotes(res.data);
    } catch (err) {
      console.error("Failed to fetch quotes", err);
      setErrors({ general: "Failed to fetch quotes." });
    }
  };

  const fetchContacts = async () => {
    try {
      const res = await axios.get(`http://127.0.0.1:8000/sales/quotation-companies`, { headers: { Authorization: `Bearer ${getAuthToken()}` } });
      setContacts(res.data);
    } catch (err) {
      console.error("Failed to fetch contacts", err);
      setErrors({ general: "Failed to fetch contacts." });
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await axios.get(`http://127.0.0.1:8000/sales/users/`, { headers: { Authorization: `Bearer ${getAuthToken()}` } });
      setUsers(res.data);
    } catch (err) {
      console.error("Failed to fetch users", err);
      setErrors({ general: "Failed to fetch users." });
    }
  };

  useEffect(() => {
    let filtered = quotes;
    if (filters.searchQuoteTitle) filtered = filtered.filter((q) => q.quote_title.toLowerCase().includes(filters.searchQuoteTitle.toLowerCase()));
    if (filters.searchQuoteNo) filtered = filtered.filter((q) => q.quote_no.toLowerCase().includes(filters.searchQuoteNo.toLowerCase()));
    if (filters.searchCompany) filtered = filtered.filter((q) => q.company_name.toLowerCase().includes(filters.searchCompany.toLowerCase()));
    if (filters.searchContactNumber) filtered = filtered.filter((q) => (q.contact_number || "").toLowerCase().includes(filters.searchContactNumber.toLowerCase()));
    if (filters.status && filters.status !== "all") filtered = filtered.filter((q) => q.status === filters.status);
    if (filters.fromDate || filters.toDate) {
      filtered = filtered.filter((q) => {
        const quoteDate = new Date(q.create_date).getTime();
        const from = filters.fromDate ? new Date(filters.fromDate).getTime() : null;
        const to = filters.toDate ? new Date(filters.toDate).getTime() : null;
        return (!from || quoteDate >= from) && (!to || quoteDate <= to);
      });
    }
    setFilteredQuotes(filtered);
  }, [filters, quotes]);

  const handleFilterChange = (e) => setFilters({ ...filters, [e.target.name]: e.target.value });

  const handleStatusChange = async (id, status) => {
    try {
      const res = await axios.patch(`http://127.0.0.1:8000/sales/quotes/${id}/`, { status }, { headers: { Authorization: `Bearer ${getAuthToken()}` } });
      setQuotes((prev) => prev.map((q) => (q.id === id ? res.data : q)));
    } catch (err) {
      console.error("Failed to update status", err);
      setErrors({ general: "Failed to update status." });
    }
  };

  const handleAssignToChange = async (id, assignToId) => {
    try {
      const res = await axios.patch(`http://127.0.0.1:8000/sales/quotes/${id}/`, { assign_to: assignToId || null }, { headers: { Authorization: `Bearer ${getAuthToken()}` } });
      setQuotes((prev) => prev.map((q) => (q.id === id ? res.data : q)));
    } catch (err) {
      console.error("Failed to update assign_to", err);
      setErrors({ general: "Failed to update assigned user." });
    }
  };

  const handleEditQuote = (q) => {
    setShowForm(true);
    setIsEditing(true);
    setEditId(q.id);
    setForm({
      quote_title: q.quote_title,
      company_name: q.company_name,
      contact_email: q.contact_email || "",
      company_email: q.company_email || "",
      vat_applicable: q.vat_applicable,
      vat_percentage: q.vat_percentage,
      notes_remarks: q.notes_remarks || "",
      products: q.products.length ? q.products.map((p) => ({ product: p.product, specification: p.specification || "", qty: p.qty, unit_price: p.unit_price })) : [{ product: "", specification: "", qty: 1, unit_price: 0 }],
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    if (!form.quote_title.trim()) return setErrors({ quote_title: "Quote title is required." });
    if (!form.company_name) return setErrors({ company_name: "Company name is required." });
    if (!form.contact_email) return setErrors({ contact_email: "Contact email is required." });
    if (form.products.some((p) => !p.product.trim() || p.qty <= 0 || p.unit_price < 0)) return setErrors({ products: "All products must have a name, positive quantity, and non-negative unit price." });

    const { subtotal, vat_amount, grand_total } = calculateTotals();
    const payload = { ...form, year, subtotal, vat_amount, grand_total, products: form.products.map((p) => ({ product: p.product, specification: p.specification || "", qty: p.qty, unit_price: p.unit_price })) };

    try {
      const res = isEditing
        ? await axios.put(`http://127.0.0.1:8000/sales/quotes/${editId}/`, payload, { headers: { Authorization: `Bearer ${getAuthToken()}` } })
        : await axios.post("http://127.0.0.1:8000/sales/quotes/", payload, { headers: { Authorization: `Bearer ${getAuthToken()}` } });
      setQuotes((prev) => isEditing ? prev.map((q) => (q.id === editId ? res.data : q)) : [res.data, ...prev]);
      setShowForm(false);
      setIsEditing(false);
      setEditId(null);
      setForm({ quote_title: "", company_name: "", contact_email: "", company_email: "", vat_applicable: false, vat_percentage: 0, notes_remarks: "", products: [{ product: "", specification: "", qty: 1, unit_price: 0 }] });
    } catch (err) {
      console.error("Failed to create/update quote", err);
      setErrors(err.response?.data || { general: "An unexpected error occurred." });
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === "company_name") {
      const contact = contacts.find((c) => c.company_name === value);
      setForm({ ...form, company_name: value, contact_email: contact ? contact.contact_email : "", company_email: contact ? contact.company_email : "" });
    } else {
      setForm({ ...form, [name]: type === "checkbox" ? checked : value });
    }
  };

  const handleProductChange = (index, field, value) => {
    const updatedProducts = [...form.products];
    updatedProducts[index] = { ...updatedProducts[index], [field]: field === "qty" || field === "unit_price" ? Number(value) : value };
    setForm({ ...form, products: updatedProducts });
  };

  const addProduct = () => setForm({ ...form, products: [...form.products, { product: "", specification: "", qty: 1, unit_price: 0 }] });

  const removeProduct = (index) => form.products.length > 1 && setForm({ ...form, products: form.products.filter((_, i) => i !== index) });

  useEffect(() => {
    fetchQuotes();
    fetchContacts();
    fetchUsers();
  }, [year]);

  const { subtotal, vat_amount, grand_total } = calculateTotals();

  const formatDate = (date) => new Date(date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });

  return (
    <div style={{ padding: "2rem", margin: 0 }}>
      <div style={{ ...styles.flexRow, marginBottom: "1rem" }}>
        <h2 style={{ fontSize: "1.5rem", color: "#333" }}>Quotations for {year}</h2>
        <button style={styles.button} onClick={() => setShowForm(true)} onMouseOver={(e) => (e.target.style.backgroundColor = "#333")} onMouseOut={(e) => (e.target.style.backgroundColor = "#000")}>
          Add Quotation
        </button>
      </div>

      {errors.general && <div style={styles.errorText}>{errors.general}</div>}

      <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", marginBottom: "1rem" }}>
        {[{ name: "searchQuoteTitle", label: "Search by Quote Title", width: "200px" }, { name: "searchQuoteNo", label: "Search by Quote No.", width: "200px" }, { name: "searchCompany", label: "Search by Company", width: "200px" }, { name: "searchContactNumber", label: "Search by Contact Number", width: "200px" }, { name: "fromDate", label: "From", type: "date", width: "150px" }, { name: "toDate", label: "To", type: "date", width: "150px" }].map(({ name, label, type = "text", width }) => (
          <div key={name}>
            <label style={styles.label}>{label}</label>
            <input type={type} name={name} value={filters[name]} onChange={handleFilterChange} style={{ ...styles.input, width }} />
          </div>
        ))}
        <div>
          <label style={styles.label}>Status</label>
          <select name="status" value={filters.status} onChange={handleFilterChange} style={{ ...styles.input, width: "150px" }}>
            <option value="all">All Statuses</option>
            <option value="new">New</option>
            <option value="open">Open</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </div>

      {showForm && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <span
              onClick={() => {
                setShowForm(false);
                setIsEditing(false);
                setEditId(null);
                setForm({ quote_title: "", company_name: "", contact_email: "", company_email: "", vat_applicable: false, vat_percentage: 0, notes_remarks: "", products: [{ product: "", specification: "", qty: 1, unit_price: 0 }] });
              }}
              style={styles.closeBtn}
            >
              ×
            </span>
            <form onSubmit={handleSubmit} style={{ padding: "1rem 0" }}>
              <h2 style={{ fontSize: "1.5rem", color: "#333", marginBottom: "1rem" }}>{isEditing ? "Edit Quotation" : "Add Quotation"}</h2>
              {errors.general && <div style={styles.errorText}>{errors.general}</div>}
              {[{ name: "quote_title", label: "Quote Title", required: true }, ...(isEditing ? [{ name: "quote_no", label: "Quote Number", value: quotes.find((q) => q.id === editId)?.quote_no || "", readOnly: true, style: { backgroundColor: "#f3f4f6" } }] : [])].map(({ name, label, value = form[name], required, readOnly, style }) => (
                <div key={name} style={{ marginBottom: "1rem" }}>
                  <label style={styles.label}>{label}</label>
                  <input name={name} value={value} onChange={handleChange} style={{ ...styles.input, ...(errors[name] ? styles.errorInput : {}), ...style }} required={required} readOnly={readOnly} />
                  {errors[name] && <div style={styles.errorText}>{errors[name]}</div>}
                </div>
              ))}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                {[{ name: "company_name", label: "Company Name", type: "select", required: true }, { name: "contact_email", label: "Contact Email", type: "email", required: true }, { name: "company_email", label: "Company Email", type: "email" }].map(({ name, label, type, required }) => (
                  <div key={name}>
                    <label style={styles.label}>{label}</label>
                    {type === "select" ? (
                      <select name={name} value={form[name]} onChange={handleChange} style={{ ...styles.input, ...(errors[name] ? styles.errorInput : {}) }} required={required}>
                        <option value="">Select Company</option>
                        {contacts.map((c) => <option key={c.company_name} value={c.company_name}>{c.company_name}</option>)}
                      </select>
                    ) : (
                      <input name={name} type={type} value={form[name]} onChange={handleChange} style={{ ...styles.input, ...(errors[name] ? styles.errorInput : {}) }} required={required} />
                    )}
                    {errors[name] && <div style={styles.errorText}>{errors[name]}</div>}
                  </div>
                ))}
              </div>
              <div style={{ marginBottom: "1rem" }}>
                <h3 style={{ fontSize: "1.1rem", color: "#333", marginBottom: "0.5rem" }}>Products</h3>
                {errors.products && <div style={styles.errorText}>{errors.products}</div>}
                <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "1rem" }}>
                  <thead>
                    <tr>
                      {["Product", "Specification", "Quantity", "Unit Price", "Total", "Action"].map((h) => <th key={h} style={styles.tableHeader}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {form.products.map((p, i) => (
                      <tr key={i}>
                        <td style={styles.tableCell}>
                          <input type="text" value={p.product} onChange={(e) => handleProductChange(i, "product", e.target.value)} style={{ ...styles.input, ...(errors.products?.[i]?.product ? styles.errorInput : {}) }} required />
                          {errors.products?.[i]?.product && <div style={styles.errorText}>{errors.products[i].product}</div>}
                        </td>
                        <td style={styles.tableCell}>
                          <input type="text" value={p.specification} onChange={(e) => handleProductChange(i, "specification", e.target.value)} style={styles.input} />
                        </td>
                        <td style={styles.tableCell}>
                          <input type="number" value={p.qty} onChange={(e) => handleProductChange(i, "qty", e.target.value)} style={{ ...styles.input, ...(errors.products?.[i]?.qty ? styles.errorInput : {}) }} min="1" required />
                          {errors.products?.[i]?.qty && <div style={styles.errorText}>{errors.products[i].qty}</div>}
                        </td>
                        <td style={styles.tableCell}>
                          <input type="number" value={p.unit_price} onChange={(e) => handleProductChange(i, "unit_price", e.target.value)} style={{ ...styles.input, ...(errors.products?.[i]?.unit_price ? styles.errorInput : {}) }} min="0" step="0.01" required />
                          {errors.products?.[i]?.unit_price && <div style={styles.errorText}>{errors.products[i].unit_price}</div>}
                        </td>
                        <td style={styles.tableCell}>{(p.qty * p.unit_price).toFixed(2)}</td>
                        <td style={styles.tableCell}>
                          <button
                            type="button"
                            onClick={() => removeProduct(i)}
                            style={{ ...styles.removeButton, cursor: form.products.length === 1 ? "not-allowed" : "pointer" }}
                            disabled={form.products.length === 1}
                            onMouseOver={(e) => form.products.length > 1 && (e.target.style.backgroundColor = "#b91c1c")}
                            onMouseOut={(e) => form.products.length > 1 && (e.target.style.backgroundColor = "#dc2626")}
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <button type="button" onClick={addProduct} style={styles.button} onMouseOver={(e) => (e.target.style.backgroundColor = "#333")} onMouseOut={(e) => (e.target.style.backgroundColor = "#000")}>
                  Add Product
                </button>
              </div>
              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "inline-flex", alignItems: "center" }}>
                  <input type="checkbox" name="vat_applicable" checked={form.vat_applicable} onChange={handleChange} style={{ marginRight: "0.5rem" }} />
                  <span style={{ color: "#333", fontSize: "0.9rem" }}>VAT Applicable</span>
                </label>
              </div>
              <div style={{ marginBottom: "1rem" }}>
                <div style={styles.flexRow}>
                  <span style={{ color: "#333", fontSize: "0.9rem" }}>VAT Percentage</span>
                  <input name="vat_percentage" type="number" value={form.vat_percentage} onChange={handleChange} style={{ ...styles.input, width: "100px", ...(errors.vat_percentage ? styles.errorInput : {}) }} disabled={!form.vat_applicable} />
                </div>
                {errors.vat_percentage && <div style={styles.errorText}>{errors.vat_percentage}</div>}
              </div>
              {[{ label: "Subtotal (AED)", value: subtotal }, { label: "VAT Amount (AED)", value: vat_amount }, { label: "Grand Total (AED)", value: grand_total }].map(({ label, value }, i) => (
                <div key={i} style={{ marginBottom: "1rem" }}>
                  <div style={styles.flexRow}>
                    <span style={{ color: "#333", fontSize: "0.9rem", fontWeight: "500" }}>{label}</span>
                    <span style={{ color: "#333", fontSize: "0.9rem" }}>{value.toFixed(2)}</span>
                  </div>
                  {errors[label.toLowerCase().replace(" (aed)", "")] && <div style={styles.errorText}>{errors[label.toLowerCase().replace(" (aed)", "")]}</div>}
                </div>
              ))}
              <div style={{ marginBottom: "1rem" }}>
                <label style={styles.label}>Notes/Remarks</label>
                <textarea name="notes_remarks" value={form.notes_remarks} onChange={handleChange} style={{ ...styles.input, height: "100px", ...(errors.notes_remarks ? styles.errorInput : {}) }} />
                {errors.notes_remarks && <div style={styles.errorText}>{errors.notes_remarks}</div>}
              </div>
              <button type="submit" style={{ ...styles.button, width: "100%", textTransform: "uppercase" }} onMouseOver={(e) => (e.target.style.backgroundColor = "#333")} onMouseOut={(e) => (e.target.style.backgroundColor = "#000")}>
                {isEditing ? "Update Quotation" : "Submit Quotation"}
              </button>
            </form>
          </div>
        </div>
      )}

      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "1rem" }}>
        <thead>
          <tr>
            {["S No.", "Company Name", "Contact Name", "Contact Number", "Status", "Quote No", "Quote Title", "Assign To", "Created By", "Create Date", "Actions"].map((header) => (
              <th key={header} style={styles.tableHeader}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filteredQuotes.map((q, i) => (
            <tr key={q.id}>
              <td style={styles.tableCell}>{i + 1}</td>
              <td style={styles.tableCell}>{q.company_name || "-"}</td>
              <td style={styles.tableCell}>{q.contact_name || "-"}</td>
              <td style={styles.tableCell}>{q.contact_number || "-"}</td>
              <td style={styles.tableCell}>
                <select value={q.status} onChange={(e) => handleStatusChange(q.id, e.target.value)} style={{ ...styles.input, width: "100%", padding: "0.25rem" }}>
                  <option value="new">New</option>
                  <option value="open">Open</option>
                  <option value="closed">Closed</option>
                </select>
              </td>
              <td style={styles.tableCell}>{q.quote_no || "-"}</td>
              <td style={styles.tableCell}>{q.quote_title || "-"}</td>
              <td style={styles.tableCell}>
                <select value={q.assign_to || ""} onChange={(e) => handleAssignToChange(q.id, e.target.value)} style={{ ...styles.input, width: "100%", padding: "0.25rem" }}>
                  <option value="">Select User</option>
                  {users.map((u) => <option key={u.id} value={u.id}>{u.username}</option>)}
                </select>
              </td>
              <td style={styles.tableCell}>{q.created_by?.username || "-"}</td>
              <td style={styles.tableCell}>{formatDate(q.create_date) || "-"}</td>
              <td style={styles.tableCell}>
                <button
                  onClick={() => handleEditQuote(q)}
                  style={{ ...styles.button, ...styles.smallButton }}
                  onMouseOver={(e) => (e.target.style.backgroundColor = "#333")}
                  onMouseOut={(e) => (e.target.style.backgroundColor = "#000")}
                >
                  Edit
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Quotation;