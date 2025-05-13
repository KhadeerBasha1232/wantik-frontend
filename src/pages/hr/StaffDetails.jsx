import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";

const StaffDetails = () => {
  const navigate = useNavigate();
  const { type } = useParams(); // Get the type parameter from the URL
  const [staffList, setStaffList] = useState([]);
  const [filteredStaffList, setFilteredStaffList] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("add"); // "add", "edit", "view"
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    staff_type: type ? type.charAt(0).toUpperCase() + type.slice(1) : "", // Capitalize (Staff or Manpower)
    passport_no: "",
    visa_no: "",
    emirates_id_number: "",
    designation: "",
    nationality: "",
    insurance_number: "",
    email: "",
    passport_expiry: "",
    visa_expiry: "",
    salary: "",
    emergency_contact: "",
    insurance_expiry: "",
    contact_number: "",
    profile_photo: null,
    offer_letter: null,
    home_address: "",
    uae_address: "",
  });
  const [photoPreview, setPhotoPreview] = useState(null);
  const [offerLetterUrl, setOfferLetterUrl] = useState(null);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({
    searchStaffId: "",
    searchName: "",
    joiningYear: "",
  });
  const [availableYears, setAvailableYears] = useState([]);
  const token = localStorage.getItem("accessToken");

  // Validate type and redirect if invalid
  useEffect(() => {
    if (!["staff", "manpower"].includes(type)) {
      navigate("/hr/home");
    }
  }, [type, navigate]);

  // Fetch staff details on mount
  useEffect(() => {
    if (!token) {
      console.error("Access token not found.");
      setError("Authentication required. Please sign in.");
      return;
    }
    if (!type) return; // Wait for type validation

    axios
      .get(`http://127.0.0.1:8000/hr/${type}/staffdetails/`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setStaffList(res.data);
        setFilteredStaffList(res.data);
        // Extract unique years from joining_date
        const years = [
          ...new Set(
            res.data
              .map((staff) => new Date(staff.joining_date).getFullYear())
              .filter((year) => !isNaN(year))
          ),
        ].sort((a, b) => b - a);
        setAvailableYears(years);
      })
      .catch((err) => {
        console.error("Error fetching staff details:", err.response?.data);
        setError("Failed to load staff details.");
      });
  }, [token, type]);

  // Filter staff list based on filters
  useEffect(() => {
    setFilteredStaffList(
      staffList.filter((staff) => {
        const staffIdMatch =
          !filters.searchStaffId ||
          staff.staff_id
            .toString()
            .toLowerCase()
            .includes(filters.searchStaffId.toLowerCase());
        const nameMatch =
          !filters.searchName ||
          staff.name.toLowerCase().includes(filters.searchName.toLowerCase());
        const yearMatch =
          !filters.joiningYear ||
          new Date(staff.joining_date).getFullYear().toString() ===
            filters.joiningYear;
        return staffIdMatch && nameMatch && yearMatch;
      })
    );
  }, [filters, staffList]);

  // Handle filter input changes
  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, files } = e.target;
    if (files) {
      setFormData({ ...formData, [name]: files[0] });
      if (name === "profile_photo") {
        setPhotoPreview(URL.createObjectURL(files[0]));
      }
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  // Handle opening modal for Add
  const handleAddStaff = () => {
    setModalMode("add");
    setShowModal(true);
    setFormData({
      name: "",
      staff_type: type.charAt(0).toUpperCase() + type.slice(1), // Set staff_type
      passport_no: "",
      visa_no: "",
      emirates_id_number: "",
      designation: "",
      nationality: "",
      insurance_number: "",
      email: "",
      passport_expiry: "",
      visa_expiry: "",
      salary: "",
      emergency_contact: "",
      insurance_expiry: "",
      contact_number: "",
      profile_photo: null,
      offer_letter: null,
      home_address: "",
      uae_address: "",
    });
    setPhotoPreview(null);
    setOfferLetterUrl(null);
    setEditId(null);
  };

  // Handle opening modal for Edit/View
  const handleEditOrViewStaff = (staff, mode) => {
    setModalMode(mode);
    setShowModal(true);
    setEditId(staff.staff_id);
    setFormData({
      name: staff.name,
      staff_type: type.charAt(0).toUpperCase() + type.slice(1), // Set staff_type
      passport_no: staff.passport_no,
      visa_no: staff.visa_no,
      emirates_id_number: staff.emirates_id_number,
      designation: staff.designation,
      nationality: staff.nationality,
      insurance_number: staff.insurance_number,
      email: staff.email,
      passport_expiry: staff.passport_expiry,
      visa_expiry: staff.visa_expiry,
      salary: staff.salary,
      emergency_contact: staff.emergency_contact,
      insurance_expiry: staff.insurance_expiry,
      contact_number: staff.contact_number,
      profile_photo: null,
      offer_letter: null,
      home_address: staff.home_address,
      uae_address: staff.uae_address,
    });
    setPhotoPreview(staff.profile_photo ? staff.profile_photo : null);
    setOfferLetterUrl(staff.offer_letter || null);
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!token) {
      console.error("Access token not found.");
      setError("Authentication required. Please sign in.");
      return;
    }
    if (modalMode === "view") {
      setShowModal(false);
      return;
    }

    const data = new FormData();
    Object.keys(formData).forEach((key) => {
      if (formData[key] !== null && formData[key] !== "") {
        data.append(key, formData[key]);
      }
    });

    const request =
      modalMode === "add"
        ? axios.post(`http://127.0.0.1:8000/hr/${type}/staffdetails/`, data, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "multipart/form-data",
            },
          })
        : axios.put(`http://127.0.0.1:8000/hr/${type}/staffdetails/${editId}/`, data, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "multipart/form-data",
            },
          });

    request
      .then((res) => {
        if (modalMode === "add") {
          setStaffList([res.data, ...staffList]);
        } else {
          setStaffList(
            staffList.map((staff) =>
              staff.staff_id === editId ? res.data : staff
            )
          );
        }
        setShowModal(false);
        setFormData({
          name: "",
          staff_type: type.charAt(0).toUpperCase() + type.slice(1),
          passport_no: "",
          visa_no: "",
          emirates_id_number: "",
          designation: "",
          nationality: "",
          insurance_number: "",
          email: "",
          passport_expiry: "",
          visa_expiry: "",
          salary: "",
          emergency_contact: "",
          insurance_expiry: "",
          contact_number: "",
          profile_photo: null,
          offer_letter: null,
          home_address: "",
          uae_address: "",
        });
        setPhotoPreview(null);
        setOfferLetterUrl(null);
        setEditId(null);
      })
      .catch((err) => {
        console.error(
          `Error ${modalMode === "add" ? "adding" : "updating"} staff:`,
          err.response?.data
        );
        setError(
          `Failed to ${modalMode === "add" ? "add" : "update"} staff. Please check the form data.`
        );
      });
  };

  // Handle offer letter preview
  const handlePreviewOfferLetter = () => {
    if (offerLetterUrl) {
      window.open(offerLetterUrl, "_blank");
    }
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
  };
  const inputStyle = {
    padding: "0.5rem",
    border: "1px solid #ccc",
    borderRadius: "5px",
    fontSize: "0.9rem",
    boxSizing: "border-box",
    width: "100%",
  };
  const selectStyle = {
    padding: "0.5rem",
    border: "1px solid #ccc",
    borderRadius: "5px",
    fontSize: "0.9rem",
    boxSizing: "border-box",
    width: "100%",
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
    maxHeight: "90%",
    overflowY: "auto",
    maxWidth: "1000px",
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
  const rowStyle = {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "1rem",
    marginBottom: "1rem",
  };
  const spanTwoStyle = {
    gridColumn: "span 2",
  };
  const photoPreviewStyle = {
    maxWidth: "150px",
    maxHeight: "150px",
    borderRadius: "5px",
  };
  const placeholderStyle = {
    color: "#666",
    fontSize: "0.9rem",
    textAlign: "center",
    padding: "0.5rem",
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h2 style={{ marginBottom: "1rem", color: "#333", fontSize: "1.5rem" }}>
        {type === "staff" ? "STAFF" : "MANPOWER"} DETAILS
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
            {
              name: "searchStaffId",
              label: "Search by Staff ID",
              width: "200px",
            },
            { name: "searchName", label: "Search by Name", width: "200px" },
          ].map(({ name, label, width }) => (
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
              <input
                type="text"
                name={name}
                value={filters[name]}
                onChange={handleFilterChange}
                style={{ ...inputStyle, width }}
              />
            </div>
          ))}
          <div>
            <label
              style={{
                display: "block",
                color: "#333",
                fontSize: "0.9rem",
                marginBottom: "0.25rem",
              }}
            >
              Joining Year
            </label>
            <select
              name="joiningYear"
              value={filters.joiningYear}
              onChange={handleFilterChange}
              style={{ ...selectStyle, width: "150px" }}
            >
              <option value="">All Years</option>
              {availableYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <button
            onClick={handleAddStaff}
            style={buttonStyle}
            onMouseOver={(e) => (e.target.style.backgroundColor = "#333")}
            onMouseOut={(e) => (e.target.style.backgroundColor = "#000")}
            aria-label="Add staff"
          >
            Add Staff
          </button>
        </div>
      </div>
      {error && (
        <div style={{ color: "red", marginBottom: "1rem" }}>{error}</div>
      )}
      <table
        style={{ width: "100%", borderCollapse: "collapse", marginTop: "1rem" }}
      >
        <thead>
          <tr style={{ backgroundColor: "#000", color: "#fff" }}>
            {[
              "S.No",
              "Staff ID",
              "Staff Name",
              "Contact Number",
              "Email",
              "Passport No",
              "Visa No",
              "Visa Expiry",
              "Emirates ID",
              "Emergency Contact",
              "Joining Date",
              "UAE Address",
              "Nationality",
              "Home Address",
              "More Details",
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
          {filteredStaffList.length === 0 ? (
            <tr>
              <td
                colSpan="15"
                style={{
                  border: "1px solid #000",
                  padding: "0.5rem",
                  textAlign: "center",
                }}
              >
                No Staff Details Present
              </td>
            </tr>
          ) : (
            filteredStaffList.map((staff, index) => (
              <tr key={staff.staff_id} style={{ backgroundColor: "#fff" }}>
                <td style={{ border: "1px solid #000", padding: "0.5rem" }}>
                  {index + 1}
                </td>
                <td style={{ border: "1px solid #000", padding: "0.5rem" }}>
                  {staff.staff_id}
                </td>
                <td style={{ border: "1px solid #000", padding: "0.5rem" }}>
                  {staff.name}
                </td>
                <td style={{ border: "1px solid #000", padding: "0.5rem" }}>
                  {staff.contact_number}
                </td>
                <td style={{ border: "1px solid #000", padding: "0.5rem" }}>
                  {staff.email}
                </td>
                <td style={{ border: "1px solid #000", padding: "0.5rem" }}>
                  {staff.passport_no}
                </td>
                <td style={{ border: "1px solid #000", padding: "0.5rem" }}>
                  {staff.visa_no}
                </td>
                <td style={{ border: "1px solid #000", padding: "0.5rem" }}>
                  {staff.visa_expiry}
                </td>
                <td style={{ border: "1px solid #000", padding: "0.5rem" }}>
                  {staff.emirates_id_number}
                </td>
                <td style={{ border: "1px solid #000", padding: "0.5rem" }}>
                  {staff.emergency_contact}
                </td>
                <td style={{ border: "1px solid #000", padding: "0.5rem" }}>
                  {staff.joining_date}
                </td>
                <td style={{ border: "1px solid #000", padding: "0.5rem" }}>
                  {staff.uae_address}
                </td>
                <td style={{ border: "1px solid #000", padding: "0.5rem" }}>
                  {staff.nationality}
                </td>
                <td style={{ border: "1px solid #000", padding: "0.5rem" }}>
                  {staff.home_address}
                </td>
                <td style={{ border: "1px solid #000", padding: "0.5rem", minWidth: "120px" }}>
                  <button
                    onClick={() => handleEditOrViewStaff(staff, "view")}
                    style={{ ...smallButtonStyle, marginRight: "0.5rem" }}
                    onMouseOver={(e) =>
                      (e.target.style.backgroundColor = "#333")
                    }
                    onMouseOut={(e) =>
                      (e.target.style.backgroundColor = "#000")
                    }
                    aria-label="View staff"
                  >
                    View
                  </button>
                  <button
                    onClick={() => handleEditOrViewStaff(staff, "edit")}
                    style={smallButtonStyle}
                    onMouseOver={(e) =>
                      (e.target.style.backgroundColor = "#333")
                    }
                    onMouseOut={(e) =>
                      (e.target.style.backgroundColor = "#000")
                    }
                    aria-label="Edit staff"
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {showModal && (
        <div style={modalStyle}>
          <div style={modalContentStyle}>
            <span
              onClick={() => setShowModal(false)}
              style={closeBtnStyle}
              aria-label="Close modal"
            >
              ×
            </span>
            <form onSubmit={handleSubmit} style={{ padding: "1rem 0" }}>
              <h2
                style={{
                  marginBottom: "1rem",
                  fontSize: "1.5rem",
                  color: "#333",
                }}
              >
                {modalMode === "add"
                  ? "Add Staff"
                  : modalMode === "edit"
                  ? "Edit Staff"
                  : "View Staff"}
              </h2>
              {/* Row 1: Name, Email */}
              <div style={rowStyle}>
                <div>
                  <label
                    style={{
                      display: "block",
                      color: "#333",
                      fontSize: "0.9rem",
                      marginBottom: "0.25rem",
                    }}
                  >
                    Name*:
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    style={inputStyle}
                    disabled={modalMode === "view"}
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      color: "#333",
                      fontSize: "0.9rem",
                      marginBottom: "0.25rem",
                    }}
                  >
                    Email*:
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    style={inputStyle}
                    disabled={modalMode === "view"}
                  />
                </div>
              </div>
              {/* Row 2: Contact Number, Passport No, Passport Expiry */}
              <div style={rowStyle}>
                <div>
                  <label
                    style={{
                      display: "block",
                      color: "#333",
                      fontSize: "0.9rem",
                      marginBottom: "0.25rem",
                    }}
                  >
                    Contact Number:
                  </label>
                  <input
                    type="text"
                    name="contact_number"
                    value={formData.contact_number}
                    onChange={handleInputChange}
                    required
                    style={inputStyle}
                    disabled={modalMode === "view"}
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      color: "#333",
                      fontSize: "0.9rem",
                      marginBottom: "0.25rem",
                    }}
                  >
                    Passport No:
                  </label>
                  <input
                    type="text"
                    name="passport_no"
                    value={formData.passport_no}
                    onChange={handleInputChange}
                    required
                    style={inputStyle}
                    disabled={modalMode === "view"}
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      color: "#333",
                      fontSize: "0.9rem",
                      marginBottom: "0.25rem",
                    }}
                  >
                    Passport Expiry:
                  </label>
                  <input
                    type="date"
                    name="passport_expiry"
                    value={formData.passport_expiry}
                    onChange={handleInputChange}
                    required
                    style={inputStyle}
                    disabled={modalMode === "view"}
                  />
                </div>
              </div>
              {/* Row 3: Profile Photo, Visa No, Visa Expiry */}
              <div style={rowStyle}>
                <div>
                  <label
                    style={{
                      display: "block",
                      color: "#333",
                      fontSize: "0.9rem",
                      marginBottom: "0.25rem",
                    }}
                  >
                    Profile Photo:
                  </label>
                  <input
                    type="file"
                    name="profile_photo"
                    onChange={handleInputChange}
                    accept="image/*"
                    style={inputStyle}
                    disabled={modalMode === "view"}
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      color: "#333",
                      fontSize: "0.9rem",
                      marginBottom: "0.25rem",
                    }}
                  >
                    Visa No:
                  </label>
                  <input
                    type="text"
                    name="visa_no"
                    value={formData.visa_no}
                    onChange={handleInputChange}
                    required
                    style={inputStyle}
                    disabled={modalMode === "view"}
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      color: "#333",
                      fontSize: "0.9rem",
                      marginBottom: "0.25rem",
                    }}
                  >
                    Visa Expiry:
                  </label>
                  <input
                    type="date"
                    name="visa_expiry"
                    value={formData.visa_expiry}
                    onChange={handleInputChange}
                    required
                    style={inputStyle}
                    disabled={modalMode === "view"}
                  />
                </div>
              </div>
              {/* Row 4: Profile Picture Preview, Emirates ID Number (span 2) */}
              <div style={rowStyle}>
                <div style={{ gridRow: "span 2" }}>
                  {photoPreview ? (
                    <img
                      src={photoPreview}
                      alt="Profile Preview"
                      style={{
                        ...photoPreviewStyle,
                        width: "100%",
                        height: "100%",
                        objectFit: "contain",
                      }}
                    />
                  ) : (
                    <div style={{ ...placeholderStyle, height: "100%" }}>
                      Profile Picture Preview
                    </div>
                  )}
                </div>
                <div style={spanTwoStyle}>
                  <label
                    style={{
                      display: "block",
                      color: "#333",
                      fontSize: "0.9rem",
                      marginBottom: "0.25rem",
                    }}
                  >
                    Emirates ID Number:
                  </label>
                  <input
                    type="text"
                    name="emirates_id_number"
                    value={formData.emirates_id_number}
                    onChange={handleInputChange}
                    required
                    style={inputStyle}
                    disabled={modalMode === "view"}
                  />
                </div>
              </div>
              {/* Row 5: Designation, Salary, Offer Letter */}
              <div style={rowStyle}>
                <div>
                  <label
                    style={{
                      display: "block",
                      color: "#333",
                      fontSize: "0.9rem",
                      marginBottom: "0.25rem",
                    }}
                  >
                    Designation:
                  </label>
                  <input
                    type="text"
                    name="designation"
                    value={formData.designation}
                    onChange={handleInputChange}
                    required
                    style={inputStyle}
                    disabled={modalMode === "view"}
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      color: "#333",
                      fontSize: "0.9rem",
                      marginBottom: "0.25rem",
                    }}
                  >
                    Salary:
                  </label>
                  <input
                    type="number"
                    name="salary"
                    value={formData.salary}
                    onChange={handleInputChange}
                    required
                    step="0.01"
                    style={inputStyle}
                    disabled={modalMode === "view"}
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      color: "#333",
                      fontSize: "0.9rem",
                      marginBottom: "0.25rem",
                    }}
                  >
                    Offer Letter (PDF):
                  </label>
                  <input
                    type="file"
                    name="offer_letter"
                    onChange={handleInputChange}
                    accept=".pdf"
                    style={inputStyle}
                    disabled={modalMode === "view"}
                  />
                  {modalMode === "view" && offerLetterUrl && (
                    <button
                      type="button"
                      onClick={handlePreviewOfferLetter}
                      style={{
                        ...smallButtonStyle,
                        marginTop: "0.5rem",
                        width: "100%",
                      }}
                      onMouseOver={(e) =>
                        (e.target.style.backgroundColor = "#333")
                      }
                      onMouseOut={(e) =>
                        (e.target.style.backgroundColor = "#000")
                      }
                      aria-label="Preview offer letter"
                    >
                      Preview Offer Letter
                    </button>
                  )}
                </div>
              </div>
              {/* Row 6: Nationality, Emergency Contact, Home Address */}
              <div style={rowStyle}>
                <div>
                  <label
                    style={{
                      display: "block",
                      color: "#333",
                      fontSize: "0.9rem",
                      marginBottom: "0.25rem",
                    }}
                  >
                    Nationality:
                  </label>
                  <input
                    type="text"
                    name="nationality"
                    value={formData.nationality}
                    onChange={handleInputChange}
                    required
                    style={inputStyle}
                    disabled={modalMode === "view"}
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      color: "#333",
                      fontSize: "0.9rem",
                      marginBottom: "0.25rem",
                    }}
                  >
                    Emergency Contact:
                  </label>
                  <input
                    type="text"
                    name="emergency_contact"
                    value={formData.emergency_contact}
                    onChange={handleInputChange}
                    required
                    style={inputStyle}
                    disabled={modalMode === "view"}
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      color: "#333",
                      fontSize: "0.9rem",
                      marginBottom: "0.25rem",
                    }}
                  >
                    Home Address:
                  </label>
                  <textarea
                    name="home_address"
                    value={formData.home_address}
                    onChange={handleInputChange}
                    required
                    style={{ ...inputStyle, minHeight: "100px" }}
                    disabled={modalMode === "view"}
                  />
                </div>
              </div>
              {/* Row 7: Insurance Number, Insurance Expiry, UAE Address */}
              <div style={rowStyle}>
                <div>
                  <label
                    style={{
                      display: "block",
                      color: "#333",
                      fontSize: "0.9rem",
                      marginBottom: "0.25rem",
                    }}
                  >
                    Insurance Number:
                  </label>
                  <input
                    type="text"
                    name="insurance_number"
                    value={formData.insurance_number}
                    onChange={handleInputChange}
                    required
                    style={inputStyle}
                    disabled={modalMode === "view"}
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      color: "#333",
                      fontSize: "0.9rem",
                      marginBottom: "0.25rem",
                    }}
                  >
                    Insurance Expiry:
                  </label>
                  <input
                    type="date"
                    name="insurance_expiry"
                    value={formData.insurance_expiry}
                    onChange={handleInputChange}
                    required
                    style={inputStyle}
                    disabled={modalMode === "view"}
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      color: "#333",
                      fontSize: "0.9rem",
                      marginBottom: "0.25rem",
                    }}
                  >
                    UAE Address:
                  </label>
                  <textarea
                    name="uae_address"
                    value={formData.uae_address}
                    onChange={handleInputChange}
                    required
                    style={{ ...inputStyle, minHeight: "100px" }}
                    disabled={modalMode === "view"}
                  />
                </div>
              </div>
              {modalMode !== "view" && (
                <button
                  type="submit"
                  style={{ ...buttonStyle, width: "100%" }}
                  onMouseOver={(e) => (e.target.style.backgroundColor = "#333")}
                  onMouseOut={(e) => (e.target.style.backgroundColor = "#000")}
                  aria-label={modalMode === "add" ? "Submit staff" : "Update staff"}
                >
                  {modalMode === "add" ? "Submit Staff" : "Update Staff"}
                </button>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffDetails;