import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

const STSInventoryType = () => {
  const { type } = useParams();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [stockProduct, setStockProduct] = useState(null);
  const [stockHistory, setStockHistory] = useState([]);
  const [stockFormData, setStockFormData] = useState({
    quantity_added: "",
    remarks: "",
  });
  const [formData, setFormData] = useState({
    category_id: "",
    subcategory_id: "",
    product_name: "",
    description: "",
    part_no: "",
    storage_location: "",
    measurement_unit: "",
    quantity_added: 0,
    remarks: "",
    condition: "new",
    origin: "",
  });
  const [categoryForm, setCategoryForm] = useState({ name: "" });
  const [subcategoryForm, setSubcategoryForm] = useState({
    category_id: "",
    name: "",
  });
  const [filters, setFilters] = useState({
    searchPartNo: "",
    category: "",
    searchProductId: "",
    subcategory: "",
    searchName: "",
    searchDescription: "",
    year: "",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [stockFormErrors, setStockFormErrors] = useState({});
  const token = localStorage.getItem("accessToken");

  // Hardcoded reasonable measurement units
  const measurementUnits = [
    "pcs",
    "kg",
    "g",
    "mg",
    "m",
    "cm",
    "mm",
    "km",
    "l",
    "ml",
    "sqm",
    "sqcm",
    "cu_m",
    "cu_cm",
  ];

  // Condition options
  const conditionOptions = ["new", "used", "refurbished"];

  // Extract unique years for the year filter
  const getUniqueYears = () => {
    const years = new Set();
    products.forEach((product) => {
      if (product.added_on) {
        years.add(new Date(product.added_on).getFullYear());
      }
    });
    stockHistory.forEach((history) => {
      if (history.added_on) {
        years.add(new Date(history.added_on).getFullYear());
      }
    });
    return Array.from(years).sort((a, b) => b - a);
  };

  // Initial data fetch
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
      axios.get(`http://localhost:8000/inventory/${type}/products/`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((res) => {
        setProducts(res.data);
        setFilteredProducts(res.data);
      }),
      axios.get("http://localhost:8000/inventory/categories/", {
        headers: { Authorization: `Bearer ${token}` },
      }).then((res) => setCategories(res.data)),
      axios.get("http://localhost:8000/inventory/subcategories/", {
        headers: { Authorization: `Bearer ${token}` },
      }).then((res) => {
        const normalizedSubcategories = res.data.map((sub) => ({
          id: sub.id,
          name: sub.name,
          category: sub.category.id,
        }));
        setSubcategories(normalizedSubcategories);
      }),
      axios.get(`http://localhost:8000/inventory/${type}/stock-history/`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((res) => {
        setStockHistory(res.data);
      }),
    ])
      .catch((err) => {
        setError("Failed to fetch data. Please try again.");
        console.error("Error fetching data:", err);
      })
      .finally(() => setLoading(false));
  }, [type, token]);

  // Fetch subcategories when Manage Categories modal opens
  useEffect(() => {
    if (showCategoryModal && token) {
      axios
        .get("http://localhost:8000/inventory/subcategories/", {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => {
          const normalizedSubcategories = res.data.map((sub) => ({
            id: sub.id,
            name: sub.name,
            category: sub.category.id,
          }));
          setSubcategories(normalizedSubcategories);
        })
        .catch((err) => {
          setError("Failed to fetch subcategories.");
          console.error("Error fetching subcategories:", err);
        });
    }
  }, [showCategoryModal, token]);

  // Fetch stock history when stock modal opens
  useEffect(() => {
    if (showStockModal && stockProduct && token) {
      axios
        .get(`http://localhost:8000/inventory/${type}/stock-history/`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => {
          const productHistory = res.data.filter(
            (history) => history.product.id === stockProduct.id
          );
          setStockHistory(res.data); // Update full stock history
        })
        .catch((err) => {
          setError("Failed to fetch stock history.");
          console.error("Error fetching stock history:", err);
        });
    }
  }, [showStockModal, stockProduct, type, token]);

  useEffect(() => {
    setFilteredProducts(
      products.filter((product) => {
        const latestActivity = getLatestActivity(product);
        const activityYear = latestActivity !== "N/A" ? new Date(latestActivity).getFullYear().toString() : "";
        return (
          (!filters.searchPartNo ||
            product.part_no.toLowerCase().includes(filters.searchPartNo.toLowerCase())) &&
          (!filters.category ||
            product.category?.name.toLowerCase() === filters.category.toLowerCase()) &&
          (!filters.searchProductId ||
            product.product_id.toLowerCase().includes(filters.searchProductId.toLowerCase())) &&
          (!filters.subcategory ||
            product.subcategory?.name.toLowerCase() === filters.subcategory.toLowerCase()) &&
          (!filters.searchName ||
            product.product_name.toLowerCase().includes(filters.searchName.toLowerCase())) &&
          (!filters.searchDescription ||
            (product.description || "")
              .toLowerCase()
              .includes(filters.searchDescription.toLowerCase())) &&
          (!filters.year || activityYear === filters.year)
        );
      })
    );
  }, [filters, products, stockHistory]);

  const handleFilterChange = (e) =>
    setFilters({ ...filters, [e.target.name]: e.target.value });

  const handleCreateProduct = () => {
    setShowForm(true);
    setFormData({
      category_id: "",
      subcategory_id: "",
      product_name: "",
      description: "",
      part_no: "",
      storage_location: "",
      measurement_unit: "",
      quantity_added: 0,
      remarks: "",
      condition: "new",
      origin: "",
    });
    setFormErrors({});
  };

  const handleRemoveStock = () => {
    navigate(`/inventory/sts-inventory/${type}/removestock`);
  };

  const handleAddStock = (product) => {
    setShowStockModal(true);
    setStockProduct(product);
    setStockFormData({ quantity_added: "", remarks: "" });
    setStockFormErrors({});
  };

  const handleStockInputChange = (e) =>
    setStockFormData({ ...stockFormData, [e.target.name]: e.target.value });

  const handleInputChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleCategoryInputChange = (e) =>
    setCategoryForm({ ...categoryForm, [e.target.name]: e.target.value });

  const handleSubcategoryInputChange = (e) =>
    setSubcategoryForm({ ...subcategoryForm, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!token) {
      setError("Access token not found.");
      return;
    }

    const submitData = {
      ...formData,
      type, // Use URL parameter for type
      category_id: parseInt(formData.category_id) || null,
      subcategory_id: parseInt(formData.subcategory_id) || null,
      quantity_added: parseInt(formData.quantity_added, 10) || 0,
      stock_count: parseInt(formData.quantity_added, 10) || 0,
      origin: type === "imported" ? formData.origin : null, // Set origin to null for local
    };

    axios
      .post(`http://localhost:8000/inventory/${type}/products/`, submitData, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setProducts([res.data, ...products]);
        setShowForm(false);
        setFormErrors({});
      })
      .catch((err) => {
        if (err.response?.data) {
          setFormErrors(err.response.data);
          setError("Error submitting product. Please check the form.");
        } else {
          setError("Error submitting product.");
        }
        console.error("Error submitting product:", err);
      });
  };

  const handleStockSubmit = (e) => {
    e.preventDefault();
    if (!token) {
      setError("Access token not found.");
      return;
    }

    const submitData = {
      product_id: stockProduct.id,
      quantity_added: parseInt(stockFormData.quantity_added, 10),
      remarks: stockFormData.remarks,
    };

    axios
      .post(`http://localhost:8000/inventory/${type}/stock-history/`, submitData, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        // Update the product's stock_count and quantity_added in the local state
        setProducts(
          products.map((p) =>
            p.id === stockProduct.id
              ? {
                  ...p,
                  stock_count: p.stock_count + submitData.quantity_added,
                  quantity_added: p.quantity_added + submitData.quantity_added,
                }
              : p
          )
        );
        setStockHistory([...stockHistory, res.data]);
        setShowStockModal(false);
        setStockFormData({ quantity_added: "", remarks: "" });
        setStockFormErrors({});
      })
      .catch((err) => {
        if (err.response?.data) {
          setStockFormErrors(err.response.data);
          setError("Error adding stock. Please check the form.");
        } else {
          setError("Error adding stock.");
        }
        console.error("Error adding stock:", err);
      });
  };

  const handleCategorySubmit = (e) => {
    e.preventDefault();
    if (!token) {
      setError("Access token not found.");
      return;
    }

    axios
      .post("http://localhost:8000/inventory/categories/", categoryForm, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setCategories([...categories, res.data]);
        setCategoryForm({ name: "" });
      })
      .catch((err) => {
        setError("Error adding category.");
        console.error("Error adding category:", err);
      });
  };

  const handleSubcategorySubmit = (e) => {
    e.preventDefault();
    if (!token) {
      setError("Access token not found.");
      return;
    }

    axios
      .post(
        "http://localhost:8000/inventory/subcategories/",
        { name: subcategoryForm.name, category_id: parseInt(subcategoryForm.category_id) },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      .then((res) => {
        const newSubcategory = {
          id: res.data.id,
          name: res.data.name,
          category: res.data.category.id,
        };
        setSubcategories([...subcategories, newSubcategory]);
        setSubcategoryForm({ category_id: "", name: "" });
      })
      .catch((err) => {
        setError("Error adding subcategory.");
        console.error("Error adding subcategory:", err.response?.data || err);
      });
  };

  // Function to get the latest activity timestamp for a product
  const getLatestActivity = (product) => {
    const productHistory = stockHistory.filter(
      (history) => history.product.id === product.id
    );
    const latestStockHistory = productHistory.reduce(
      (latest, history) =>
        !latest || new Date(history.added_on) > new Date(latest.added_on)
          ? history
          : latest,
      null
    );
    const productAddedOn = product.added_on ? new Date(product.added_on) : null;
    const latestStockAddedOn = latestStockHistory
      ? new Date(latestStockHistory.added_on)
      : null;

    if (!productAddedOn && !latestStockAddedOn) {
      return "N/A";
    }
    if (!latestStockAddedOn) {
      return productAddedOn.toLocaleString();
    }
    if (!productAddedOn) {
      return latestStockAddedOn.toLocaleString();
    }
    return productAddedOn > latestStockAddedOn
      ? productAddedOn.toLocaleString()
      : latestStockAddedOn.toLocaleString();
  };

  const buttonStyle = {
    padding: "0.5rem 1rem",
    backgroundColor: "#000",
    color: "#fff",
    border: "none",
    borderRadius: "5px",
    fontSize: "0.9rem",
    cursor: "pointer",
    textTransform: "uppercase",
    transition: "background-color 0.3s",
  };
  const smallButtonStyle = {
    ...buttonStyle,
    padding: "0.3rem 0.5rem",
    fontSize: "0.8rem",
    marginRight: "0.5rem",
  };
  const inputStyle = {
    padding: "0.5rem",
    border: "1px solid #ccc",
    borderRadius: "5px",
    fontSize: "0.9rem",
    boxSizing: "border-box",
  };
  const modalStyle = {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  };
  const modalContentStyle = {
    backgroundColor: "#fff",
    padding: "2rem",
    borderRadius: "10px",
    width: "90%",
    maxWidth: "800px",
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
  const tableStyle = {
    width: "100%",
    borderCollapse: "collapse",
    marginBottom: "1rem",
  };
  const thStyle = {
    border: "1px solid #000",
    padding: "0.5rem",
    backgroundColor: "#000",
    color: "#fff",
  };
  const tdStyle = {
    border: "1px solid #000",
    padding: "0.5rem",
    backgroundColor: "#fff",
    textAlign: "center",
  };
  const errorStyle = {
    color: "#dc3545",
    fontSize: "0.8rem",
    marginTop: "0.25rem",
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h2 style={{ marginBottom: "1rem", color: "#333", fontSize: "1.5rem" }}>
        {`${type.charAt(0).toUpperCase() + type.slice(1)} STS Inventory`}
      </h2>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          flexWrap: "wrap",
          gap: "1rem",
          marginBottom: "1rem",
        }}
      >
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "1rem",
            alignItems: "center",
          }}
        >
          {[
            { name: "searchPartNo", label: "Search Part No", type: "text", width: "200px" },
            {
              name: "category",
              label: "CATEGORY",
              type: "select",
              width: "200px",
              options: [
                { value: "", label: "All Categories" },
                ...categories.map((cat) => ({
                  value: cat.name,
                  label: cat.name,
                })),
              ],
            },
            { name: "searchProductId", label: "Search Product ID", type: "text", width: "200px" },
            {
              name: "subcategory",
              label: "SUB CATEGORY",
              type: "select",
              width: "200px",
              options: [
                { value: "", label: "All Subcategories" },
                ...subcategories.map((sub) => ({
                  value: sub.name,
                  label: sub.name,
                })),
              ],
            },
            { name: "searchName", label: "Search Name", type: "text", width: "200px" },
            { name: "searchDescription", label: "Search Description", type: "text", width: "200px" },
            {
              name: "year",
              label: "Select Year",
              type: "select",
              width: "200px",
              options: [
                { value: "", label: "All Years" },
                ...getUniqueYears().map((year) => ({
                  value: year.toString(),
                  label: year.toString(),
                })),
              ],
            },
          ].map(({ name, label, type: inputType, width, options }) => (
            <div key={name}>
              <label
                style={{
                  display: "block",
                  color: "#333",
                  fontSize: "0.9rem",
                  marginBottom: "0.25rem",
                }}
              >
                {label}
              </label>
              {inputType === "text" ? (
                <input
                  type="text"
                  name={name}
                  value={filters[name]}
                  onChange={handleFilterChange}
                  style={{ ...inputStyle, width }}
                />
              ) : (
                <select
                  name={name}
                  value={filters[name]}
                  onChange={handleFilterChange}
                  style={{ ...inputStyle, width }}
                >
                  {options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              )}
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: "1rem" }}>
          <button
            onClick={handleCreateProduct}
            style={buttonStyle}
            onMouseOver={(e) => (e.target.style.backgroundColor = "#333")}
            onMouseOut={(e) => (e.target.style.backgroundColor = "#000")}
            aria-label="Add product"
          >
            ADD NEW PRODUCT
          </button>
          <button
            onClick={handleRemoveStock}
            style={buttonStyle}
            onMouseOver={(e) => (e.target.style.backgroundColor = "#333")}
            onMouseOut={(e) => (e.target.style.backgroundColor = "#000")}
            aria-label="Remove stock"
          >
            REMOVE STOCK
          </button>
        </div>
      </div>
      {showForm && (
        <div style={modalStyle}>
          <div style={modalContentStyle}>
            <span
              onClick={() => setShowForm(false)}
              style={closeBtnStyle}
              aria-label="Close modal"
            >
              ×
            </span>
            <form onSubmit={handleSubmit} style={{ padding: "1rem 0" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "1rem",
                }}
              >
                <h2
                  style={{
                    fontSize: "1.5rem",
                    color: "#333",
                  }}
                >
                  ADD NEW PRODUCT
                </h2>
                <button
                  type="button"
                  style={{ ...buttonStyle, fontSize: "0.8rem" }}
                  onClick={() => setShowCategoryModal(true)}
                  onMouseOver={(e) => (e.target.style.backgroundColor = "#333")}
                  onMouseOut={(e) => (e.target.style.backgroundColor = "#000")}
                  aria-label="Add new category"
                >
                  ADD NEW CATEGORY
                </button>
              </div>
              {error && <div style={errorStyle}>{error}</div>}
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "1rem",
                  marginBottom: "1rem",
                }}
              >
                <div style={{ flex: "1 1 30%" }}>
                  <label
                    style={{
                      display: "block",
                      color: "#333",
                      fontSize: "0.9rem",
                      marginBottom: "0.25rem",
                    }}
                  >
                    CATEGORY
                  </label>
                  <select
                    name="category_id"
                    value={formData.category_id}
                    onChange={handleInputChange}
                    required
                    style={{ ...inputStyle, width: "100%" }}
                  >
                    <option value="">Select Category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  {formErrors.category_id && (
                    <div style={errorStyle}>{formErrors.category_id.join(", ")}</div>
                  )}
                </div>
                <div style={{ flex: "1 1 30%" }}>
                  <label
                    style={{
                      display: "block",
                      color: "#333",
                      fontSize: "0.9rem",
                      marginBottom: "0.25rem",
                    }}
                  >
                    SUB-CATEGORY
                  </label>
                  <select
                    name="subcategory_id"
                    value={formData.subcategory_id}
                    onChange={handleInputChange}
                    required
                    style={{ ...inputStyle, width: "100%" }}
                  >
                    <option value="">Select Subcategory</option>
                    {subcategories
                      .filter(
                        (sub) =>
                          !formData.category_id ||
                          sub.category === parseInt(formData.category_id)
                      )
                      .map((subcategory) => (
                        <option key={subcategory.id} value={subcategory.id}>
                          {subcategory.name}
                        </option>
                      ))}
                  </select>
                  {formErrors.subcategory_id && (
                    <div style={errorStyle}>{formErrors.subcategory_id.join(", ")}</div>
                  )}
                </div>
                <div style={{ flex: "1 1 30%" }}>
                  <label
                    style={{
                      display: "block",
                      color: "#333",
                      fontSize: "0.9rem",
                      marginBottom: "0.25rem",
                    }}
                  >
                    Product Name
                  </label>
                  <input
                    type="text"
                    name="product_name"
                    value={formData.product_name}
                    onChange={handleInputChange}
                    required
                    style={{ ...inputStyle, width: "100%" }}
                  />
                  {formErrors.product_name && (
                    <div style={errorStyle}>{formErrors.product_name.join(", ")}</div>
                  )}
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "1rem",
                  marginBottom: "1rem",
                }}
              >
                <div style={{ flex: "1 1 30%" }}>
                  <label
                    style={{
                      display: "block",
                      color: "#333",
                      fontSize: "0.9rem",
                      marginBottom: "0.25rem",
                    }}
                  >
                    Description
                  </label>
                  <input
                    type="text"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    style={{ ...inputStyle, width: "100%" }}
                  />
                  {formErrors.description && (
                    <div style={errorStyle}>{formErrors.description.join(", ")}</div>
                  )}
                </div>
                <div style={{ flex: "1 1 30%" }}>
                  <label
                    style={{
                      display: "block",
                      color: "#333",
                      fontSize: "0.9rem",
                      marginBottom: "0.25rem",
                    }}
                  >
                    Part-No
                  </label>
                  <input
                    type="text"
                    name="part_no"
                    value={formData.part_no}
                    onChange={handleInputChange}
                    required
                    style={{ ...inputStyle, width: "100%" }}
                  />
                  {formErrors.part_no && (
                    <div style={errorStyle}>{formErrors.part_no.join(", ")}</div>
                  )}
                </div>
                <div style={{ flex: "1 1 30%" }}>
                  <label
                    style={{
                      display: "block",
                      color: "#333",
                      fontSize: "0.9rem",
                      marginBottom: "0.25rem",
                    }}
                  >
                    Storage Location
                  </label>
                  <input
                    type="text"
                    name="storage_location"
                    value={formData.storage_location}
                    onChange={handleInputChange}
                    required
                    style={{ ...inputStyle, width: "100%" }}
                  />
                  {formErrors.storage_location && (
                    <div style={errorStyle}>{formErrors.storage_location.join(", ")}</div>
                  )}
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "1rem",
                  marginBottom: "1rem",
                }}
              >
                <div style={{ flex: "1 1 30%" }}>
                  <label
                    style={{
                      display: "block",
                      color: "#333",
                      fontSize: "0.9rem",
                      marginBottom: "0.25rem",
                    }}
                  >
                    Condition
                  </label>
                  <select
                    name="condition"
                    value={formData.condition}
                    onChange={handleInputChange}
                    required
                    style={{ ...inputStyle, width: "100%" }}
                  >
                    <option value="">Select Condition</option>
                    {conditionOptions.map((condition) => (
                      <option key={condition} value={condition}>
                        {condition.charAt(0).toUpperCase() + condition.slice(1)}
                      </option>
                    ))}
                  </select>
                  {formErrors.condition && (
                    <div style={errorStyle}>{formErrors.condition.join(", ")}</div>
                  )}
                </div>
                <div style={{ flex: "1 1 30%" }}>
                  <label
                    style={{
                      display: "block",
                      color: "#333",
                      fontSize: "0.9rem",
                      marginBottom: "0.25rem",
                    }}
                  >
                    MEASUREMENT
                  </label>
                  <select
                    name="measurement_unit"
                    value={formData.measurement_unit}
                    onChange={handleInputChange}
                    required
                    style={{ ...inputStyle, width: "100%" }}
                  >
                    <option value="">Select Unit</option>
                    {measurementUnits.map((unit) => (
                      <option key={unit} value={unit}>
                        {unit}
                      </option>
                    ))}
                  </select>
                  {formErrors.measurement_unit && (
                    <div style={errorStyle}>{formErrors.measurement_unit.join(", ")}</div>
                  )}
                </div>
                <div style={{ flex: "1 1 30%" }}>
                  <label
                    style={{
                      display: "block",
                      color: "#333",
                      fontSize: "0.9rem",
                      marginBottom: "0.25rem",
                    }}
                  >
                    NEW STOCK
                  </label>
                  <input
                    type="number"
                    name="quantity_added"
                    value={formData.quantity_added}
                    onChange={handleInputChange}
                    required
                    style={{ ...inputStyle, width: "100%" }}
                  />
                  {formErrors.quantity_added && (
                    <div style={errorStyle}>{formErrors.quantity_added.join(", ")}</div>
                  )}
                </div>
              </div>
              {type === "imported" && (
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "1rem",
                    marginBottom: "1rem",
                  }}
                >
                  <div style={{ flex: "1 1 30%" }}>
                    <label
                      style={{
                        display: "block",
                        color: "#333",
                        fontSize: "0.9rem",
                        marginBottom: "0.25rem",
                      }}
                    >
                      Origin
                    </label>
                    <input
                      type="text"
                      name="origin"
                      value={formData.origin}
                      onChange={handleInputChange}
                      required
                      style={{ ...inputStyle, width: "100%" }}
                    />
                    {formErrors.origin && (
                      <div style={errorStyle}>{formErrors.origin.join(", ")}</div>
                    )}
                  </div>
                </div>
              )}
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "1rem",
                  marginBottom: "1rem",
                }}
              >
                <div style={{ flex: "1 1 65%", display: "grid", gridColumn: "span 2" }}>
                  <label
                    style={{
                      display: "block",
                      color: "#333",
                      fontSize: "0.9rem",
                      marginBottom: "0.25rem",
                    }}
                  >
                    Remarks
                  </label>
                  <textarea
                    name="remarks"
                    value={formData.remarks}
                    onChange={handleInputChange}
                    style={{ ...inputStyle, width: "100%", minHeight: "100px" }}
                  />
                  {formErrors.remarks && (
                    <div style={errorStyle}>{formErrors.remarks.join(", ")}</div>
                  )}
                </div>
              </div>
              {formErrors.added_by_id && (
                <div style={errorStyle}>{formErrors.added_by_id.join(", ")}</div>
              )}
              <button
                type="submit"
                style={{ ...buttonStyle, width: "100%" }}
                onMouseOver={(e) => (e.target.style.backgroundColor = "#333")}
                onMouseOut={(e) => (e.target.style.backgroundColor = "#000")}
                aria-label="Submit product"
              >
                SUBMIT
              </button>
            </form>
          </div>
        </div>
      )}
      {showStockModal && stockProduct && (
        <div style={{ ...modalStyle, zIndex: 1200 }}>
          <div style={modalContentStyle}>
            <span
              onClick={() => setShowStockModal(false)}
              style={closeBtnStyle}
              aria-label="Close stock modal"
            >
              ×
            </span>
            <h2
              style={{
                fontSize: "1.5rem",
                color: "#333",
                marginBottom: "1rem",
              }}
            >
              Add Stock for {stockProduct.product_name}
            </h2>
            {error && <div style={errorStyle}>{error}</div>}
            <div style={{ marginBottom: "1rem" }}>
              <h3
                style={{
                  fontSize: "1.2rem",
                  color: "#333",
                  marginBottom: "0.5rem",
                }}
              >
                Product Details
              </h3>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "1rem",
                  marginBottom: "1rem",
                }}
              >
                {[
                  { label: "Category", value: stockProduct.category?.name || "N/A" },
                  { label: "Subcategory", value: stockProduct.subcategory?.name || "N/A" },
                  { label: "Product Name", value: stockProduct.product_name },
                ].map(({ label, value }) => (
                  <div key={label} style={{ flex: "1 1 30%" }}>
                    <label
                      style={{
                        display: "block",
                        color: "#333",
                        fontSize: "0.9rem",
                        marginBottom: "0.25rem",
                      }}
                    >
                      {label}
                    </label>
                    <input
                      type="text"
                      value={value}
                      readOnly
                      style={{ ...inputStyle, width: "100%", backgroundColor: "#f5f5f5" }}
                    />
                  </div>
                ))}
              </div>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "1rem",
                  marginBottom: "1rem",
                }}
              >
                {[
                  { label: "Description", value: stockProduct.description || "N/A" },
                  { label: "Part No", value: stockProduct.part_no },
                  { label: "Storage Location", value: stockProduct.storage_location },
                ].map(({ label, value }) => (
                  <div key={label} style={{ flex: "1 1 30%" }}>
                    <label
                      style={{
                        display: "block",
                        color: "#333",
                        fontSize: "0.9rem",
                        marginBottom: "0.25rem",
                      }}
                    >
                      {label}
                    </label>
                    <input
                      type="text"
                      value={value}
                      readOnly
                      style={{ ...inputStyle, width: "100%", backgroundColor: "#f5f5f5" }}
                    />
                  </div>
                ))}
              </div>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "1rem",
                  marginBottom: "1rem",
                }}
              >
                {[
                  {
                    label: "Condition",
                    value: stockProduct.condition
                      ? stockProduct.condition.charAt(0).toUpperCase() +
                        stockProduct.condition.slice(1)
                      : "N/A",
                  },
                  { label: "Measurement Unit", value: stockProduct.measurement_unit },
                  { label: "Current Stock", value: stockProduct.stock_count },
                ].map(({ label, value }) => (
                  <div key={label} style={{ flex: "1 1 30%" }}>
                    <label
                      style={{
                        display: "block",
                        color: "#333",
                        fontSize: "0.9rem",
                        marginBottom: "0.25rem",
                      }}
                    >
                      {label}
                    </label>
                    <input
                      type="text"
                      value={value}
                      readOnly
                      style={{ ...inputStyle, width: "100%", backgroundColor: "#f5f5f5" }}
                    />
                  </div>
                ))}
              </div>
              {type === "imported" && (
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "1rem",
                    marginBottom: "1rem",
                  }}
                >
                  <div style={{ flex: "1 1 30%" }}>
                    <label
                      style={{
                        display: "block",
                        color: "#333",
                        fontSize: "0.9rem",
                        marginBottom: "0.25rem",
                      }}
                    >
                      Origin
                    </label>
                    <input
                      type="text"
                      value={stockProduct.origin || "N/A"}
                      readOnly
                      style={{ ...inputStyle, width: "100%", backgroundColor: "#f5f5f5" }}
                    />
                  </div>
                </div>
              )}
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "1rem",
                  marginBottom: "1rem",
                }}
              >
                <div style={{ flex: "1 1 65%" }}>
                  <label
                    style={{
                      display: "block",
                      color: "#333",
                      fontSize: "0.9rem",
                      marginBottom: "0.25rem",
                    }}
                  >
                    Remarks
                  </label>
                  <textarea
                    value={stockProduct.remarks || ""}
                    readOnly
                    style={{
                      ...inputStyle,
                      width: "100%",
                      minHeight: "100px",
                      backgroundColor: "#f5f5f5",
                    }}
                  />
                </div>
              </div>
            </div>
            <div style={{ marginBottom: "1rem" }}>
              <h3
                style={{
                  fontSize: "1.2rem",
                  color: "#333",
                  marginBottom: "0.5rem",
                }}
              >
                Stock History
              </h3>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>Quantity Added</th>
                    <th style={thStyle}>Added By</th>
                    <th style={thStyle}>Added On</th>
                    <th style={thStyle}>Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {stockHistory
                    .filter((history) => history.product.id === stockProduct.id)
                    .length === 0 ? (
                    <tr>
                      <td style={tdStyle} colSpan="4">
                        No stock history available
                      </td>
                    </tr>
                  ) : (
                    stockHistory
                      .filter((history) => history.product.id === stockProduct.id)
                      .map((history) => (
                        <tr key={history.id}>
                          <td style={tdStyle}>{history.quantity_added}</td>
                          <td style={tdStyle}>{history.added_by || "N/A"}</td>
                          <td style={tdStyle}>
                            {history.added_on
                              ? new Date(history.added_on).toLocaleString()
                              : "N/A"}
                          </td>
                          <td style={tdStyle}>{history.remarks || "N/A"}</td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
            <div style={{ marginBottom: "1rem" }}>
              <h3
                style={{
                  fontSize: "1.2rem",
                  color: "#333",
                  marginBottom: "0.5rem",
                }}
              >
                Add New Stock
              </h3>
              <form onSubmit={handleStockSubmit}>
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "1rem",
                    marginBottom: "1rem",
                  }}
                >
                  <div style={{ flex: "1 1 30%" }}>
                    <label
                      style={{
                        display: "block",
                        color: "#333",
                        fontSize: "0.9rem",
                        marginBottom: "0.25rem",
                      }}
                    >
                      New Stock Quantity
                    </label>
                    <input
                      type="number"
                      name="quantity_added"
                      value={stockFormData.quantity_added}
                      onChange={handleStockInputChange}
                      required
                      min="1"
                      style={{ ...inputStyle, width: "100%" }}
                    />
                    {stockFormErrors.quantity_added && (
                      <div style={errorStyle}>
                        {stockFormErrors.quantity_added.join(", ")}
                      </div>
                    )}
                  </div>
                  <div style={{ flex: "1 1 65%" }}>
                    <label
                      style={{
                        display: "block",
                        color: "#333",
                        fontSize: "0.9rem",
                        marginBottom: "0.25rem",
                      }}
                    >
                      Remarks
                    </label>
                    <textarea
                      name="remarks"
                      value={stockFormData.remarks}
                      onChange={handleStockInputChange}
                      style={{ ...inputStyle, width: "100%", minHeight: "100px" }}
                    />
                    {stockFormErrors.remarks && (
                      <div style={errorStyle}>{stockFormErrors.remarks.join(", ")}</div>
                    )}
                  </div>
                </div>
                <button
                  type="submit"
                  style={{ ...buttonStyle, width: "100%" }}
                  onMouseOver={(e) => (e.target.style.backgroundColor = "#333")}
                  onMouseOut={(e) => (e.target.style.backgroundColor = "#000")}
                  aria-label="Add stock"
                >
                  ADD STOCK
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
      {showCategoryModal && (
        <div style={{ ...modalStyle, zIndex: 1100 }}>
          <div style={modalContentStyle}>
            <span
              onClick={() => setShowCategoryModal(false)}
              style={closeBtnStyle}
              aria-label="Close category modal"
            >
              ×
            </span>
            <h2
              style={{
                marginBottom: "1rem",
                fontSize: "1.5rem",
                color: "#333",
              }}
            >
              Manage Categories
            </h2>
            <div style={{ marginBottom: "1rem" }}>
              <h3
                style={{
                  fontSize: "1.2rem",
                  color: "#333",
                  marginBottom: "0.5rem",
                }}
              >
                Add New Category
              </h3>
              <form onSubmit={handleCategorySubmit}>
                <div style={{ marginBottom: "1rem" }}>
                  <label
                    style={{
                      display: "block",
                      color: "#333",
                      fontSize: "0.9rem",
                      marginBottom: "0.25rem",
                    }}
                  >
                    Category Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={categoryForm.name}
                    onChange={handleCategoryInputChange}
                    required
                    style={{ ...inputStyle, width: "100%" }}
                  />
                </div>
                <button
                  type="submit"
                  style={buttonStyle}
                  onMouseOver={(e) => (e.target.style.backgroundColor = "#333")}
                  onMouseOut={(e) => (e.target.style.backgroundColor = "#000")}
                  aria-label="Add category"
                >
                  Add Category
                </button>
              </form>
            </div>
            <div style={{ marginBottom: "1rem" }}>
              <h3
                style={{
                  fontSize: "1.2rem",
                  color: "#333",
                  marginBottom: "0.5rem",
                }}
              >
                Add New Subcategory
              </h3>
              <form onSubmit={handleSubcategorySubmit}>
                <div
                  style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}
                >
                  <div style={{ flex: 1 }}>
                    <label
                      style={{
                        display: "block",
                        color: "#333",
                        fontSize: "0.9rem",
                        marginBottom: "0.25rem",
                      }}
                    >
                      Category
                    </label>
                    <select
                      name="category_id"
                      value={subcategoryForm.category_id}
                      onChange={handleSubcategoryInputChange}
                      required
                      style={{ ...inputStyle, width: "100%" }}
                    >
                      <option value="">Select Category</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label
                      style={{
                        display: "block",
                        color: "#333",
                        fontSize: "0.9rem",
                        marginBottom: "0.25rem",
                      }}
                    >
                      Subcategory Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={subcategoryForm.name}
                      onChange={handleSubcategoryInputChange}
                      required
                      style={{ ...inputStyle, width: "100%" }}
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  style={buttonStyle}
                  onMouseOver={(e) => (e.target.style.backgroundColor = "#333")}
                  onMouseOut={(e) => (e.target.style.backgroundColor = "#000")}
                  aria-label="Add subcategory"
                >
                  Add Subcategory
                </button>
              </form>
            </div>
            <div style={{ marginBottom: "1rem" }}>
              <h3
                style={{
                  fontSize: "1.2rem",
                  color: "#333",
                  marginBottom: "0.5rem",
                }}
              >
                Existing Categories
              </h3>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>Category</th>
                    <th style={thStyle}>Subcategories</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.length === 0 ? (
                    <tr>
                      <td style={tdStyle} colSpan="2">
                        No data available
                      </td>
                    </tr>
                  ) : (
                    categories.map((category) => (
                      <tr key={category.id}>
                        <td style={tdStyle}>{category.name}</td>
                        <td style={tdStyle}>
                          {subcategories
                            .filter((sub) => sub.category === category.id)
                            .map((sub) => sub.name)
                            .join(", ") || "None"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      {loading ? (
        <div
          style={{
            textAlign: "center",
            marginTop: "1rem",
            color: "#555",
            fontSize: "1rem",
          }}
        >
          Loading products...
        </div>
      ) : error ? (
        <div
          style={{
            color: "#dc3545",
            textAlign: "center",
            marginTop: "1rem",
            fontSize: "1rem",
          }}
        >
          {error}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div
          style={{
            color: "#dc3545",
            textAlign: "center",
            marginTop: "1rem",
            fontSize: "1rem",
          }}
        >
          No products found.
        </div>
      ) : (
        <table
          style={{ width: "100%", borderCollapse: "collapse", marginTop: "1rem" }}
        >
          <thead>
            <tr style={{ backgroundColor: "#000", color: "#fff" }}>
              {[
                "S.No",
                "CATEGORY",
                "SUB CATEGORY",
                "PRODUCT ID",
                "PART NO",
                "NAME",
                "DESCRIPTION",
                "STORAGE LOCATION",
                "CONDITION",
                ...(type === "imported" ? ["ORIGIN"] : []),
                "STOCK",
                "Last Activity",
                "Actions",
              ].map((header) => (
                <th
                  key={header}
                  style={{ border: "1px solid #000", padding: "0.5rem" }}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((product, index) => (
              <tr key={product.id} style={{ backgroundColor: "#fff" }}>
                <td style={{ border: "1px solid #000", padding: "0.5rem" }}>
                  {index + 1}
                </td>
                <td style={{ border: "1px solid #000", padding: "0.5rem" }}>
                  {product.category?.name || "N/A"}
                </td>
                <td style={{ border: "1px solid #000", padding: "0.5rem" }}>
                  {product.subcategory?.name || "N/A"}
                </td>
                <td style={{ border: "1px solid #000", padding: "0.5rem" }}>
                  {product.product_id}
                </td>
                <td style={{ border: "1px solid #000", padding: "0.5rem" }}>
                  {product.part_no}
                </td>
                <td style={{ border: "1px solid #000", padding: "0.5rem" }}>
                  {product.product_name}
                </td>
                <td style={{ border: "1px solid #000", padding: "0.5rem" }}>
                  {product.description || "N/A"}
                </td>
                <td style={{ border: "1px solid #000", padding: "0.5rem" }}>
                  {product.storage_location}
                </td>
                <td style={{ border: "1px solid #000", padding: "0.5rem" }}>
                  {product.condition
                    ? product.condition.charAt(0).toUpperCase() + product.condition.slice(1)
                    : "N/A"}
                </td>
                {type === "imported" && (
                  <td style={{ border: "1px solid #000", padding: "0.5rem" }}>
                    {product.origin || "N/A"}
                  </td>
                )}
                <td style={{ border: "1px solid #000", padding: "0.5rem" }}>
                  {product.stock_count}
                </td>
                <td style={{ border: "1px solid #000", padding: "0.5rem" }}>
                  {getLatestActivity(product)}
                </td>
                <td style={{ border: "1px solid #000", padding: "0.5rem" }}>
                  <button
                    onClick={() => handleAddStock(product)}
                    style={smallButtonStyle}
                    onMouseOver={(e) => (e.target.style.backgroundColor = "#333")}
                    onMouseOut={(e) => (e.target.style.backgroundColor = "#000")}
                    aria-label="Add stock"
                  >
                    Add Stock
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default STSInventoryType;