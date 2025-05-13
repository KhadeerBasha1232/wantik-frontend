import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";

const VisaStatus = ({ staff_id }) => {
  const navigate = useNavigate();
  const { type } = useParams(); // Get the type parameter from the URL
  const [visaList, setVisaList] = useState([]);
  const [staffDetails, setStaffDetails] = useState(null); // Single staff when staff_id is provided
  const [filteredVisaList, setFilteredVisaList] = useState([]);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({
    searchStaffId: "",
    searchName: "",
    joiningYear: "",
  });
  const [availableYears, setAvailableYears] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const token = localStorage.getItem("accessToken");

  // Validate type and redirect if invalid
  useEffect(() => {
    if (!["staff", "manpower"].includes(type)) {
      navigate("/hr/home");
    }
  }, [type, navigate]);

  // Fetch visa details on mount
  useEffect(() => {
    if (!token) {
      console.error("Access token not found.");
      setError("Please log in to view visa details.");
      return;
    }
    if (!type) return; // Wait for type validation

    if (staff_id) {
      // Fetch specific staff visa details
      axios
        .get(`http://127.0.0.1:8000/hr/${type}/visa-details/${staff_id}/`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => {
          setStaffDetails(res.data);
        })
        .catch((err) => {
          console.error("Error fetching staff visa details:", err.response?.data);
          setError("Failed to load visa details for the specified staff.");
        });
    } else {
      // Fetch all visa details
      axios
        .get(`http://127.0.0.1:8000/hr/${type}/visa-details/`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => {
          setVisaList(res.data);
          setFilteredVisaList(res.data);
          // Extract unique years from joining_date
          const years = [
            ...new Set(
              res.data
                .map((staff) => new Date(staff.joining_date).getFullYear())
                .filter((year) => !isNaN(year))
            ),
          ].sort((a, b) => b - a); // Sort descending
          setAvailableYears(years);
        })
        .catch((err) => {
          console.error("Error fetching visa details:", err.response?.data);
          setError("Failed to load visa details.");
        });
    }
  }, [token, staff_id, type]);

  // Filter and sort visa list based on filters and visa_expiry (only when no staff_id)
  useEffect(() => {
    if (staff_id) return; // Skip filtering if staff_id is provided

    const filtered = visaList.filter((staff) => {
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
    });

    // Sort filtered list: expiring soon (within 1 month) at the top
    const sorted = filtered.sort((a, b) => {
      const aExpiringSoon = isVisaExpiringSoon(a.visa_expiry);
      const bExpiringSoon = isVisaExpiringSoon(b.visa_expiry);
      if (aExpiringSoon && !bExpiringSoon) return -1;
      if (!aExpiringSoon && bExpiringSoon) return 1;
      return 0; // Maintain original order for non-expiring visas
    });

    setFilteredVisaList(sorted);
  }, [filters, visaList, staff_id]);

  // Handle filter input changes
  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  // Handle view staff
  const handleViewStaff = (staff) => {
    setSelectedStaff(staff);
    setShowModal(true);
  };

  // Check if visa_expiry is within one month
  const isVisaExpiringSoon = (visaExpiry) => {
    const today = new Date("2025-05-10"); // Current date as per context
    const expiryDate = new Date(visaExpiry);
    const oneMonthFromNow = new Date(today);
    oneMonthFromNow.setMonth(today.getMonth() + 1);
    return expiryDate <= oneMonthFromNow && expiryDate >= today;
  };

  // Styles
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
    ...inputStyle,
    cursor: "pointer",
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
    maxHeight: "80vh",
    overflowY: "auto",
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
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "1rem",
    marginBottom: "1rem",
  };
  const labelStyle = {
    display: "block",
    color: "#333",
    fontSize: "0.9rem",
    marginBottom: "0.25rem",
  };
  const errorStyle = {
    color: "red",
    fontSize: "0.85rem",
    marginBottom: "1rem",
  };

  return (
    <div style={{ padding: "2rem" }}>
      {staff_id ? (
        // UI for specific staff_id
        <>
          <h2
            style={{ marginBottom: "1rem", color: "#333", fontSize: "1.5rem" }}
          >
            Visa Status for {type === "staff" ? "Staff" : "Manpower"} ID: {staff_id}
          </h2>
          {error && <div style={errorStyle}>{error}</div>}
          {staffDetails ? (
            <div style={{ padding: "1rem 0" }}>
              <div style={rowStyle}>
                <div>
                  <label style={labelStyle}>Staff ID:</label>
                  <input
                    type="text"
                    value={staffDetails.staff_id}
                    style={inputStyle}
                    disabled
                  />
                </div>
                <div>
                  <label style={labelStyle}>Staff Name:</label>
                  <input
                    type="text"
                    value={staffDetails.name}
                    style={inputStyle}
                    disabled
                  />
                </div>
              </div>
              <div style={rowStyle}>
                <div>
                  <label style={labelStyle}>Contact Number:</label>
                  <input
                    type="text"
                    value={staffDetails.contact_number}
                    style={inputStyle}
                    disabled
                  />
                </div>
                <div>
                  <label style={labelStyle}>Email:</label>
                  <input
                    type="email"
                    value={staffDetails.email}
                    style={inputStyle}
                    disabled
                  />
                </div>
              </div>
              <div style={rowStyle}>
                <div>
                  <label style={labelStyle}>Passport No:</label>
                  <input
                    type="text"
                    value={staffDetails.passport_no}
                    style={inputStyle}
                    disabled
                  />
                </div>
                <div>
                  <label style={labelStyle}>Visa No:</label>
                  <input
                    type="text"
                    value={staffDetails.visa_no}
                    style={inputStyle}
                    disabled
                  />
                </div>
              </div>
              <div style={rowStyle}>
                <div>
                  <label style={labelStyle}>Visa Expiry:</label>
                  <input
                    type="text"
                    value={staffDetails.visa_expiry}
                    style={{
                      ...inputStyle,
                      color: isVisaExpiringSoon(staffDetails.visa_expiry)
                        ? "red"
                        : "inherit",
                    }}
                    disabled
                  />
                </div>
                <div>
                  <label style={labelStyle}>Emirates ID:</label>
                  <input
                    type="text"
                    value={staffDetails.emirates_id_number}
                    style={inputStyle}
                    disabled
                  />
                </div>
              </div>
              <div style={rowStyle}>
                <div>
                  <label style={labelStyle}>Emergency Contact:</label>
                  <input
                    type="text"
                    value={staffDetails.emergency_contact}
                    style={inputStyle}
                    disabled
                  />
                </div>
                <div>
                  <label style={labelStyle}>Joining Date:</label>
                  <input
                    type="text"
                    value={staffDetails.joining_date}
                    style={inputStyle}
                    disabled
                  />
                </div>
              </div>
              <div style={rowStyle}>
                <div>
                  <label style={labelStyle}>UAE Address:</label>
                  <textarea
                    value={staffDetails.uae_address}
                    style={{ ...inputStyle, minHeight: "100px" }}
                    disabled
                  />
                </div>
                <div>
                  <label style={labelStyle}>Nationality:</label>
                  <input
                    type="text"
                    value={staffDetails.nationality}
                    style={inputStyle}
                    disabled
                  />
                </div>
              </div>
              <div style={rowStyle}>
                <div>
                  <label style={labelStyle}>Visa Status:</label>
                  <input
                    type="text"
                    value={staffDetails.visa_status}
                    style={inputStyle}
                    disabled
                  />
                </div>
              </div>
            </div>
          ) : (
            <p style={{ fontSize: "0.9rem", color: "#333" }}>
              Loading staff details...
            </p>
          )}
        </>
      ) : (
        // Original UI for all staff
        <>
          <h2
            style={{ marginBottom: "1rem", color: "#333", fontSize: "1.5rem" }}
          >
            {type === "staff" ? "STAFF" : "MANPOWER"} VISA STATUS
          </h2>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "1rem",
              alignItems: "center",
              marginBottom: "1rem",
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
                <label style={labelStyle}>{label}</label>
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
              <label style={labelStyle}>Joining Year</label>
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
          {error && <div style={errorStyle}>{error}</div>}
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              marginTop: "1rem",
            }}
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
                  "Visa Status",
                  "Options",
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
              {filteredVisaList.length === 0 ? (
                <tr>
                  <td
                    colSpan="15"
                    style={{
                      border: "1px solid #000",
                      padding: "0.5rem",
                      textAlign: "center",
                    }}
                  >
                    No Visa Details Present
                  </td>
                </tr>
              ) : (
                filteredVisaList.map((staff, index) => (
                  <tr key={staff.staff_id} style={{ backgroundColor: "#fff" }}>
                    <td
                      style={{ border: "1px solid #000", padding: "0.5rem" }}
                    >
                      {index + 1}
                    </td>
                    <td
                      style={{ border: "1px solid #000", padding: "0.5rem" }}
                    >
                      {staff.staff_id}
                    </td>
                    <td
                      style={{ border: "1px solid #000", padding: "0.5rem" }}
                    >
                      {staff.name}
                    </td>
                    <td
                      style={{ border: "1px solid #000", padding: "0.5rem" }}
                    >
                      {staff.contact_number}
                    </td>
                    <td
                      style={{ border: "1px solid #000", padding: "0.5rem" }}
                    >
                      {staff.email}
                    </td>
                    <td
                      style={{ border: "1px solid #000", padding: "0.5rem" }}
                    >
                      {staff.passport_no}
                    </td>
                    <td
                      style={{ border: "1px solid #000", padding: "0.5rem" }}
                    >
                      {staff.visa_no}
                    </td>
                    <td
                      style={{
                        border: "1px solid #000",
                        padding: "0.5rem",
                        color: isVisaExpiringSoon(staff.visa_expiry)
                          ? "red"
                          : "inherit",
                      }}
                    >
                      {staff.visa_expiry}
                    </td>
                    <td
                      style={{ border: "1px solid #000", padding: "0.5rem" }}
                    >
                      {staff.emirates_id_number}
                    </td>
                    <td
                      style={{ border: "1px solid #000", padding: "0.5rem" }}
                    >
                      {staff.emergency_contact}
                    </td>
                    <td
                      style={{ border: "1px solid #000", padding: "0.5rem" }}
                    >
                      {staff.joining_date}
                    </td>
                    <td
                      style={{ border: "1px solid #000", padding: "0.5rem" }}
                    >
                      {staff.uae_address}
                    </td>
                    <td
                      style={{ border: "1px solid #000", padding: "0.5rem" }}
                    >
                      {staff.nationality}
                    </td>
                    <td
                      style={{ border: "1px solid #000", padding: "0.5rem" }}
                    >
                      {staff.visa_status}
                    </td>
                    <td
                      style={{ border: "1px solid #000", padding: "0.5rem" }}
                    >
                      <button
                        onClick={() => handleViewStaff(staff)}
                        style={smallButtonStyle}
                        onMouseOver={(e) =>
                          (e.target.style.backgroundColor = "#333")
                        }
                        onMouseOut={(e) =>
                          (e.target.style.backgroundColor = "#000")
                        }
                        aria-label={`View details for ${staff.name}`}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </>
      )}

      {/* View Modal (only when no staff_id) */}
      {showModal && selectedStaff && !staff_id && (
        <div style={modalStyle}>
          <div style={modalContentStyle}>
            <span
              onClick={() => setShowModal(false)}
              style={closeBtnStyle}
              aria-label="Close modal"
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
              Visa Details
            </h2>
            <div style={{ padding: "1rem 0" }}>
              <div style={rowStyle}>
                <div>
                  <label style={labelStyle}>Staff ID:</label>
                  <input
                    type="text"
                    value={selectedStaff.staff_id}
                    style={inputStyle}
                    disabled
                  />
                </div>
                <div>
                  <label style={labelStyle}>Staff Name:</label>
                  <input
                    type="text"
                    value={selectedStaff.name}
                    style={inputStyle}
                    disabled
                  />
                </div>
              </div>
              <div style={rowStyle}>
                <div>
                  <label style={labelStyle}>Contact Number:</label>
                  <input
                    type="text"
                    value={selectedStaff.contact_number}
                    style={inputStyle}
                    disabled
                  />
                </div>
                <div>
                  <label style={labelStyle}>Email:</label>
                  <input
                    type="email"
                    value={selectedStaff.email}
                    style={inputStyle}
                    disabled
                  />
                </div>
              </div>
              <div style={rowStyle}>
                <div>
                  <label style={labelStyle}>Passport No:</label>
                  <input
                    type="text"
                    value={selectedStaff.passport_no}
                    style={inputStyle}
                    disabled
                  />
                </div>
                <div>
                  <label style={labelStyle}>Visa No:</label>
                  <input
                    type="text"
                    value={selectedStaff.visa_no}
                    style={inputStyle}
                    disabled
                  />
                </div>
              </div>
              <div style={rowStyle}>
                <div>
                  <label style={labelStyle}>Visa Expiry:</label>
                  <input
                    type="text"
                    value={selectedStaff.visa_expiry}
                    style={{
                      ...inputStyle,
                      color: isVisaExpiringSoon(selectedStaff.visa_expiry)
                        ? "red"
                        : "inherit",
                    }}
                    disabled
                  />
                </div>
                <div>
                  <label style={labelStyle}>Emirates ID:</label>
                  <input
                    type="text"
                    value={selectedStaff.emirates_id_number}
                    style={inputStyle}
                    disabled
                  />
                </div>
              </div>
              <div style={rowStyle}>
                <div>
                  <label style={labelStyle}>Emergency Contact:</label>
                  <input
                    type="text"
                    value={selectedStaff.emergency_contact}
                    style={inputStyle}
                    disabled
                  />
                </div>
                <div>
                  <label style={labelStyle}>Joining Date:</label>
                  <input
                    type="text"
                    value={selectedStaff.joining_date}
                    style={inputStyle}
                    disabled
                  />
                </div>
              </div>
              <div style={rowStyle}>
                <div>
                  <label style={labelStyle}>UAE Address:</label>
                  <textarea
                    value={selectedStaff.uae_address}
                    style={{ ...inputStyle, minHeight: "100px" }}
                    disabled
                  />
                </div>
                <div>
                  <label style={labelStyle}>Nationality:</label>
                  <input
                    type="text"
                    value={selectedStaff.nationality}
                    style={inputStyle}
                    disabled
                  />
                </div>
              </div>
              <div style={rowStyle}>
                <div>
                  <label style={labelStyle}>Visa Status:</label>
                  <input
                    type="text"
                    value={selectedStaff.visa_status}
                    style={inputStyle}
                    disabled
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VisaStatus;