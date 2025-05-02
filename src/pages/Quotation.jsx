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

  const getAuthToken = () => {
    return localStorage.getItem("accessToken");
  };

  const calculateTotals = () => {
    const subtotal = form.products.reduce(
      (sum, p) => sum + p.qty * p.unit_price,
      0
    );
    const vat_amount = form.vat_applicable
      ? (subtotal * form.vat_percentage) / 100
      : 0;
    const grand_total = subtotal + vat_amount;
    return { subtotal, vat_amount, grand_total };
  };

  const fetchQuotes = async () => {
    const token = getAuthToken();
    try {
      const res = await axios.get(`https://wantik-backend-kb.onrender.com/sales/quotes/?year=${year}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setQuotes(res.data);
      setFilteredQuotes(res.data);
    } catch (err) {
      console.error("Failed to fetch quotes", err);
      setErrors({ general: "Failed to fetch quotes." });
    }
  };

  const fetchContacts = async () => {
    const token = getAuthToken();
    try {
      const res = await axios.get(`https://wantik-backend-kb.onrender.com/sales/quotation-companies`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setContacts(res.data);
    } catch (err) {
      console.error("Failed to fetch contacts", err);
      setErrors({ general: "Failed to fetch contacts." });
    }
  };

  const fetchUsers = async () => {
    const token = getAuthToken();
    try {
      const res = await axios.get(`https://wantik-backend-kb.onrender.com/sales/users/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(res.data);
    } catch (err) {
      console.error("Failed to fetch users", err);
      setErrors({ general: "Failed to fetch users." });
    }
  };

  // Filter logic
  useEffect(() => {
    let filtered = quotes;

    // Filter by quote title
    if (filters.searchQuoteTitle) {
      filtered = filtered.filter((quote) =>
        quote.quote_title.toLowerCase().includes(filters.searchQuoteTitle.toLowerCase())
      );
    }

    // Filter by quote number
    if (filters.searchQuoteNo) {
      filtered = filtered.filter((quote) =>
        quote.quote_no.toLowerCase().includes(filters.searchQuoteNo.toLowerCase())
      );
    }

    // Filter by company name
    if (filters.searchCompany) {
      filtered = filtered.filter((quote) =>
        quote.company_name.toLowerCase().includes(filters.searchCompany.toLowerCase())
      );
    }

    // Filter by contact number
    if (filters.searchContactNumber) {
      filtered = filtered.filter((quote) =>
        (quote.contact_number || "").toLowerCase().includes(filters.searchContactNumber.toLowerCase())
      );
    }

    // Filter by status
    if (filters.status && filters.status !== "all") {
      filtered = filtered.filter((quote) => quote.status === filters.status);
    }

    // Filter by date range
    if (filters.fromDate || filters.toDate) {
      filtered = filtered.filter((quote) => {
        const quoteDate = new Date(quote.create_date).getTime();
        const from = filters.fromDate ? new Date(filters.fromDate).getTime() : null;
        const to = filters.toDate ? new Date(filters.toDate).getTime() : null;

        if (from && to) {
          return quoteDate >= from && quoteDate <= to;
        } else if (from) {
          return quoteDate >= from;
        } else if (to) {
          return quoteDate <= to;
        }
        return true;
      });
    }

    setFilteredQuotes(filtered);
  }, [filters, quotes]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value,
    });
  };

  const handleStatusChange = async (id, status) => {
    const token = getAuthToken();
    if (!token) {
      console.error("Access token not found.");
      setErrors({ general: "Access token not found." });
      return;
    }
    try {
      const res = await axios.patch(
        `https://wantik-backend-kb.onrender.com/sales/quotes/${id}/`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setQuotes((prev) =>
        prev.map((quote) => (quote.id === id ? res.data : quote))
      );
    } catch (err) {
      console.error("Failed to update status", err);
      setErrors({ general: "Failed to update status." });
    }
  };

  const handleAssignToChange = async (id, assignToId) => {
    const token = getAuthToken();
    if (!token) {
      console.error("Access token not found.");
      setErrors({ general: "Access token not found." });
      return;
    }
    try {
      const res = await axios.patch(
        `https://wantik-backend-kb.onrender.com/sales/quotes/${id}/`,
        { assign_to: assignToId || null },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setQuotes((prev) =>
        prev.map((quote) => (quote.id === id ? res.data : quote))
      );
    } catch (err) {
      console.error("Failed to update assign_to", err);
      setErrors({ general: "Failed to update assigned user." });
    }
  };

  const handleEditQuote = (quote) => {
    setShowForm(true);
    setIsEditing(true);
    setEditId(quote.id);
    setForm({
      quote_title: quote.quote_title,
      company_name: quote.company_name,
      contact_email: quote.contact_email || "",
      company_email: quote.company_email || "",
      vat_applicable: quote.vat_applicable,
      vat_percentage: quote.vat_percentage,
      notes_remarks: quote.notes_remarks || "",
      products: quote.products.length > 0 ? quote.products.map(p => ({
        product: p.product,
        specification: p.specification || "",
        qty: p.qty,
        unit_price: p.unit_price,
      })) : [{ product: "", specification: "", qty: 1, unit_price: 0 }],
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    if (!form.quote_title.trim()) {
      setErrors({ quote_title: "Quote title is required." });
      return;
    }
    if (!form.company_name) {
      setErrors({ company_name: "Company name is required." });
      return;
    }
    if (!form.contact_email) {
      setErrors({ contact_email: "Contact email is required." });
      return;
    }
    const invalidProduct = form.products.find(
      (p) => !p.product.trim() || p.qty <= 0 || p.unit_price < 0
    );
    if (invalidProduct) {
      setErrors({
        products:
          "All products must have a name, positive quantity, and non-negative unit price.",
      });
      return;
    }

    const { subtotal, vat_amount, grand_total } = calculateTotals();
    const token = getAuthToken();
    if (!token) {
      setErrors({ general: "Access token not found." });
      return;
    }

    const payload = {
      quote_title: form.quote_title,
      company_name: form.company_name,
      contact_email: form.contact_email,
      company_email: form.company_email,
      vat_applicable: form.vat_applicable,
      vat_percentage: form.vat_percentage,
      year,
      subtotal,
      vat_amount,
      grand_total,
      notes_remarks: form.notes_remarks,
      products: form.products.map((p) => ({
        product: p.product,
        specification: p.specification || "",
        qty: p.qty,
        unit_price: p.unit_price,
      })),
    };

    try {
      if (isEditing) {
        // Update existing quote
        const res = await axios.put(
          `https://wantik-backend-kb.onrender.com/sales/quotes/${editId}/`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setQuotes((prev) =>
          prev.map((quote) => (quote.id === editId ? res.data : quote))
        );
      } else {
        // Create new quote
        const res = await axios.post(
          "https://wantik-backend-kb.onrender.com/sales/quotes/",
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setQuotes((prev) => [res.data, ...prev]);
      }

      setShowForm(false);
      setIsEditing(false);
      setEditId(null);
      setForm({
        quote_title: "",
        company_name: "",
        contact_email: "",
        company_email: "",
        vat_applicable: false,
        vat_percentage: 0,
        notes_remarks: "",
        products: [{ product: "", specification: "", qty: 1, unit_price: 0 }],
      });
    } catch (err) {
      console.error("Failed to create/update quote", err);
      if (err.response && err.response.data) {
        setErrors(err.response.data);
      } else {
        setErrors({ general: "An unexpected error occurred." });
      }
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === "company_name") {
      const selectedContact = contacts.find((c) => c.company_name === value);
      setForm({
        ...form,
        company_name: value,
        contact_email: selectedContact ? selectedContact.contact_email : "",
        company_email: selectedContact ? selectedContact.company_email : "",
      });
    } else {
      setForm({
        ...form,
        [name]: type === "checkbox" ? checked : value,
      });
    }
  };

  const handleProductChange = (index, field, value) => {
    const updatedProducts = [...form.products];
    updatedProducts[index] = {
      ...updatedProducts[index],
      [field]: field === "qty" || field === "unit_price" ? Number(value) : value,
    };
    setForm({ ...form, products: updatedProducts });
  };

  const addProduct = () => {
    setForm({
      ...form,
      products: [
        ...form.products,
        { product: "", specification: "", qty: 1, unit_price: 0 },
      ],
    });
  };

  const removeProduct = (index) => {
    if (form.products.length > 1) {
      const updatedProducts = form.products.filter((_, i) => i !== index);
      setForm({ ...form, products: updatedProducts });
    }
  };

  useEffect(() => {
    fetchQuotes();
    fetchContacts();
    fetchUsers();
  }, [year]);

  const { subtotal, vat_amount, grand_total } = calculateTotals();

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const modalStyle = {
    position: "fixed",
    top: "0",
    left: "0",
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: "1000",
  };

  const modalContentStyle = {
    backgroundColor: "#fff",
    padding: "2rem",
    borderRadius: "10px",
    width: "90%",
    maxWidth: "600px",
    boxShadow: "0 8px 16px rgba(0, 0, 0, 0.2)",
    position: "relative",
    border: "1px solid #e0e0e0",
  };

  const closeBtnStyle = {
    position: "absolute",
    top: "15px",
    right: "15px",
    fontSize: "24px",
    cursor: "pointer",
    color: "#666",
    backgroundColor: "transparent",
    border: "none",
    width: "30px",
    height: "30px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "color 0.3s, transform 0.3s",
  };

  return (
    <div style={{ padding: "2rem", margin: 0 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1rem",
        }}
      >
        <h2 style={{ fontSize: "1.5rem", color: "#333" }}>
          Quotations for {year}
        </h2>
        <button
          onClick={() => setShowForm(true)}
          style={{
            padding: "0.5rem 1rem",
            backgroundColor: "#000",
            color: "#fff",
            border: "none",
            borderRadius: "5px",
            fontSize: "0.9rem",
            cursor: "pointer",
            textTransform: "uppercase",
            transition: "background-color 0.3s",
          }}
          onMouseOver={(e) => (e.target.style.backgroundColor = "#333")}
          onMouseOut={(e) => (e.target.style.backgroundColor = "#000")}
        >
          Add Quotation
        </button>
      </div>

      {errors.general && (
        <div style={{ color: "#dc2626", marginBottom: "1rem" }}>
          {errors.general}
        </div>
      )}

      {/* Filter Section */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "1rem",
          marginBottom: "1rem",
          alignItems: "center",
        }}
      >
        <div>
          <label style={{ display: "block", color: "#333", fontSize: "0.9rem", marginBottom: "0.25rem" }}>
            Search by Quote Title
          </label>
          <input
            type="text"
            name="searchQuoteTitle"
            value={filters.searchQuoteTitle}
            onChange={handleFilterChange}
            style={{
              padding: "0.5rem",
              border: "1px solid #ccc",
              borderRadius: "5px",
              fontSize: "0.9rem",
              width: "200px",
            }}
          />
        </div>
        <div>
          <label style={{ display: "block", color: "#333", fontSize: "0.9rem", marginBottom: "0.25rem" }}>
            Search by Quote No.
          </label>
          <input
            type="text"
            name="searchQuoteNo"
            value={filters.searchQuoteNo}
            onChange={handleFilterChange}
            style={{
              padding: "0.5rem",
              border: "1px solid #ccc",
              borderRadius: "5px",
              fontSize: "0.9rem",
              width: "200px",
            }}
          />
        </div>
        <div>
          <label style={{ display: "block", color: "#333", fontSize: "0.9rem", marginBottom: "0.25rem" }}>
            Search by Company
          </label>
          <input
            type="text"
            name="searchCompany"
            value={filters.searchCompany}
            onChange={handleFilterChange}
            style={{
              padding: "0.5rem",
              border: "1px solid #ccc",
              borderRadius: "5px",
              fontSize: "0.9rem",
              width: "200px",
            }}
          />
        </div>
        <div>
          <label style={{ display: "block", color: "#333", fontSize: "0.9rem", marginBottom: "0.25rem" }}>
            Search by Contact Number
          </label>
          <input
            type="text"
            name="searchContactNumber"
            value={filters.searchContactNumber}
            onChange={handleFilterChange}
            style={{
              padding: "0.5rem",
              border: "1px solid #ccc",
              borderRadius: "5px",
              fontSize: "0.9rem",
              width: "200px",
            }}
          />
        </div>
        <div>
          <label style={{ display: "block", color: "#333", fontSize: "0.9rem", marginBottom: "0.25rem" }}>
            From
          </label>
          <input
            type="date"
            name="fromDate"
            value={filters.fromDate}
            onChange={handleFilterChange}
            style={{
              padding: "0.5rem",
              border: "1px solid #ccc",
              borderRadius: "5px",
              fontSize: "0.9rem",
              width: "150px",
            }}
          />
        </div>
        <div>
          <label style={{ display: "block", color: "#333", fontSize: "0.9rem", marginBottom: "0.25rem" }}>
            To
          </label>
          <input
            type="date"
            name="toDate"
            value={filters.toDate}
            onChange={handleFilterChange}
            style={{
              padding: "0.5rem",
              border: "1px solid #ccc",
              borderRadius: "5px",
              fontSize: "0.9rem",
              width: "150px",
            }}
          />
        </div>
        <div>
          <label style={{ display: "block", color: "#333", fontSize: "0.9rem", marginBottom: "0.25rem" }}>
            Status
          </label>
          <select
            name="status"
            value={filters.status}
            onChange={handleFilterChange}
            style={{
              padding: "0.5rem",
              border: "1px solid #ccc",
              borderRadius: "5px",
              fontSize: "0.9rem",
              width: "150px",
            }}
          >
            <option value="all">All Statuses</option>
            <option value="new">New</option>
            <option value="open">Open</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </div>

      {/* Modal Form */}
      {showForm && (
        <div style={modalStyle}>
          <div style={modalContentStyle}>
            <span
              className="close-btn"
              onClick={() => {
                setShowForm(false);
                setIsEditing(false);
                setEditId(null);
                setForm({
                  quote_title: "",
                  company_name: "",
                  contact_email: "",
                  company_email: "",
                  vat_applicable: false,
                  vat_percentage: 0,
                  notes_remarks: "",
                  products: [{ product: "", specification: "", qty: 1, unit_price: 0 }],
                });
              }}
              style={closeBtnStyle}
            >
              ×
            </span>
            <form onSubmit={handleSubmit} style={{ margin: 0, padding: "1rem 0" }}>
              <h2 style={{ margin: "0 0 1rem 0", fontSize: "1.5rem", color: "#333" }}>
                {isEditing ? "Edit Quotation" : "Add Quotation"}
              </h2>
              {errors.general && (
                <div style={{ color: "#dc2626", marginBottom: "1rem" }}>
                  {errors.general}
                </div>
              )}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label style={{ display: "block", color: "#333", fontSize: "0.9rem", marginBottom: "0.25rem" }}>
                    Quote Title
                  </label>
                  <input
                    name="quote_title"
                    value={form.quote_title}
                    onChange={handleChange}
                    style={{
                      border: errors.quote_title ? "1px solid #dc2626" : "1px solid #ccc",
                      padding: "0.5rem",
                      width: "100%",
                      borderRadius: "5px",
                      fontSize: "0.9rem",
                      boxSizing: "border-box",
                    }}
                    required
                  />
                  {errors.quote_title && (
                    <div style={{ color: "#dc2626", fontSize: "0.8rem" }}>
                      {errors.quote_title}
                    </div>
                  )}
                </div>
                <div>
                  <label style={{ display: "block", color: "#333", fontSize: "0.9rem", marginBottom: "0.25rem" }}>
                    Company Name
                  </label>
                  <select
                    name="company_name"
                    value={form.company_name}
                    onChange={handleChange}
                    style={{
                      border: errors.company_name ? "1px solid #dc2626" : "1px solid #ccc",
                      padding: "0.5rem",
                      width: "100%",
                      borderRadius: "5px",
                      fontSize: "0.9rem",
                      boxSizing: "border-box",
                    }}
                    required
                  >
                    <option value="">Select Company</option>
                    {contacts.map((contact) => (
                      <option key={contact.company_name} value={contact.company_name}>
                        {contact.company_name}
                      </option>
                    ))}
                  </select>
                  {errors.company_name && (
                    <div style={{ color: "#dc2626", fontSize: "0.8rem" }}>
                      {errors.company_name}
                    </div>
                  )}
                </div>
                <div>
                  <label style={{ display: "block", color: "#333", fontSize: "0.9rem", marginBottom: "0.25rem" }}>
                    Contact Email
                  </label>
                  <input
                    name="contact_email"
                    value={form.contact_email}
                    onChange={handleChange}
                    type="email"
                    style={{
                      border: errors.contact_email ? "1px solid #dc2626" : "1px solid #ccc",
                      padding: "0.5rem",
                      width: "100%",
                      borderRadius: "5px",
                      fontSize: "0.9rem",
                      boxSizing: "border-box",
                    }}
                    required
                  />
                  {errors.contact_email && (
                    <div style={{ color: "#dc2626", fontSize: "0.8rem" }}>
                      {errors.contact_email}
                    </div>
                  )}
                </div>
                <div>
                  <label style={{ display: "block", color: "#333", fontSize: "0.9rem", marginBottom: "0.25rem" }}>
                    Company Email
                  </label>
                  <input
                    name="company_email"
                    value={form.company_email}
                    onChange={handleChange}
                    type="email"
                    style={{
                      border: errors.company_email ? "1px solid #dc2626" : "1px solid #ccc",
                      padding: "0.5rem",
                      width: "100%",
                      borderRadius: "5px",
                      fontSize: "0.9rem",
                      boxSizing: "border-box",
                    }}
                  />
                  {errors.company_email && (
                    <div style={{ color: "#dc2626", fontSize: "0.8rem" }}>
                      {errors.company_email}
                    </div>
                  )}
                </div>
                {isEditing && (
                  <div>
                    <label style={{ display: "block", color: "#333", fontSize: "0.9rem", marginBottom: "0.25rem" }}>
                      Quote Number
                    </label>
                    <input
                      name="quote_no"
                      value={quotes.find(q => q.id === editId)?.quote_no || ""}
                      style={{
                        border: "1px solid #ccc",
                        padding: "0.5rem",
                        width: "100%",
                        borderRadius: "5px",
                        fontSize: "0.9rem",
                        boxSizing: "border-box",
                        backgroundColor: "#f3f4f6",
                      }}
                      readOnly
                    />
                  </div>
                )}
                <div>
                  <label style={{ display: "block", color: "#333", fontSize: "0.9rem", marginBottom: "0.25rem" }}>
                    VAT Percentage
                  </label>
                  <input
                    name="vat_percentage"
                    type="number"
                    value={form.vat_percentage}
                    onChange={handleChange}
                    style={{
                      border: errors.vat_percentage ? "1px solid #dc2626" : "1px solid #ccc",
                      padding: "0.5rem",
                      width: "100%",
                      borderRadius: "5px",
                      fontSize: "0.9rem",
                      boxSizing: "border-box",
                    }}
                    disabled={!form.vat_applicable}
                  />
                  {errors.vat_percentage && (
                    <div style={{ color: "#dc2626", fontSize: "0.8rem" }}>
                      {errors.vat_percentage}
                    </div>
                  )}
                </div>
              </div>

              <div style={{ marginTop: "1rem" }}>
                <label style={{ display: "block", color: "#333", fontSize: "0.9rem", marginBottom: "0.25rem" }}>
                  Notes/Remarks
                </label>
                <textarea
                  name="notes_remarks"
                  value={form.notes_remarks}
                  onChange={handleChange}
                  style={{
                    border: errors.notes_remarks ? "1px solid #dc2626" : "1px solid #ccc",
                    padding: "0.5rem",
                    width: "100%",
                    height: "100px",
                    borderRadius: "5px",
                    fontSize: "0.9rem",
                    boxSizing: "border-box",
                  }}
                />
                {errors.notes_remarks && (
                  <div style={{ color: "#dc2626", fontSize: "0.8rem" }}>
                    {errors.notes_remarks}
                  </div>
                )}
              </div>

              <div style={{ marginTop: "1rem" }}>
                <h3 style={{ fontSize: "1.1rem", color: "#333", marginBottom: "0.5rem" }}>
                  Products
                </h3>
                {errors.products && (
                  <div style={{ color: "#dc2626", fontSize: "0.8rem", marginBottom: "0.5rem" }}>
                    {errors.products}
                  </div>
                )}
                <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "1rem" }}>
                  <thead>
                    <tr style={{ backgroundColor: "#000", color: "#fff" }}>
                      <th style={{ border: "1px solid #000", padding: "0.5rem" }}>Product</th>
                      <th style={{ border: "1px solid #000", padding: "0.5rem" }}>Specification</th>
                      <th style={{ border: "1px solid #000", padding: "0.5rem" }}>Quantity</th>
                      <th style={{ border: "1px solid #000", padding: "0.5rem" }}>Unit Price</th>
                      <th style={{ border: "1px solid #000", padding: "0.5rem" }}>Total</th>
                      <th style={{ border: "1px solid #000", padding: "0.5rem" }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {form.products.map((product, index) => (
                      <tr key={index}>
                        <td style={{ border: "1px solid #000", padding: "0.5rem" }}>
                          <input
                            type="text"
                            value={product.product}
                            onChange={(e) =>
                              handleProductChange(index, "product", e.target.value)
                            }
                            style={{
                              border: errors.products?.[index]?.product ? "1px solid #dc2626" : "1px solid #ccc",
                              padding: "0.5rem",
                              width: "100%",
                              borderRadius: "5px",
                              fontSize: "0.9rem",
                              boxSizing: "border-box",
                            }}
                            required
                          />
                          {errors.products?.[index]?.product && (
                            <div style={{ color: "#dc2626", fontSize: "0.8rem" }}>
                              {errors.products[index].product}
                            </div>
                          )}
                        </td>
                        <td style={{ border: "1px solid #000", padding: "0.5rem" }}>
                          <input
                            type="text"
                            value={product.specification}
                            onChange={(e) =>
                              handleProductChange(index, "specification", e.target.value)
                            }
                            style={{
                              border: "1px solid #ccc",
                              padding: "0.5rem",
                              width: "100%",
                              borderRadius: "5px",
                              fontSize: "0.9rem",
                              boxSizing: "border-box",
                            }}
                          />
                        </td>
                        <td style={{ border: "1px solid #000", padding: "0.5rem" }}>
                          <input
                            type="number"
                            value={product.qty}
                            onChange={(e) =>
                              handleProductChange(index, "qty", e.target.value)
                            }
                            style={{
                              border: errors.products?.[index]?.qty ? "1px solid #dc2626" : "1px solid #ccc",
                              padding: "0.5rem",
                              width: "100%",
                              borderRadius: "5px",
                              fontSize: "0.9rem",
                              boxSizing: "border-box",
                            }}
                            min="1"
                            required
                          />
                          {errors.products?.[index]?.qty && (
                            <div style={{ color: "#dc2626", fontSize: "0.8rem" }}>
                              {errors.products[index].qty}
                            </div>
                          )}
                        </td>
                        <td style={{ border: "1px solid #000", padding: "0.5rem" }}>
                          <input
                            type="number"
                            value={product.unit_price}
                            onChange={(e) =>
                              handleProductChange(index, "unit_price", e.target.value)
                            }
                            style={{
                              border: errors.products?.[index]?.unit_price ? "1px solid #dc2626" : "1px solid #ccc",
                              padding: "0.5rem",
                              width: "100%",
                              borderRadius: "5px",
                              fontSize: "0.9rem",
                              boxSizing: "border-box",
                            }}
                            min="0"
                            step="0.01"
                            required
                          />
                          {errors.products?.[index]?.unit_price && (
                            <div style={{ color: "#dc2626", fontSize: "0.8rem" }}>
                              {errors.products[index].unit_price}
                            </div>
                          )}
                        </td>
                        <td style={{ border: "1px solid #000", padding: "0.5rem", textAlign: "center" }}>
                          {(product.qty * product.unit_price).toFixed(2)}
                        </td>
                        <td style={{ border: "1px solid #000", padding: "0.5rem", textAlign: "center" }}>
                          <button
                            type="button"
                            onClick={() => removeProduct(index)}
                            style={{
                              padding: "0.3rem 0.5rem",
                              backgroundColor: "#dc2626",
                              color: "#fff",
                              border: "none",
                              borderRadius: "5px",
                              fontSize: "0.8rem",
                              cursor: form.products.length === 1 ? "not-allowed" : "pointer",
                              transition: "background-color 0.3s",
                            }}
                            disabled={form.products.length === 1}
                            onMouseOver={(e) => {
                              if (form.products.length > 1) e.target.style.backgroundColor = "#b91c1c";
                            }}
                            onMouseOut={(e) => {
                              if (form.products.length > 1) e.target.style.backgroundColor = "#dc2626";
                            }}
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <button
                  type="button"
                  onClick={addProduct}
                  style={{
                    padding: "0.5rem 1rem",
                    backgroundColor: "#000",
                    color: "#fff",
                    border: "none",
                    borderRadius: "5px",
                    fontSize: "0.9rem",
                    cursor: "pointer",
                    transition: "background-color 0.3s",
                  }}
                  onMouseOver={(e) => (e.target.style.backgroundColor = "#333")}
                  onMouseOut={(e) => (e.target.style.backgroundColor = "#000")}
                >
                  Add Product
                </button>
              </div>

              <div style={{ marginTop: "1rem" }}>
                <h3 style={{ fontSize: "1.1rem", color: "#333", marginBottom: "0.5rem" }}>
                  Totals
                </h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
                  <div>
                    <label style={{ display: "block", color: "#333", fontSize: "0.9rem", marginBottom: "0.25rem" }}>
                      Subtotal
                    </label>
                    <input
                      type="text"
                      value={subtotal.toFixed(2)}
                      style={{
                        border: errors.subtotal ? "1px solid #dc2626" : "1px solid #ccc",
                        padding: "0.5rem",
                        width: "100%",
                        borderRadius: "5px",
                        fontSize: "0.9rem",
                        boxSizing: "border-box",
                        backgroundColor: "#f3f4f6",
                      }}
                      readOnly
                    />
                    {errors.subtotal && (
                      <div style={{ color: "#dc2626", fontSize: "0.8rem" }}>
                        {errors.subtotal}
                      </div>
                    )}
                  </div>
                  <div>
                    <label style={{ display: "block", color: "#333", fontSize: "0.9rem", marginBottom: "0.25rem" }}>
                      VAT Amount
                    </label>
                    <input
                      type="text"
                      value={vat_amount.toFixed(2)}
                      style={{
                        border: errors.vat_amount ? "1px solid #dc2626" : "1px solid #ccc",
                        padding: "0.5rem",
                        width: "100%",
                        borderRadius: "5px",
                        fontSize: "0.9rem",
                        boxSizing: "border-box",
                        backgroundColor: "#f3f4f6",
                      }}
                      readOnly
                    />
                    {errors.vat_amount && (
                      <div style={{ color: "#dc2626", fontSize: "0.8rem" }}>
                        {errors.vat_amount}
                      </div>
                    )}
                  </div>
                  <div>
                    <label style={{ display: "block", color: "#333", fontSize: "0.9rem", marginBottom: "0.25rem" }}>
                      Grand Total
                    </label>
                    <input
                      type="text"
                      value={grand_total.toFixed(2)}
                      style={{
                        border: errors.grand_total ? "1px solid #dc2626" : "1px solid #ccc",
                        padding: "0.5rem",
                        width: "100%",
                        borderRadius: "5px",
                        fontSize: "0.9rem",
                        boxSizing: "border-box",
                        backgroundColor: "#f3f4f6",
                      }}
                      readOnly
                    />
                    {errors.grand_total && (
                      <div style={{ color: "#dc2626", fontSize: "0.8rem" }}>
                        {errors.grand_total}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <label style={{ display: "inline-flex", alignItems: "center", marginTop: "1rem" }}>
                <input
                  type="checkbox"
                  name="vat_applicable"
                  checked={form.vat_applicable}
                  onChange={handleChange}
                  style={{ marginRight: "0.5rem" }}
                />
                <span style={{ color: "#333", fontSize: "0.9rem" }}>VAT Applicable</span>
              </label>

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
                  transition: "background-color 0.3s",
                  width: "100%",
                  marginTop: "1rem",
                }}
                onMouseOver={(e) => (e.target.style.backgroundColor = "#333")}
                onMouseOut={(e) => (e.target.style.backgroundColor = "#000")}
              >
                {isEditing ? "Update Quotation" : "Submit Quotation"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Quotation Table */}
      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "1rem" }}>
        <thead>
          <tr>
            <th style={{ backgroundColor: "#000", color: "#fff", border: "1px solid #000", padding: "0.5rem" }}>
              Company Name
            </th>
            <th style={{ backgroundColor: "#000", color: "#fff", border: "1px solid #000", padding: "0.5rem" }}>
              Contact Name
            </th>
            <th style={{ backgroundColor: "#000", color: "#fff", border: "1px solid #000", padding: "0.5rem" }}>
              Contact Number
            </th>
            <th style={{ backgroundColor: "#000", color: "#fff", border: "1px solid #000", padding: "0.5rem" }}>
              Status
            </th>
            <th style={{ backgroundColor: "#000", color: "#fff", border: "1px solid #000", padding: "0.5rem" }}>
              Quote No
            </th>
            <th style={{ backgroundColor: "#000", color: "#fff", border: "1px solid #000", padding: "0.5rem" }}>
              Quote Title
            </th>
            <th style={{ backgroundColor: "#000", color: "#fff", border: "1px solid #000", padding: "0.5rem" }}>
              Assign To
            </th>
            <th style={{ backgroundColor: "#000", color: "#fff", border: "1px solid #000", padding: "0.5rem" }}>
              Created By
            </th>
            <th style={{ backgroundColor: "#000", color: "#fff", border: "1px solid #000", padding: "0.5rem" }}>
              Create Date
            </th>
            <th style={{ backgroundColor: "#000", color: "#fff", border: "1px solid #000", padding: "0.5rem" }}>
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {filteredQuotes.map((q) => (
            <tr key={q.id}>
              <td style={{ backgroundColor: "#fff", border: "1px solid #000", padding: "0.5rem", textAlign: "center" }}>
                {q.company_name || "-"}
              </td>
              <td style={{ backgroundColor: "#fff", border: "1px solid #000", padding: "0.5rem", textAlign: "center" }}>
                {q.contact_name || "-"}
              </td>
              <td style={{ backgroundColor: "#fff", border: "1px solid #000", padding: "0.5rem", textAlign: "center" }}>
                {q.contact_number || "-"}
              </td>
              <td style={{ backgroundColor: "#fff", border: "1px solid #000", padding: "0.5rem", textAlign: "center" }}>
                <select
                  value={q.status}
                  onChange={(e) => handleStatusChange(q.id, e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.25rem",
                    border: "1px solid #ccc",
                    borderRadius: "5px",
                    fontSize: "0.9rem",
                    boxSizing: "border-box",
                  }}
                >
                  <option value="new">New</option>
                  <option value="open">Open</option>
                  <option value="closed">Closed</option>
                </select>
              </td>
              <td style={{ backgroundColor: "#fff", border: "1px solid #000", padding: "0.5rem", textAlign: "center" }}>
                {q.quote_no || "-"}
              </td>
              <td style={{ backgroundColor: "#fff", border: "1px solid #000", padding: "0.5rem", textAlign: "center" }}>
                {q.quote_title || "-"}
              </td>
              <td style={{ backgroundColor: "#fff", border: "1px solid #000", padding: "0.5rem", textAlign: "center" }}>
                <select
                  value={q.assign_to || ""}
                  onChange={(e) => handleAssignToChange(q.id, e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.25rem",
                    border: "1px solid #ccc",
                    borderRadius: "5px",
                    fontSize: "0.9rem",
                    boxSizing: "border-box",
                  }}
                >
                  <option value="">Select User</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.username}
                    </option>
                  ))}
                </select>
              </td>
              <td style={{ backgroundColor: "#fff", border: "1px solid #000", padding: "0.5rem", textAlign: "center" }}>
                {q.created_by?.username || "-"}
              </td>
              <td style={{ backgroundColor: "#fff", border: "1px solid #000", padding: "0.5rem", textAlign: "center" }}>
                {formatDate(q.create_date) || "-"}
              </td>
              <td style={{ backgroundColor: "#fff", border: "1px solid #000", padding: "0.5rem", textAlign: "center" }}>
                <button
                  onClick={() => handleEditQuote(q)}
                  style={{
                    padding: "0.3rem 0.5rem",
                    backgroundColor: "#000",
                    color: "#fff",
                    border: "none",
                    borderRadius: "5px",
                    fontSize: "0.8rem",
                    cursor: "pointer",
                    transition: "background-color 0.3s",
                  }}
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