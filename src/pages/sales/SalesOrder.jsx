import React, { useEffect, useState } from "react";
import axios from "axios";

const inputStyle = {
  padding: "0.5rem",
  border: "1px solid #ccc",
  borderRadius: "5px",
  fontSize: "0.9rem",
  width: "100%",
  boxSizing: "border-box",
};

const buttonStyle = {
  padding: "0.5rem 1rem",
  backgroundColor: "#000",
  color: "#fff",
  border: "none",
  borderRadius: "5px",
  fontSize: "0.9rem",
  cursor: "pointer",
  transition: "background-color 0.3s",
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
  width: "80%",
  maxWidth: "700px",
  maxHeight: "80vh",
  overflowY: "auto",
  boxShadow: "0 8px 16px rgba(0, 0, 0, 0.2)",
  position: "relative",
  margin: "auto",
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
};

const FilterInput = ({ label, name, type = "text", width = "200px", value, onChange }) => (
  <div>
    <label style={{ display: "block", color: "#333", fontSize: "0.9rem", marginBottom: "0.25rem" }}>{label}</label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      style={{ ...inputStyle, width }}
    />
  </div>
);

const SalesOrder = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [showModal, setShowModal] = useState({ create: false, view: false });
  const [viewOrder, setViewOrder] = useState(null);
  const [form, setForm] = useState({
    company_name: "",
    contact_email: "",
    company_email: "",
    lpo_no: "",
    address: "",
    subject: "",
    terms_and_conditions: "",
    issue_date: "",
    currency: "USD",
    cust_ref: "",
    our_ref: "",
    advance_amount: 0,
    remarks: "",
    payment_terms: "",
    delivery_terms: "",
    omc_cost: 0,
    services: [{ sorp: "", barcode: "", service_title: "", qty: 1, rate: 0, unit: "", amount: 0 }],
  });
  const [errors, setErrors] = useState({});
  const [filters, setFilters] = useState({
    searchOrderNo: "",
    searchCompany: "",
    searchContactNumber: "",
    fromDate: "",
    toDate: "",
  });

  const getAuthToken = () => localStorage.getItem("accessToken");

  const fetchData = async (url, setter, errorMsg) => {
    try {
      const res = await axios.get(url, { headers: { Authorization: `Bearer ${getAuthToken()}` } });
      setter(res.data);
    } catch (err) {
      console.error(errorMsg, err);
      setErrors({ general: errorMsg });
    }
  };

  useEffect(() => {
    fetchData("http://localhost:8000/sales/sales-orders/", setOrders, "Failed to fetch orders.");
    fetchData("http://localhost:8000/sales/order-companies", setContacts, "Failed to fetch contacts.");
  }, []);

  useEffect(() => {
    let filtered = orders;
    const { searchOrderNo, searchCompany, searchContactNumber, fromDate, toDate } = filters;

    if (searchOrderNo) filtered = filtered.filter(o => o.order_no.toLowerCase().includes(searchOrderNo.toLowerCase()));
    if (searchCompany) filtered = filtered.filter(o => o.company_name.toLowerCase().includes(searchCompany.toLowerCase()));
    if (searchContactNumber) filtered = filtered.filter(o => (o.contact_number || "").toLowerCase().includes(searchContactNumber.toLowerCase()));
    if (fromDate || toDate) {
      filtered = filtered.filter(o => {
        const orderDate = new Date(o.created_on).getTime();
        const from = fromDate ? new Date(fromDate).getTime() : null;
        const to = toDate ? new Date(toDate).getTime() : null;
        return (!from || orderDate >= from) && (!to || orderDate <= to);
      });
    }

    setFilteredOrders(filtered);
  }, [filters, orders]);

  const handleFilterChange = e => setFilters({ ...filters, [e.target.name]: e.target.value });

  const handleStatusChange = async (orderId, field, value) => {
    try {
      await axios.patch(`http://localhost:8000/sales/sales-orders/${orderId}/`, { [field]: value }, {
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });
      const update = o => o.id === orderId ? { ...o, [field]: value } : o;
      setOrders(orders.map(update));
      setFilteredOrders(filteredOrders.map(update));
    } catch (err) {
      console.error(`Failed to update ${field}`, err);
      setErrors({ general: `Failed to update ${field}.` });
    }
  };

  const handleChange = e => {
    const { name, value } = e.target;
    setErrors({ ...errors, [name]: "" });
    if (name === "company_name") {
      const contact = contacts.find(c => c.company_name === value);
      setForm({
        ...form,
        company_name: value,
        company_email: contact?.company_email || "",
        contact_email: contact?.contact_email || "",
      });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleServiceChange = (index, e) => {
    const { name, value } = e.target;
    const services = [...form.services];
    services[index] = { ...services[index], [name]: value };
    if (name === "qty" || name === "rate") {
      services[index].amount = (parseFloat(services[index].qty) || 0) * (parseFloat(services[index].rate) || 0);
    }
    setForm({ ...form, services });
  };

  const addService = () => setForm({
    ...form,
    services: [...form.services, { sorp: "", barcode: "", service_title: "", qty: 1, rate: 0, unit: "", amount: 0 }],
  });

  const removeService = index => setForm({ ...form, services: form.services.filter((_, i) => i !== index) });

  const calculateTotals = (services = form.services) => {
    const subtotal = services.reduce((sum, s) => sum + (parseFloat(s.amount) || 0), 0);
    const vat = subtotal * 0.05;
    return { subtotal, vat, net_total: subtotal + vat };
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setErrors({});
    const requiredFields = ["company_name", "contact_email", "lpo_no", "address", "subject", "issue_date", "currency", "payment_terms", "delivery_terms"];
    const newErrors = {};

    requiredFields.forEach(f => !form[f] && (newErrors[f] = `${f.replace("_", " ")} is required.`));
    if (!form.services.length) newErrors.services = "At least one service is required.";
    form.services.forEach((s, i) => {
      if (!s.service_title) newErrors[`service_title_${i}`] = `Service title for row ${i + 1} is required.`;
      if (!s.qty || s.qty <= 0) newErrors[`qty_${i}`] = `Quantity for row ${i + 1} must be greater than 0.`;
      if (!s.rate || s.rate <= 0) newErrors[`rate_${i}`] = `Rate for row ${i + 1} must be greater than 0.`;
    });

    if (Object.keys(newErrors).length) {
      setErrors(newErrors);
      return;
    }

    const token = getAuthToken();
    if (!token) {
      setErrors({ general: "Access token not found." });
      return;
    }

    try {
      const totals = calculateTotals();
      await axios.post("http://localhost:8000/sales/sales-orders/", { ...form, ...totals, order_services: form.services }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchData("http://localhost:8000/sales/sales-orders/", setOrders, "Failed to fetch orders.");
      setShowModal({ ...showModal, create: false });
      setForm({
        company_name: "", contact_email: "", company_email: "", lpo_no: "", address: "", subject: "",
        terms_and_conditions: "", issue_date: "", currency: "USD", cust_ref: "", our_ref: "",
        advance_amount: 0, remarks: "", payment_terms: "", delivery_terms: "", omc_cost: 0,
        services: [{ sorp: "", barcode: "", service_title: "", qty: 1, rate: 0, unit: "", amount: 0 }],
      });
    } catch (err) {
      console.error("Failed to save order", err);
      setErrors(err.response?.data || { general: "An unexpected error occurred." });
    }
  };

  const formatDate = date => new Date(date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });

  const statusOptions = [
    { value: "new", label: "New" },
    { value: "job_card_created", label: "Job Card Created" },
    { value: "completed", label: "Completed" },
  ];

  const accountsStatusOptions = [
    { value: "approved", label: "Approved" },
    { value: "pending", label: "Pending" },
    { value: "under_review", label: "Under Review" },
  ];

  const gmStatusOptions = [
    { value: "approved", label: "Approved" },
    { value: "under_review", label: "Under Review" },
    { value: "rejected", label: "Rejected" },
  ];

  const mgmtStatusOptions = [
    { value: "approved", label: "Approved" },
    { value: "under_review", label: "Under Review" },
    { value: "pending", label: "Pending" },
  ];

  const StatusSelect = ({ value, field, orderId }) => {
    const options = {
      status: statusOptions,
      accounts_status: accountsStatusOptions,
      gm_status: gmStatusOptions,
      mgmt_status: mgmtStatusOptions,
    }[field];

    return (
      <select
        value={value}
        onChange={e => handleStatusChange(orderId, field, e.target.value)}
        style={{ ...inputStyle, padding: "0.25rem" }}
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    );
  };

  const ModalContent = ({ isView = false }) => {
    const data = isView ? viewOrder : form;
    const services = isView ? (viewOrder?.order_services || []) : form.services;
    const totals = isView ? { subtotal: viewOrder?.subtotal || 0, vat: viewOrder?.vat || 0, net_total: viewOrder?.net_total || 0 } : calculateTotals(services);

    return (
      <div style={modalStyle}>
        <div style={modalContentStyle}>
          <button onClick={() => setShowModal({ ...showModal, [isView ? "view" : "create"]: false })} style={closeBtnStyle}>×</button>
          <form onSubmit={isView ? null : handleSubmit}>
            <h2 style={{ fontSize: "1.5rem", color: "#333", marginBottom: "1rem" }}>{isView ? "View Sales Order" : "Create New Sales Order"}</h2>
            {errors.general && !isView && <div style={{ color: "#dc2626", marginBottom: "1rem" }}>{errors.general}</div>}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
              {/* Section 1 */}
              <div>
                {/* Company Name (Full Width) */}
                <div style={{ marginBottom: "1rem" }}>
                  <label style={{ display: "block", color: "#333", fontSize: "0.9rem", marginBottom: "0.25rem" }}>Company Name</label>
                  {isView ? (
                    <input value={data.company_name || "-"} readOnly style={inputStyle} />
                  ) : (
                    <select
                      name="company_name"
                      value={data.company_name}
                      onChange={handleChange}
                      style={{ ...inputStyle, border: errors.company_name ? "1px solid #dc2626" : "1px solid #ccc" }}
                      required
                    >
                      <option value="">Select Company</option>
                      {contacts.map(c => <option key={c.company_name} value={c.company_name}>{c.company_name}</option>)}
                    </select>
                  )}
                  {!isView && errors.company_name && <div style={{ color: "#dc2626", fontSize: "0.8rem" }}>{errors.company_name}</div>}
                </div>
                {/* Contact Email and Company Email (Side by Side) */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                  <div>
                    <label style={{ display: "block", color: "#333", fontSize: "0.9rem", marginBottom: "0.25rem" }}>Contact Email</label>
                    {isView ? (
                      <input value={data.contact_email || "-"} readOnly style={inputStyle} />
                    ) : (
                      <input
                        name="contact_email"
                        type="email"
                        value={data.contact_email}
                        onChange={handleChange}
                        style={{ ...inputStyle, border: errors.contact_email ? "1px solid #dc2626" : "1px solid #ccc" }}
                        required
                      />
                    )}
                    {!isView && errors.contact_email && <div style={{ color: "#dc2626", fontSize: "0.8rem" }}>{errors.contact_email}</div>}
                  </div>
                  <div>
                    <label style={{ display: "block", color: "#333", fontSize: "0.9rem", marginBottom: "0.25rem" }}>Company Email</label>
                    {isView ? (
                      <input value={data.company_email || "-"} readOnly style={inputStyle} />
                    ) : (
                      <input
                        name="company_email"
                        type="email"
                        value={data.company_email}
                        onChange={handleChange}
                        style={{ ...inputStyle, border: errors.company_email ? "1px solid #dc2626" : "1px solid #ccc" }}
                      />
                    )}
                    {!isView && errors.company_email && <div style={{ color: "#dc2626", fontSize: "0.8rem" }}>{errors.company_email}</div>}
                  </div>
                </div>
                {/* Address (Full Width) */}
                <div style={{ marginBottom: "1rem" }}>
                  <label style={{ display: "block", color: "#333", fontSize: "0.9rem", marginBottom: "0.25rem" }}>Address</label>
                  {isView ? (
                    <textarea value={data.address || "-"} readOnly style={{ ...inputStyle, height: "100px" }} />
                  ) : (
                    <textarea
                      name="address"
                      value={data.address}
                      onChange={handleChange}
                      style={{ ...inputStyle, height: "100px", border: errors.address ? "1px solid #dc2626" : "1px solid #ccc" }}
                      required
                    />
                  )}
                  {!isView && errors.address && <div style={{ color: "#dc2626", fontSize: "0.8rem" }}>{errors.address}</div>}
                </div>
                {/* LPO No and OMC Cost (Side by Side) */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                  <div>
                    <label style={{ display: "block", color: "#333", fontSize: "0.9rem", marginBottom: "0.25rem" }}>LPO No</label>
                    {isView ? (
                      <input value={data.lpo_no || "-"} readOnly style={inputStyle} />
                    ) : (
                      <input
                        name="lpo_no"
                        value={data.lpo_no}
                        onChange={handleChange}
                        style={{ ...inputStyle, border: errors.lpo_no ? "1px solid #dc2626" : "1px solid #ccc" }}
                        required
                      />
                    )}
                    {!isView && errors.lpo_no && <div style={{ color: "#dc2626", fontSize: "0.8rem" }}>{errors.lpo_no}</div>}
                  </div>
                  <div>
                    <label style={{ display: "block", color: "#333", fontSize: "0.9rem", marginBottom: "0.25rem" }}>OMC Cost</label>
                    {isView ? (
                      <input value={data.omc_cost || "-"} readOnly style={inputStyle} />
                    ) : (
                      <input
                        name="omc_cost"
                        type="number"
                        value={data.omc_cost}
                        onChange={handleChange}
                        style={{ ...inputStyle, border: errors.omc_cost ? "1px solid #dc2626" : "1px solid #ccc" }}
                        min={0}
                      />
                    )}
                    {!isView && errors.omc_cost && <div style={{ color: "#dc2626", fontSize: "0.8rem" }}>{errors.omc_cost}</div>}
                  </div>
                </div>
                {/* Payment Terms and Delivery Terms (Side by Side) */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                  <div>
                    <label style={{ display: "block", color: "#333", fontSize: "0.9rem", marginBottom: "0.25rem" }}>Payment Terms</label>
                    {isView ? (
                      <input value={data.payment_terms || "-"} readOnly style={inputStyle} />
                    ) : (
                      <input
                        name="payment_terms"
                        value={data.payment_terms}
                        onChange={handleChange}
                        style={{ ...inputStyle, border: errors.payment_terms ? "1px solid #dc2626" : "1px solid #ccc" }}
                        required
                      />
                    )}
                    {!isView && errors.payment_terms && <div style={{ color: "#dc2626", fontSize: "0.8rem" }}>{errors.payment_terms}</div>}
                  </div>
                  <div>
                    <label style={{ display: "block", color: "#333", fontSize: "0.9rem", marginBottom: "0.25rem" }}>Delivery Terms</label>
                    {isView ? (
                      <input value={data.delivery_terms || "-"} readOnly style={inputStyle} />
                    ) : (
                      <input
                        name="delivery_terms"
                        value={data.delivery_terms}
                        onChange={handleChange}
                        style={{ ...inputStyle, border: errors.delivery_terms ? "1px solid #dc2626" : "1px solid #ccc" }}
                        required
                      />
                    )}
                    {!isView && errors.delivery_terms && <div style={{ color: "#dc2626", fontSize: "0.8rem" }}>{errors.delivery_terms}</div>}
                  </div>
                </div>
                {/* Terms and Conditions (Full Width) */}
                <div style={{ marginBottom: "1rem" }}>
                  <label style={{ display: "block", color: "#333", fontSize: "0.9rem", marginBottom: "0.25rem" }}>Terms and Conditions</label>
                  {isView ? (
                    <textarea value={data.terms_and_conditions || "-"} readOnly style={{ ...inputStyle, height: "100px" }} />
                  ) : (
                    <textarea
                      name="terms_and_conditions"
                      value={data.terms_and_conditions}
                      onChange={handleChange}
                      style={{ ...inputStyle, height: "100px", border: errors.terms_and_conditions ? "1px solid #dc2626" : "1px solid #ccc" }}
                    />
                  )}
                  {!isView && errors.terms_and_conditions && <div style={{ color: "#dc2626", fontSize: "0.8rem" }}>{errors.terms_and_conditions}</div>}
                </div>
              </div>
              {/* Section 2 */}
              <div>
                {[
                  { label: "Issue Date", name: "issue_date", type: "date", required: true },
                  { label: "Currency", name: "currency", type: "select", options: ["USD", "EUR", "AED"], required: true },
                  { label: "Customer Reference", name: "cust_ref" },
                  { label: "Our Reference", name: "our_ref" },
                  { label: "Advance Amount", name: "advance_amount", type: "number", min: 0 },
                ].map(({ label, name, type, options, required, min }) => (
                  <div key={name} style={{ marginBottom: "1rem" }}>
                    <label style={{ display: "block", color: "#333", fontSize: "0.9rem", marginBottom: "0.25rem" }}>{label}</label>
                    {isView ? (
                      <input value={data[name] || "-"} readOnly style={inputStyle} />
                    ) : type === "select" ? (
                      <select
                        name={name}
                        value={data[name]}
                        onChange={handleChange}
                        style={{ ...inputStyle, border: errors[name] ? "1px solid #dc2626" : "1px solid #ccc" }}
                        required={required}
                      >
                        {options.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    ) : (
                      <input
                        name={name}
                        type={type || "text"}
                        value={data[name]}
                        onChange={handleChange}
                        style={{ ...inputStyle, border: errors[name] ? "1px solid #dc2626" : "1px solid #ccc" }}
                        required={required}
                        min={min}
                      />
                    )}
                    {!isView && errors[name] && <div style={{ color: "#dc2626", fontSize: "0.8rem" }}>{errors[name]}</div>}
                  </div>
                ))}
                {isView && [
                  { label: "Status", value: statusOptions.find(o => o.value === data.status)?.label },
                  { label: "Accounts Status", value: accountsStatusOptions.find(o => o.value === data.accounts_status)?.label },
                  { label: "GM Status", value: gmStatusOptions.find(o => o.value === data.gm_status)?.label },
                  { label: "Management Status", value: mgmtStatusOptions.find(o => o.value === data.mgmt_status)?.label },
                  { label: "Created By", value: data.created_by_username },
                  { label: "Created On", value: formatDate(data.created_on) },
                ].map(({ label, value }) => (
                  <div key={label} style={{ marginBottom: "1rem" }}>
                    <label style={{ display: "block", color: "#333", fontSize: "0.9rem", marginBottom: "0.25rem" }}>{label}</label>
                    <input value={value || "-"} readOnly style={inputStyle} />
                  </div>
                ))}
              </div>
            </div>
            {/* Section 3: Services Table */}
            <div style={{ marginTop: "1rem" }}>
              <h3 style={{ fontSize: "1.1rem", color: "#333", marginBottom: "0.5rem" }}>Order Services</h3>
              {!isView && errors.services && <div style={{ color: "#dc2626", fontSize: "0.8rem", marginBottom: "0.5rem" }}>{errors.services}</div>}
              <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "1rem" }}>
                <thead>
                  <tr style={{ backgroundColor: "#000", color: "#fff" }}>
                    {["SORP", "Barcode", "Service Title", "Quantity", "Rate", "Unit", "Amount", ...(isView ? [] : ["Action"])].map(h => (
                      <th key={h} style={{ border: "1px solid #000", padding: "0.5rem" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {services.length > 0 ? (
                    services.map((service, index) => (
                      <tr key={index}>
                        {["sorp", "barcode", "service_title", "qty", "rate", "unit"].map(field => (
                          <td key={field} style={{ border: "1px solid #000", padding: "0.5rem", textAlign: "center" }}>
                            {isView ? (
                              service[field] || "-"
                            ) : (
                              <input
                                name={field}
                                value={service[field]}
                                onChange={e => handleServiceChange(index, e)}
                                type={field === "qty" || field === "rate" ? "number" : "text"}
                                style={{
                                  ...inputStyle,
                                  border: errors[`${field}_${index}`] ? "1px solid #dc2626" : "1px solid #ccc",
                                }}
                                min={field === "qty" ? 1 : field === "rate" ? 0 : undefined}
                                step={field === "rate" ? 0.01 : undefined}
                                required={field === "service_title" || field === "qty" || field === "rate"}
                              />
                            )}
                            {!isView && errors[`${field}_${index}`] && (
                              <div style={{ color: "#dc2626", fontSize: "0.8rem" }}>{errors[`${field}_${index}`]}</div>
                            )}
                          </td>
                        ))}
                        <td style={{ border: "1px solid #000", padding: "0.5rem", textAlign: "center" }}>
                          {(service.amount || 0).toFixed(2)}
                        </td>
                        {!isView && (
                          <td style={{ border: "1px solid #000", padding: "0.5rem", textAlign: "center" }}>
                            <button
                              type="button"
                              onClick={() => removeService(index)}
                              style={{ ...buttonStyle, padding: "0.3rem 0.5rem", backgroundColor: "#dc2626" }}
                              onMouseOver={e => (e.target.style.backgroundColor = "#b91c1c")}
                              onMouseOut={e => (e.target.style.backgroundColor = "#dc2626")}
                            >
                              Remove
                            </button>
                          </td>
                        )}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={isView ? 7 : 8} style={{ border: "1px solid #000", padding: "0.5rem", textAlign: "center" }}>
                        No services available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              {!isView && (
                <button
                  type="button"
                  onClick={addService}
                  style={buttonStyle}
                  onMouseOver={e => (e.target.style.backgroundColor = "#333")}
                  onMouseOut={e => (e.target.style.backgroundColor = "#000")}
                >
                  Add Service
                </button>
              )}
            </div>
            {/* Section 4: Totals */}
            <div style={{ marginTop: "1rem" }}>
              <h3 style={{ fontSize: "1.1rem", color: "#333", marginBottom: "0.5rem" }}>Totals</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {[
                  { label: "Subtotal", value: totals.subtotal.toFixed(2) },
                  { label: "VAT (5%)", value: totals.vat.toFixed(2) },
                  { label: "Net Total", value: totals.net_total.toFixed(2) },
                ].map(({ label, value }) => (
                  <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontWeight: "500", color: "#333", fontSize: "0.9rem" }}>{label}</span>
                    <span style={{ color: "#333", fontSize: "0.9rem" }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
            {!isView && (
              <button
                type="submit"
                style={{ ...buttonStyle, width: "100%", marginTop: "1rem", textTransform: "uppercase" }}
                onMouseOver={e => (e.target.style.backgroundColor = "#333")}
                onMouseOut={e => (e.target.style.backgroundColor = "#000")}
              >
                Submit Sales Order
              </button>
            )}
          </form>
        </div>
      </div>
    );
  };

  return (
    <div style={{ padding: "2rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <h2 style={{ fontSize: "1.5rem", color: "#333" }}>Sales Orders</h2>
        <button
          onClick={() => setShowModal({ ...showModal, create: true })}
          style={buttonStyle}
          onMouseOver={e => (e.target.style.backgroundColor = "#333")}
          onMouseOut={e => (e.target.style.backgroundColor = "#000")}
        >
          Create New Order
        </button>
      </div>

      {errors.general && <div style={{ color: "#dc2626", marginBottom: "1rem" }}>{errors.general}</div>}

      <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", marginBottom: "1rem", alignItems: "center" }}>
        <FilterInput
          label="Search by Sales Order Number"
          name="searchOrderNo"
          value={filters.searchOrderNo}
          onChange={handleFilterChange}
        />
        <FilterInput
          label="Search by Company"
          name="searchCompany"
          value={filters.searchCompany}
          onChange={handleFilterChange}
        />
        <FilterInput
          label="Search by Contact Number"
          name="searchContactNumber"
          value={filters.searchContactNumber}
          onChange={handleFilterChange}
        />
        <FilterInput
          label="From"
          name="fromDate"
          type="date"
          width="150px"
          value={filters.fromDate}
          onChange={handleFilterChange}
        />
        <FilterInput
          label="To"
          name="toDate"
          type="date"
          width="150px"
          value={filters.toDate}
          onChange={handleFilterChange}
        />
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ backgroundColor: "#000", color: "#fff" }}>
            {["S.No", "Sales Order No", "Company Name", "Contact Name", "Contact Number", "Status", "Remarks",
              "Accounts Status", "GM Status", "Mgmt Status", "Create Date", "Created By", "Action"].map(h => (
              <th key={h} style={{ border: "1px solid #000", padding: "0.5rem" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filteredOrders.map((order, index) => (
            <tr key={order.id}>
              <td style={{ border: "1px solid #000", padding: "0.5rem", textAlign: "center" }}>{index + 1}</td>
              <td style={{ border: "1px solid #000", padding: "0.5rem", textAlign: "center" }}>{order.order_no || "-"}</td>
              <td style={{ border: "1px solid #000", padding: "0.5rem", textAlign: "center" }}>{order.company_name || "-"}</td>
              <td style={{ border: "1px solid #000", padding: "0.5rem", textAlign: "center" }}>{order.contact_name || "-"}</td>
              <td style={{ border: "1px solid #000", padding: "0.5rem", textAlign: "center" }}>{order.contact_number || "-"}</td>
              <td style={{ border: "1px solid #000", padding: "0.5rem", textAlign: "center" }}>
                <StatusSelect value={order.status} field="status" orderId={order.id} />
              </td>
              <td style={{ border: "1px solid #000", padding: "0.5rem", textAlign: "center" }}>{order.remarks || "-"}</td>
              <td style={{ border: "1px solid #000", padding: "0.5rem", textAlign: "center" }}>
                <StatusSelect value={order.accounts_status} field="accounts_status" orderId={order.id} />
              </td>
              <td style={{ border: "1px solid #000", padding: "0.5rem", textAlign: "center" }}>
                <StatusSelect value={order.gm_status} field="gm_status" orderId={order.id} />
              </td>
              <td style={{ border: "1px solid #000", padding: "0.5rem", textAlign: "center" }}>
                <StatusSelect value={order.mgmt_status} field="mgmt_status" orderId={order.id} />
              </td>
              <td style={{ border: "1px solid #000", padding: "0.5rem", textAlign: "center" }}>{formatDate(order.created_on) || "-"}</td>
              <td style={{ border: "1px solid #000", padding: "0.5rem", textAlign: "center" }}>{order.created_by_username || "-"}</td>
              <td style={{ border: "1px solid #000", padding: "0.5rem", textAlign: "center" }}>
                <button
                  style={{ ...buttonStyle, padding: "0.3rem 0.5rem", backgroundColor: "Black" }}
                  onClick={() => {
                    setViewOrder(order);
                    setShowModal({ ...showModal, view: true });
                  }}
                  onMouseOver={e => (e.target.style.backgroundColor = "Black")}
                  onMouseOut={e => (e.target.style.backgroundColor = "Black")}
                >
                  View
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showModal.create && <ModalContent />}
      {showModal.view && viewOrder && <ModalContent isView />}
    </div>
  );
};

export default SalesOrder;