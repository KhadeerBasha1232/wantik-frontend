import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const FormField = ({ label, name, type = "text", isSelect, options, required, readOnly, min, value, onChange, error, width = "100%" }) => (
  <div className="mb-3">
    <label className="form-label text-dark" style={{ fontSize: "0.9rem" }}>{label}</label>
    {isSelect ? (
      <select
        name={name}
        value={value}
        onChange={onChange}
        className={`form-select ${error ? "border-danger" : ""} ${readOnly ? "bg-light" : ""}`}
        style={{ width, fontSize: "0.9rem", borderRadius: "5px" }}
        required={required}
        disabled={readOnly}
      >
        <option value="">{`Select ${label}`}</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    ) : type === "textarea" ? (
      <textarea
        name={name}
        value={value}
        onChange={onChange}
        className={`form-control ${error ? "border-danger" : ""} ${readOnly ? "bg-light" : ""}`}
        style={{ width, fontSize: "0.9rem", borderRadius: "5px", height: "100px" }}
        readOnly={readOnly}
      />
    ) : (
      <input
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        className={`form-control ${error ? "border-danger" : ""} ${readOnly ? "bg-light" : ""}`}
        style={{ width, fontSize: "0.9rem", borderRadius: "5px" }}
        required={required}
        readOnly={readOnly}
        min={min}
      />
    )}
    {error && <div className="text-danger" style={{ fontSize: "0.8rem" }}>{error}</div>}
  </div>
);

const VehicleTable = ({ vehicles, errors, onChange, onRemove, onAdd, readOnly }) => (
  <div className="mt-3">
    <h3 className="fs-5 text-dark mb-2">Vehicles</h3>
    {errors.vehicles && <div className="text-danger" style={{ fontSize: "0.8rem" }}>{errors.vehicles}</div>}
    <div className="table-responsive">
      <table className="table table-bordered">
        <thead>
          <tr className="bg-dark text-white">
            {["Chassis Number", "Specification", "Remarks", "Vehicle Make", "Vehicle Type", !readOnly && "Action"].filter(Boolean).map((h) => (
              <th key={h} className="p-2 text-center" style={{ fontSize: "0.9rem" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {vehicles.map((v, i) => (
            <tr key={i}>
              {["chassis_number", "specification", "remarks", "vehicle_make", "vehicle_type"].map((f) => (
                <td key={f} className="p-2 text-center">
                  <input
                    name={f}
                    value={v[f]}
                    onChange={(e) => onChange(i, e)}
                    className={`form-control ${errors[`${f}_${i}`] ? "border-danger" : ""} ${readOnly ? "bg-light" : ""}`}
                    style={{ fontSize: "0.9rem", borderRadius: "5px" }}
                    required={f === "chassis_number"}
                    readOnly={readOnly}
                  />
                  {errors[`${f}_${i}`] && <div className="text-danger" style={{ fontSize: "0.8rem" }}>{errors[`${f}_${i}`]}</div>}
                </td>
              ))}
              {!readOnly && (
                <td className="p-2 text-center">
                  <button
                    type="button"
                    onClick={() => onRemove(i)}
                    className="btn btn-dark btn-sm custom-btn"
                    style={{ padding: "0.3rem 0.5rem", fontSize: "0.9rem", borderRadius: "5px" }}
                  >
                    Remove
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
        </table>
      </div>
      {!readOnly && (
        <button
          type="button"
          onClick={onAdd}
          className="btn btn-dark custom-btn"
          style={{ fontSize: "0.9rem", borderRadius: "5px" }}
        >
          Add Vehicle
        </button>
      )}
    </div>
  );

const Modal = ({ title, onClose, children }) => (
  <div className="modal fade show d-flex align-items-center justify-content-center" style={{ display: "block", backgroundColor: "rgba(0, 0, 0, 0.5)", zIndex: 1000 }}>
    <div className="modal-dialog modal-dialog-scrollable" style={{ maxWidth: "600px" }}>
      <div className="modal-content rounded-3 shadow-lg" style={{ borderRadius: "10px" }}>
        <div className="modal-body p-5 position-relative">
          <button
            onClick={onClose}
            className="btn position-absolute top-0 end-0 mt-3 me-3"
            style={{ fontSize: "24px", color: "#666" }}
          >
            ×
          </button>
          <h2 className="fs-4 text-dark mb-4">{title}</h2>
          {children}
        </div>
      </div>
    </div>
  </div>
);

const JobCards = () => {
  const navigate = useNavigate();
  const [jobCards, setJobCards] = useState([]);
  const [salesOrders, setSalesOrders] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [form, setForm] = useState({ mode: null, data: {}, id: null });
  const [errors, setErrors] = useState({});
  const [filters, setFilters] = useState({
    fromDate: "",
    toDate: "",
    salesOrderNumber: "",
    companyName: "",
    jobCardNo: "",
    contactNumber: "",
  });

  const initialForm = {
    company_name: "",
    contact_email: "",
    sales_order_number: "",
    quantity: 1,
    remarks: "",
    vehicles: [{ chassis_number: "", specification: "", remarks: "", vehicle_make: "", vehicle_type: "" }],
  };

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
    fetchData("http://localhost:8000/sales/job-cards/", setJobCards, "Failed to fetch job cards.");
    fetchData("http://localhost:8000/sales/sales-orders/", setSalesOrders, "Failed to fetch sales orders.");
    fetchData("http://localhost:8000/sales/quotation-companies/", setCompanies, "Failed to fetch companies.");
  }, []);

  const filteredJobCards = jobCards.filter((jc) => {
    const createdOn = new Date(jc.created_on);
    const fromDate = filters.fromDate ? new Date(filters.fromDate) : null;
    const toDate = filters.toDate ? new Date(filters.toDate) : null;
    return (
      (!fromDate || createdOn >= fromDate) &&
      (!toDate || createdOn <= toDate) &&
      (!filters.salesOrderNumber || jc.sales_order_number?.toLowerCase().includes(filters.salesOrderNumber.toLowerCase())) &&
      (!filters.companyName || jc.company_name?.toLowerCase().includes(filters.companyName.toLowerCase())) &&
      (!filters.jobCardNo || jc.job_card_no?.toString().includes(filters.jobCardNo)) &&
      (!filters.contactNumber || jc.contact_number?.includes(filters.contactNumber))
    );
  });

  const handleChange = (e, vehicleIndex = null) => {
    const { name, value } = e.target;
    setErrors((prev) => ({ ...prev, [name]: "", vehicles: null }));
    setForm(({ data, ...rest }) => {
      if (vehicleIndex !== null) {
        const vehicles = [...data.vehicles];
        vehicles[vehicleIndex] = { ...vehicles[vehicleIndex], [name]: value };
        return { ...rest, data: { ...data, vehicles } };
      }
      if (name === "company_name") {
        const company = companies.find((c) => c.company_name === value);
        return { ...rest, data: { ...data, company_name: value, contact_email: company?.contact_email || "" } };
      }
      return { ...rest, data: { ...data, [name]: value } };
    });
  };

  const addVehicle = () =>
    setForm(({ data, ...rest }) => ({
      ...rest,
      data: {
        ...data,
        vehicles: [...data.vehicles, { chassis_number: "", specification: "", remarks: "", vehicle_make: "", vehicle_type: "" }],
      },
    }));

  const removeVehicle = (index) =>
    setForm(({ data, ...rest }) =>
      data.vehicles.length > 1
        ? { ...rest, data: { ...data, vehicles: data.vehicles.filter((_, i) => i !== index) } }
        : { ...rest, errors: { ...errors, vehicles: "At least one vehicle is required." } }
    );

  const validateForm = (data) => {
    const errors = {};
    ["company_name", "contact_email", "sales_order_number", "quantity"].forEach((f) => {
      if (!data[f]?.toString().trim()) errors[f] = `${f.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())} is required.`;
    });
    if (data.quantity <= 0) errors.quantity = "Quantity must be greater than 0.";
    if (!data.vehicles?.length) errors.vehicles = "At least one vehicle is required.";
    else
      data.vehicles.forEach((v, i) => {
        if (!v.chassis_number?.trim()) errors[`chassis_number_${i}`] = `Chassis number for vehicle ${i + 1} is required.`;
      });
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validateForm(form.data);
    if (Object.keys(newErrors).length) return setErrors(newErrors);

    const payload = {
      ...form.data,
      quantity: parseInt(form.data.quantity),
      vehicles: form.data.vehicles.map((v) => ({
        chassis_number: v.chassis_number,
        specification: v.specification || "",
        remarks: v.remarks || "",
        vehicle_make: v.vehicle_make || "",
        vehicle_type: v.vehicle_type || "",
      })),
    };

    try {
      if (form.mode === "edit") {
        await axios.patch(`http://localhost:8000/sales/job-cards/${form.id}/`, payload, {
          headers: { Authorization: `Bearer ${getAuthToken()}` },
        });
      } else {
        await axios.post("http://localhost:8000/sales/job-cards/", payload, {
          headers: { Authorization: `Bearer ${getAuthToken()}` },
        });
      }
      setForm({ mode: null, data: {}, id: null });
      fetchData("http://localhost:8000/sales/job-cards/", setJobCards, "Failed to fetch job cards.");
    } catch (err) {
      console.error(form.mode === "edit" ? "Failed to update job card" : "Failed to save job card", err);
      setErrors(err.response?.data || { general: "An unexpected error occurred." });
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await axios.patch(
        `http://localhost:8000/sales/job-cards/${id}/`,
        { status },
        { headers: { Authorization: `Bearer ${getAuthToken()}` } }
      );
      setJobCards(jobCards.map((jc) => (jc.id === id ? { ...jc, status } : jc)));
    } catch (err) {
      console.error("Failed to update status", err);
      setErrors({ general: "Failed to update status." });
    }
  };

  const openModal = (mode, data = initialForm, id = null) =>
    setForm({ mode, data: mode === "edit" || mode === "view" ? { ...data, vehicles: data.vehicles?.length ? data.vehicles : [{}] } : data, id });

  const closeModal = () => setForm({ mode: null, data: {}, id: null }, setErrors({}));

  const formatDate = (date) => new Date(date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });

  const formFields = [
    { label: "Company Name", name: "company_name", isSelect: true, options: companies.map((c) => c.company_name), required: true },
    { label: "Contact Email", name: "contact_email", type: "email", required: true },
    { label: "Sales Order Number", name: "sales_order_number", isSelect: true, options: salesOrders.map((o) => o.order_no), required: true },
    { label: "Quantity", name: "quantity", type: "number", min: 1, required: true },
    { label: "Remarks", name: "remarks", type: "textarea" },
  ];

  return (
    <div className="container-fluid p-5">
      <style>
        {`
          .custom-btn:hover {
            background-color: #333 !important;
          }
          .custom-btn {
            border-radius: 5px;
            font-size: 0.9rem;
          }
          .custom-table th, .custom-table td {
            border: 1px solid #000;
            padding: 0.5rem;
          }
          .custom-table th {
            background-color: #000;
            color: #fff;
          }
          .custom-table td {
            text-align: center;
          }
          .custom-input {
            border-radius: 5px;
            font-size: 0.9rem;
          }
        `}
      </style>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="fs-4 text-dark">Job Cards</h2>
        <div className="d-flex gap-3">
          {["View Sales Order", "Create New Job Card"].map((text, i) => (
            <button
              key={text}
              onClick={() => (i ? openModal("create", initialForm) : navigate("/salesorder"))}
              className="btn btn-dark custom-btn"
              style={{ borderRadius: "5px" }}
            >
              {text}
            </button>
          ))}
        </div>
      </div>
      {errors.general && <div className="text-danger" style={{ fontSize: "0.8rem" }}>{errors.general}</div>}
      <div className="d-flex flex-wrap gap-3 mb-3">
        {[
          { label: "Search by Sales Order Number", name: "salesOrderNumber" },
          { label: "Search by Company", name: "companyName" },
          { label: "Search by Job Card No", name: "jobCardNo" },
          { label: "Search by Contact Number", name: "contactNumber" },
          { label: "From", name: "fromDate", type: "date", width: "150px" },
          { label: "To", name: "toDate", type: "date", width: "150px" },
        ].map(({ label, name, type, width }) => (
          <FormField
            key={name}
            label={label}
            name={name}
            type={type}
            value={filters[name]}
            onChange={(e) => setFilters((prev) => ({ ...prev, [e.target.name]: e.target.value }))}
            width={width}
          />
        ))}
      </div>
      <div className="table-responsive">
        <table className="table custom-table">
          <thead>
            <tr>
              {["S.No", "Job Card NO", "Sales Order NO", "Company Name", "Contact Name", "Contact Number", "Status", "REMARKS", "CREATED BY", "Create Date", "Options"].map(
                (h) => (
                  <th key={h}>{h}</th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {filteredJobCards.length ? (
              filteredJobCards.map((jc, i) => (
                <tr key={jc.job_card_no}>
                  <td>{i + 1}</td>
                  <td>{jc.job_card_no || "-"}</td>
                  <td>{jc.sales_order_number || "-"}</td>
                  <td>{jc.company_name || "-"}</td>
                  <td>{jc.contact_name || "-"}</td>
                  <td>{jc.contact_number || "-"}</td>
                  <td>
                    <select
                      value={jc.status}
                      onChange={(e) => handleStatusChange(jc.id, e.target.value)}
                      className="form-select custom-input"
                    >
                      <option value="in_progress">In Progress</option>
                      <option value="delivered">Delivered</option>
                    </select>
                  </td>
                  <td>{jc.remarks || "-"}</td>
                  <td>{jc.created_by_username || "-"}</td>
                  <td>{formatDate(jc.created_on) || "-"}</td>
                  <td>
                    {["View", "Edit"].map((action) => (
                      <button
                        key={action}
                        onClick={() => openModal(action.toLowerCase(), jc, jc.id)}
                        className="btn btn-dark btn-sm custom-btn me-2"
                        style={{ padding: "0.3rem 0.5rem" }}
                      >
                        {action}
                      </button>
                    ))}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="11">No job cards available</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {form.mode && (
        <Modal title={form.mode === "create" ? "Create New Job Card" : form.mode === "edit" ? "Edit Job Card" : "View Job Card"} onClose={closeModal}>
          {errors.general && <div className="text-danger" style={{ fontSize: "0.8rem" }}>{errors.general}</div>}
          {form.mode !== "view" ? (
            <form onSubmit={handleSubmit}>
              <div className="row">
                {formFields.slice(0, 2).map(({ label, name, ...props }) => (
                  <div key={name} className="col-12 col-md-6">
                    <FormField
                      label={label}
                      name={name}
                      value={form.data[name]}
                      onChange={handleChange}
                      error={errors[name]}
                      {...props}
                    />
                  </div>
                ))}
              </div>
              <div className="row">
                {formFields.slice(2, 4).map(({ label, name, ...props }) => (
                  <div key={name} className="col-12 col-md-6">
                    <FormField
                      label={label}
                      name={name}
                      value={form.data[name]}
                      onChange={handleChange}
                      error={errors[name]}
                      {...props}
                    />
                  </div>
                ))}
              </div>
              {formFields.slice(4).map(({ label, name, ...props }) => (
                <FormField
                  key={name}
                  label={label}
                  name={name}
                  value={form.data[name]}
                  onChange={handleChange}
                  error={errors[name]}
                  {...props}
                />
              ))}
              <VehicleTable
                vehicles={form.data.vehicles}
                errors={errors}
                onChange={(i, e) => handleChange(e, i)}
                onRemove={removeVehicle}
                onAdd={addVehicle}
              />
              <button
                type="submit"
                className="btn btn-dark custom-btn w-100 mt-3 text-uppercase"
                style={{ borderRadius: "5px" }}
              >
                {form.mode === "edit" ? "Update" : "Submit"} Job Card
              </button>
            </form>
          ) : (
            <>
              <div className="row">
                {[
                  { label: "Job Card No", name: "job_card_no", value: form.data.job_card_no || "-", type: "text" },
                  ...formFields.slice(0, 2).map((f) => ({ ...f, value: form.data[f.name] })),
                ].map(({ label, name, type, value }) => (
                  <div key={name} className="col-12 col-md-6">
                    <FormField
                      label={label}
                      name={name}
                      type={type}
                      value={value}
                      readOnly
                    />
                  </div>
                ))}
              </div>
              <div className="row">
                {formFields.slice(2, 4).map((f) => ({ ...f, value: form.data[f.name] })).map(({ label, name, type, value }) => (
                  <div key={name} className="col-12 col-md-6">
                    <FormField
                      label={label}
                      name={name}
                      type={type}
                      value={value}
                      readOnly
                    />
                  </div>
                ))}
              </div>
              {formFields.slice(4).map((f) => ({ ...f, value: form.data[f.name] })).map(({ label, name, type, value }) => (
                <FormField
                  key={name}
                  label={label}
                  name={name}
                  type={type}
                  value={value}
                  readOnly
                />
              ))}
              <VehicleTable vehicles={form.data.vehicles} errors={{}} readOnly />
            </>
          )}
        </Modal>
      )}
    </div>
  );
};

export default JobCards;