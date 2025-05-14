import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

const styles = {
  container: { padding: "2rem" },
  heading: { marginBottom: "1rem", color: "#333", fontSize: "1.5rem" },
  filterContainer: { display: "flex", flexWrap: "wrap", gap: "1rem", marginBottom: "1rem", alignItems: "center" },
  label: { display: "block", color: "#333", fontSize: "0.9rem", marginBottom: "0.25rem" },
  input: { padding: "0.5rem", border: "1px solid #ccc", borderRadius: "5px", fontSize: "0.9rem", width: "100%", boxSizing: "border-box" },
  button: {
    padding: "0.5rem 1rem", backgroundColor: "#000", color: "#fff", border: "none", borderRadius: "5px",
    fontSize: "0.9rem", cursor: "pointer", textTransform: "uppercase", transition: "background-color 0.3s", margin: "0 0.25rem"
  },
  modal: {
    position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0, 0, 0, 0.5)",
    display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000
  },
  modalContent: {
    backgroundColor: "#fff", padding: "2rem", borderRadius: "10px", width: "90%", maxWidth: "1200px",
    maxHeight: "90vh", overflowY: "auto", boxShadow: "0 8px 16px rgba(0, 0, 0, 0.2)", position: "relative", border: "1px solid #e0e0e0"
  },
  closeBtn: {
    position: "absolute", top: "15px", right: "15px", fontSize: "24px", cursor: "pointer", color: "#666",
    backgroundColor: "transparent", border: "none", width: "30px", height: "30px", display: "flex", alignItems: "center", justifyContent: "center"
  },
  table: { width: "100%", borderCollapse: "collapse", marginBottom: "1rem" },
  th: { border: "1px solid #000", padding: "0.5rem", backgroundColor: "#000", color: "#fff" },
  td: { border: "1px solid #000", padding: "0.5rem", backgroundColor: "#fff", textAlign: "center" },
  error: { color: "#dc3545", fontSize: "0.8rem", marginTop: "0.25rem" }
};

const Modal = ({ title, onClose, error, children }) => (
  <div style={styles.modal}>
    <div style={styles.modalContent}>
      <button onClick={onClose} style={styles.closeBtn} aria-label="Close modal">×</button>
      <h2 style={{ fontSize: "1.5rem", color: "#333", marginBottom: "1rem" }}>{title}</h2>
      {error && <div style={styles.error}>{error}</div>}
      {children}
    </div>
  </div>
);

const ProductTable = ({ products, selectedProducts, onSelect, type, disabled }) => (
  <table style={styles.table}>
    <thead>
      <tr>
        {["S.No", "CATEGORY", "SUB CATEGORY", "PRODUCT ID", "PART NO", "NAME", "DESCRIPTION", "STORAGE LOCATION", "CONDITION", ...(type === "imported" ? ["ORIGIN"] : []), "STOCK", "Select"].map(header => (
          <th key={header} style={styles.th}>{header}</th>
        ))}
      </tr>
    </thead>
    <tbody>
      {products.length === 0 ? (
        <tr><td style={styles.td} colSpan={type === "imported" ? 12 : 11}>No products available</td></tr>
      ) : (
        products.map((product, index) => (
          <tr key={product.id}>
            <td style={styles.td}>{index + 1}</td>
            <td style={styles.td}>{product.category?.name || "N/A"}</td>
            <td style={styles.td}>{product.subcategory?.name || "N/A"}</td>
            <td style={styles.td}>{product.product_id}</td>
            <td style={styles.td}>{product.part_no}</td>
            <td style={styles.td}>{product.product_name}</td>
            <td style={styles.td}>{product.description || "N/A"}</td>
            <td style={styles.td}>{product.storage_location}</td>
            <td style={styles.td}>{product.condition ? product.condition.charAt(0).toUpperCase() + product.condition.slice(1) : "N/A"}</td>
            {type === "imported" && <td style={styles.td}>{product.origin || "N/A"}</td>}
            <td style={styles.td}>{product.stock_count}</td>
            <td style={styles.td}>
              <input
                type="checkbox"
                checked={selectedProducts.some(p => p.product_id === product.id)}
                onChange={() => onSelect(product.id)}
                disabled={disabled}
              />
            </td>
          </tr>
        ))
      )}
    </tbody>
  </table>
);

const STSInventoryTypeRemove = () => {
  const { type } = useParams();
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [editSelectedProducts, setEditSelectedProducts] = useState([]);
  const [formData, setFormData] = useState({ removal_type: "sales", remarks: "" });
  const [editFormData, setEditFormData] = useState({ removal_type: "sales", remarks: "", gm_remarks: "", mgmt_remarks: "" });
  const [productFilters, setProductFilters] = useState({ part_no: "", category: "", product_id: "", subcategory: "", product_name: "", description: "" });
  const [requestFilters, setRequestFilters] = useState({ request_no: "", item_name: "", status: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const token = localStorage.getItem("accessToken");

  const statusOptions = [
    { value: "approved", label: "Approved" },
    { value: "pending", label: "Pending" },
    { value: "underreview", label: "Under Review" },
    { value: "rejected", label: "Rejected" }
  ];

  useEffect(() => {
    if (!token) {
      setError("Access token not found.");
      setLoading(false);
      return;
    }
    if (!["local", "imported"].includes(type)) {
      setError("Invalid type. Must be 'local' or 'imported'.");
      setLoading(false);
      return;
    }
    Promise.all([
      axios.get(`http://localhost:8000/inventory/${type}/removal-requests/`, { headers: { Authorization: `Bearer ${token}` } }).then(res => {
        setRequests(res.data);
        setFilteredRequests(res.data);
      }),
      axios.get(`http://localhost:8000/inventory/${type}/products/`, { headers: { Authorization: `Bearer ${token}` } }).then(res => {
        setProducts(res.data);
        setFilteredProducts(res.data);
      }),
      axios.get(`http://localhost:8000/inventory/categories/`, { headers: { Authorization: `Bearer ${token}` } }).then(res => setCategories(res.data)),
      axios.get(`http://localhost:8000/inventory/subcategories/`, { headers: { Authorization: `Bearer ${token}` } }).then(res => {
        console.log("Subcategories response:", res.data);
        setSubcategories(res.data);
      }).catch(err => {
        console.error("Error fetching subcategories:", err);
        setError("Failed to fetch subcategories.");
      })
    ])
      .catch(err => setError("Failed to fetch data. Please try again."))
      .finally(() => setLoading(false));
  }, [type, token]);

  useEffect(() => {
    setFilteredRequests(requests.filter(request => {
      const matchesRequestNo = request.request_no.toLowerCase().includes(requestFilters.request_no.toLowerCase());
      const matchesItemName = request.products.some(item => item.product_name.toLowerCase().includes(requestFilters.item_name.toLowerCase()));
      const matchesStatus = !requestFilters.status || [request.accounts_status, request.gm_status, request.mgmt_status].includes(requestFilters.status);
      return matchesRequestNo && (matchesItemName || !requestFilters.item_name) && matchesStatus;
    }));
  }, [requests, requestFilters]);

  useEffect(() => {
    setFilteredProducts(products.filter(product => {
      return (
        product.part_no.toLowerCase().includes(productFilters.part_no.toLowerCase()) &&
        (!productFilters.category || product.category?.id === parseInt(productFilters.category)) &&
        product.product_id.toLowerCase().includes(productFilters.product_id.toLowerCase()) &&
        (!productFilters.subcategory || product.subcategory?.id === parseInt(productFilters.subcategory)) &&
        product.product_name.toLowerCase().includes(productFilters.product_name.toLowerCase()) &&
        (!productFilters.description || product.description?.toLowerCase().includes(productFilters.description.toLowerCase()))
      );
    }));
  }, [products, productFilters]);

  const handleStatusChange = (requestId, field, value) => {
    if (!token) return setError("Access token not found.");
    axios.patch(`http://localhost:8000/inventory/${type}/removal-requests/${requestId}/`, { [field]: value }, { headers: { Authorization: `Bearer ${token}` } })
      .then(() => {
        setRequests(requests.map(req => req.id === requestId ? { ...req, [field]: value } : req));
        axios.get(`http://localhost:8000/inventory/${type}/products/`, { headers: { Authorization: `Bearer ${token}` } })
          .then(res => {
            setProducts(res.data);
            setFilteredProducts(res.data);
          })
          .catch(err => console.error("Error refetching products:", err));
      })
      .catch(() => setError("Failed to update status."));
  };

  const handleInputChange = (e, isEdit = false) => {
    const { name, value } = e.target;
    if (isEdit) setEditFormData(prev => ({ ...prev, [name]: value }));
    else setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleProductSelect = (productId, isEdit = false) => {
    const setProducts = isEdit ? setEditSelectedProducts : setSelectedProducts;
    setProducts(prev => prev.some(p => p.product_id === productId)
      ? prev.filter(p => p.product_id !== productId)
      : [...prev, { product_id: productId, quantity: "" }]
    );
  };

  const handleQuantityChange = (productId, value, isEdit = false) => {
    const setProducts = isEdit ? setEditSelectedProducts : setSelectedProducts;
    setProducts(prev => prev.map(p => p.product_id === productId ? { ...p, quantity: value } : p));
  };

  const handleFilterChange = (e, isProduct = false) => {
    const { name, value } = e.target;
    if (isProduct && name === "category") {
      setProductFilters({ ...productFilters, category: value, subcategory: "" });
    } else if (isProduct) {
      setProductFilters({ ...productFilters, [name]: value });
    } else {
      setRequestFilters({ ...requestFilters, [name]: value });
    }
  };

  const handleSubmit = (e, isEdit = false) => {
    e.preventDefault();
    if (!token) return setError("Access token not found.");

    if (isEdit) {
      const data = {
        gm_remarks: editFormData.gm_remarks,
        mgmt_remarks: editFormData.mgmt_remarks
      };
      axios.patch(`http://localhost:8000/inventory/${type}/removal-requests/${selectedRequest.id}/`, data, { headers: { Authorization: `Bearer ${token}` } })
        .then(res => {
          setRequests(requests.map(req => req.id === selectedRequest.id ? res.data : req));
          setFilteredRequests(filteredRequests.map(req => req.id === selectedRequest.id ? res.data : req));
          setShowEditModal(false);
          setEditSelectedProducts([]);
          setEditFormData({ removal_type: "sales", remarks: "", gm_remarks: "", mgmt_remarks: "" });
          setSelectedRequest(null);
          setFormErrors({});
        })
        .catch(err => {
          setFormErrors(err.response?.data || {});
          setError("Error updating removal request.");
        });
    } else {
      const selected = selectedProducts;
      if (!selected.length) return setFormErrors({ products: ["Please select at least one product."] });

      const errors = {};
      const productItems = selected.map(sp => {
        const product = products.find(p => p.id === sp.product_id);
        const quantity = parseInt(sp.quantity);
        if (!quantity || quantity <= 0) {
          errors[sp.product_id] = [`Quantity for ${product.product_name} must be greater than 0.`];
        } else if (quantity > product.stock_count) {
          errors[sp.product_id] = [`Quantity for ${product.product_name} exceeds available stock (${product.stock_count}).`];
        }
        return { product_id: sp.product_id, quantity };
      });

      if (Object.keys(errors).length) return setFormErrors(errors);

      const data = {
        product_items: productItems,
        type,
        removal_type: formData.removal_type,
        remarks: formData.remarks
      };

      axios.post(`http://localhost:8000/inventory/${type}/removal-requests/`, data, { headers: { Authorization: `Bearer ${token}` } })
        .then(res => {
          setRequests([...requests, res.data]);
          setFilteredRequests([...requests, res.data]);
          setShowModal(false);
          setSelectedProducts([]);
          setFormData({ removal_type: "sales", remarks: "" });
          setFormErrors({});
        })
        .catch(err => {
          setFormErrors(err.response?.data || {});
          setError("Error submitting removal request.");
        });
    }
  };

  const openViewModal = request => {
    setSelectedRequest(request);
    setShowViewModal(true);
  };

  const openEditModal = request => {
    setSelectedRequest(request);
    setEditFormData({
      removal_type: request.removal_type || "sales",
      remarks: request.remarks || "",
      gm_remarks: request.gm_remarks || "",
      mgmt_remarks: request.mgmt_remarks || ""
    });
    setEditSelectedProducts(request.product_items.map(item => ({
      product_id: item.product_id,
      quantity: item.quantity.toString()
    })));
    setShowEditModal(true);
  };

  const renderFilters = (disabled = false) => (
    <div style={styles.filterContainer}>
      {[
        { name: "part_no", label: "Search by Part No", width: "200px" },
        { name: "product_id", label: "Search by Product ID", width: "200px" },
        { name: "product_name", label: "Search by Name", width: "200px" },
        { name: "description", label: "Search by Description", width: "200px" }
      ].map(({ name, label, width }) => (
        <div key={name}>
          <label style={styles.label}>{label}</label>
          <input
            type="text"
            name={name}
            value={productFilters[name]}
            onChange={e => handleFilterChange(e, true)}
            style={{ ...styles.input, width }}
            placeholder={label}
            disabled={disabled}
          />
        </div>
      ))}
      <div>
        <label style={styles.label}>Category</label>
        <select
          name="category"
          value={productFilters.category}
          onChange={e => handleFilterChange(e, true)}
          style={{ ...styles.input, width: "150px" }}
          disabled={disabled}
        >
          <option value="">All Categories</option>
          {categories.map(category => (
            <option key={category.id} value={category.id}>{category.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label style={styles.label}>Sub Category</label>
        <select
          name="subcategory"
          value={productFilters.subcategory}
          onChange={e => handleFilterChange(e, true)}
          style={{ ...styles.input, width: "150px" }}
          disabled={disabled || !productFilters.category}
        >
          <option value="">All Sub Categories</option>
          {subcategories
            .filter(sub => !productFilters.category || (sub.category?.id ? sub.category.id : sub.category) === parseInt(productFilters.category))
            .map(subcategory => (
              <option key={subcategory.id} value={subcategory.id}>{subcategory.name}</option>
            ))}
        </select>
      </div>
    </div>
  );

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>{`${type.charAt(0).toUpperCase() + type.slice(1)} Removal Requests`}</h2>
      <div style={styles.filterContainer}>
        {[
          { name: "request_no", label: "Search by Request No", width: "200px" },
          { name: "item_name", label: "Search by Item Name", width: "200px" }
        ].map(({ name, label, width }) => (
          <div key={name}>
            <label style={styles.label}>{label}</label>
            <input
              type="text"
              name={name}
              value={requestFilters[name]}
              onChange={handleFilterChange}
              style={{ ...styles.input, width }}
              placeholder={label}
            />
          </div>
        ))}
        <div>
          <label style={styles.label}>Status</label>
          <select name="status" value={requestFilters.status} onChange={handleFilterChange} style={{ ...styles.input, width: "150px" }}>
            <option value="">All Statuses</option>
            {statusOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "1rem" }}>
        <button
          onClick={() => setShowModal(true)}
          style={styles.button}
          onMouseOver={e => (e.target.style.backgroundColor = "#333")}
          onMouseOut={e => (e.target.style.backgroundColor = "#000")}
        >
          CREATE REMOVAL REQUEST
        </button>
      </div>
      {loading ? (
        <div style={{ textAlign: "center", marginTop: "1rem", color: "#555" }}>Loading requests...</div>
      ) : error ? (
        <div style={{ ...styles.error, textAlign: "center", marginTop: "1rem" }}>{error}</div>
      ) : filteredRequests.length === 0 ? (
        <div style={{ ...styles.error, textAlign: "center", marginTop: "1rem" }}>No removal requests found.</div>
      ) : (
        <table style={styles.table}>
          <thead>
            <tr>
              {["S.No", "REQUEST NO", "Item Names", "NOTES/REMARKS", "TYPE OF REMOVAL", "ACCOUNTS STATUS", "GM STATUS", "MGMT STATUS", "Requested By", "Create Date", "Options"].map(header => (
                <th key={header} style={styles.th}>{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredRequests.map((request, index) => (
              <tr key={request.id}>
                <td style={styles.td}>{index + 1}</td>
                <td style={styles.td}>{request.request_no}</td>
                <td style={styles.td}>{request.products.map(item => item.product_name).join(", ") || "N/A"}</td>
                <td style={styles.td}>{request.remarks || "N/A"}</td>
                <td style={styles.td}>{request.removal_type.charAt(0).toUpperCase() + request.removal_type.slice(1)}</td>
                {["accounts_status", "gm_status", "mgmt_status"].map(field => (
                  <td key={field} style={styles.td}>
                    <select
                      value={request[field]}
                      onChange={e => handleStatusChange(request.id, field, e.target.value)}
                      style={styles.input}
                    >
                      {statusOptions.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </td>
                ))}
                <td style={styles.td}>{request.requested_by || "N/A"}</td>
                <td style={styles.td}>{request.created_date ? new Date(request.created_date).toLocaleDateString() : "N/A"}</td>
                <td style={styles.td}>
                  <button style={styles.button} onClick={() => openViewModal(request)} onMouseOver={e => (e.target.style.backgroundColor = "#333")} onMouseOut={e => (e.target.style.backgroundColor = "#000")}>View</button>
                  <button style={styles.button} onClick={() => openEditModal(request)} onMouseOver={e => (e.target.style.backgroundColor = "#333")} onMouseOut={e => (e.target.style.backgroundColor = "#000")}>Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {showModal && (
        <Modal
          title="Create Removal Request"
          onClose={() => {
            setShowModal(false);
            setSelectedProducts([]);
            setFormData({ removal_type: "sales", remarks: "" });
            setFormErrors({});
            setProductFilters({ part_no: "", category: "", product_id: "", subcategory: "", product_name: "", description: "" });
          }}
          error={error}
        >
          <form onSubmit={handleSubmit}>
            {renderFilters()}
            <div style={{ marginBottom: "1rem" }}>
              <h3 style={{ fontSize: "1.2rem", color: "#333", marginBottom: "0.5rem" }}>Select Products</h3>
              <ProductTable products={filteredProducts} selectedProducts={selectedProducts} onSelect={productId => handleProductSelect(productId)} type={type} />
            </div>
            {selectedProducts.length > 0 && (
              <div style={{ marginBottom: "1rem" }}>
                <h3 style={{ fontSize: "1.2rem", color: "#333", marginBottom: "0.5rem" }}>Selected Products</h3>
                {selectedProducts.map(sp => {
                  const product = products.find(p => p.id === sp.product_id);
                  return (
                    <div key={sp.product_id} style={{ display: "flex", flexWrap: "wrap", gap: "1rem", marginBottom: "1rem" }}>
                      <div style={{ flex: "1 1 30%" }}>
                        <label style={styles.label}>Product Name</label>
                        <input type="text" value={product?.product_name || ""} readOnly style={{ ...styles.input, backgroundColor: "#f5f5f5" }} />
                      </div>
                      <div style={{ flex: "1 1 30%" }}>
                        <label style={styles.label}>Quantity to Remove</label>
                        <input
                          type="number"
                          value={sp.quantity}
                          onChange={e => handleQuantityChange(sp.product_id, e.target.value)}
                          required
                          style={styles.input}
                        />
                        {formErrors[sp.product_id] && <div style={styles.error}>{formErrors[sp.product_id].join(", ")}</div>}
                      </div>
                    </div>
                  );
                })}
                <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", marginBottom: "1rem" }}>
                  <div style={{ flex: "1 1 30%" }}>
                    <label style={styles.label}>Removal Type</label>
                    <select name="removal_type" value={formData.removal_type} onChange={handleInputChange} required style={styles.input}>
                      <option value="sales">Sales</option>
                      <option value="deadstock">Deadstock</option>
                    </select>
                  </div>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", marginBottom: "1rem" }}>
                  <div style={{ flex: "1 1 100%" }}>
                    <label style={styles.label}>Remarks</label>
                    <textarea name="remarks" value={formData.remarks} onChange={handleInputChange} style={{ ...styles.input, minHeight: "100px" }} />
                    {formErrors.remarks && <div style={styles.error}>{formErrors.remarks.join(", ")}</div>}
                  </div>
                </div>
              </div>
            )}
            {formErrors.products && <div style={styles.error}>{formErrors.products.join(", ")}</div>}
            <button type="submit" style={{ ...styles.button, width: "100%" }} onMouseOver={e => (e.target.style.backgroundColor = "#333")} onMouseOut={e => (e.target.style.backgroundColor = "#000")}>
              SUBMIT REQUEST
            </button>
          </form>
        </Modal>
      )}
      {showViewModal && selectedRequest && (
        <Modal title="View Removal Request" onClose={() => setShowViewModal(false)} error={error}>
          {renderFilters(true)}
          <div style={{ marginBottom: "1rem" }}>
            <h3 style={{ fontSize: "1.2rem", color: "#333", marginBottom: "0.5rem" }}>Selected Products</h3>
            <ProductTable products={filteredProducts} selectedProducts={selectedRequest.product_items} onSelect={() => {}} type={type} disabled />
          </div>
          {selectedRequest.product_items.length > 0 && (
            <div style={{ marginBottom: "1rem" }}>
              <h3 style={{ fontSize: "1.2rem", color: "#333", marginBottom: "0.5rem" }}>Selected Products</h3>
              {selectedRequest.product_items.map(item => {
                const product = selectedRequest.products.find(p => p.id === item.product_id);
                return (
                  <div key={item.product_id} style={{ display: "flex", flexWrap: "wrap", gap: "1rem", marginBottom: "1rem" }}>
                    <div style={{ flex: "1 1 30%" }}>
                      <label style={styles.label}>Product Name</label>
                      <input type="text" value={product?.product_name || ""} readOnly style={{ ...styles.input, backgroundColor: "#f5f5f5" }} />
                    </div>
                    <div style={{ flex: "1 1 30%" }}>
                      <label style={styles.label}>Quantity to Remove</label>
                      <input type="number" value={item.quantity} readOnly style={{ ...styles.input, backgroundColor: "#f5f5f5" }} />
                    </div>
                  </div>
                );
              })}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", marginBottom: "1rem" }}>
                <div style={{ flex: "1 1 30%" }}>
                  <label style={styles.label}>Removal Type</label>
                  <select value={selectedRequest.removal_type} disabled style={{ ...styles.input, backgroundColor: "#f5f5f5" }}>
                    <option value="sales">Sales</option>
                    <option value="deadstock">Deadstock</option>
                  </select>
                </div>
              </div>
              {["remarks", "gm_remarks", "mgmt_remarks"].map(field => (
                <div key={field} style={{ display: "flex", flexWrap: "wrap", gap: "1rem", marginBottom: "1rem" }}>
                  <div style={{ flex: "1 1 100%" }}>
                    <label style={styles.label}>{field.replace("_", " ").toUpperCase()}</label>
                    <textarea value={selectedRequest[field] || ""} readOnly style={{ ...styles.input, minHeight: "100px", backgroundColor: "#f5f5f5" }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Modal>
      )}
      {showEditModal && selectedRequest && (
        <Modal
          title="Edit Removal Request"
          onClose={() => {
            setShowEditModal(false);
            setSelectedRequest(null);
            setEditSelectedProducts([]);
            setEditFormData({ removal_type: "sales", remarks: "", gm_remarks: "", mgmt_remarks: "" });
          }}
          error={error}
        >
          <form onSubmit={e => handleSubmit(e, true)}>
            {renderFilters(true)}
            <div style={{ marginBottom: "1rem" }}>
              <h3 style={{ fontSize: "1.2rem", color: "#333", marginBottom: "0.5rem" }}>Selected Products</h3>
              <ProductTable products={filteredProducts} selectedProducts={editSelectedProducts} onSelect={() => {}} type={type} disabled />
            </div>
            {editSelectedProducts.length > 0 && (
              <div style={{ marginBottom: "1rem" }}>
                <h3 style={{ fontSize: "1.2rem", color: "#333", marginBottom: "0.5rem" }}>Selected Products</h3>
                {editSelectedProducts.map(sp => {
                  const product = products.find(p => p.id === sp.product_id);
                  return (
                    <div key={sp.product_id} style={{ display: "flex", flexWrap: "wrap", gap: "1rem", marginBottom: "1rem" }}>
                      <div style={{ flex: "1 1 30%" }}>
                        <label style={styles.label}>Product Name</label>
                        <input type="text" value={product?.product_name || ""} readOnly style={{ ...styles.input, backgroundColor: "#f5f5f5" }} />
                      </div>
                      <div style={{ flex: "1 1 30%" }}>
                        <label style={styles.label}>Quantity to Remove</label>
                        <input
                          type="number"
                          value={sp.quantity}
                          readOnly
                          style={{ ...styles.input, backgroundColor: "#f5f5f5" }}
                        />
                      </div>
                    </div>
                  );
                })}
                <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", marginBottom: "1rem" }}>
                  <div style={{ flex: "1 1 30%" }}>
                    <label style={styles.label}>Removal Type</label>
                    <select value={editFormData.removal_type} disabled style={{ ...styles.input, backgroundColor: "#f5f5f5" }}>
                      <option value="sales">Sales</option>
                      <option value="deadstock">Deadstock</option>
                    </select>
                  </div>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", marginBottom: "1rem" }}>
                  <div style={{ flex: "1 1 100%" }}>
                    <label style={styles.label}>Remarks</label>
                    <textarea value={editFormData.remarks} readOnly style={{ ...styles.input, minHeight: "100px", backgroundColor: "#f5f5f5" }} />
                    {formErrors.remarks && <div style={styles.error}>{formErrors.remarks.join(", ")}</div>}
                  </div>
                </div>
                {["gm_remarks", "mgmt_remarks"].map(field => (
                  <div key={field} style={{ display: "flex", flexWrap: "wrap", gap: "1rem", marginBottom: "1rem" }}>
                    <div style={{ flex: "1 1 100%" }}>
                      <label style={styles.label}>{field.replace("_", " ").toUpperCase()}</label>
                      <textarea
                        name={field}
                        value={editFormData[field]}
                        onChange={e => handleInputChange(e, true)}
                        style={{ ...styles.input, minHeight: "100px" }}
                      />
                      {formErrors[field] && <div style={styles.error}>{formErrors[field].join(", ")}</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {formErrors.products && <div style={styles.error}>{formErrors.products.join(", ")}</div>}
            <button type="submit" style={{ ...styles.button, width: "100%" }} onMouseOver={e => (e.target.style.backgroundColor = "#333")} onMouseOut={e => (e.target.style.backgroundColor = "#000")}>
              SAVE CHANGES
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default STSInventoryTypeRemove;
