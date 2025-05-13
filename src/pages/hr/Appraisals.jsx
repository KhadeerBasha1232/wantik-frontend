import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

const Appraisals = ({ staff_id, staff_type }) => {
  const navigate = useNavigate();
  const { type } = useParams(); // Get the type parameter from the URL
  const [staffDetails, setStaffDetails] = useState(null); // Single staff object when staff_id is provided
  const [staffList, setStaffList] = useState([]); // All staff when no staff_id
  const [appraisalRequests, setAppraisalRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [error, setError] = useState("");
  const [showNewModal, setShowNewModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [appraisalForm, setAppraisalForm] = useState({
    staff_id: staff_id || "",
    staff_name: "",
    appraisal_amount: "",
    reason: "",
  });
  const [editForm, setEditForm] = useState({
    appraisal_amount: "",
    reason: "",
    comments: [{ text: "" }],
  });
  const [filters, setFilters] = useState({
    staffName: "",
    year: "",
    requestDate: "",
    appraisalDate: "",
  });
  const token = localStorage.getItem("accessToken");

  const statusOptions = ["Approved", "Rejected", "Pending"];
  const extendedStatusOptions = ["Approved", "Under Review", "Rejected", "Pending"];

  const normalizeDate = (dateInput) => {
    if (!dateInput) return "";
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return "";
    return date.toISOString().split("T")[0];
  };

  // Validate type and redirect if invalid
  useEffect(() => {
    if (!["staff", "manpower"].includes(type)) {
      navigate("/hr/home");
    }
  }, [type, navigate]);

  useEffect(() => {
    if (!token) {
      setError("Please log in to view appraisal requests.");
      return;
    }
    if (!type) return; // Wait for type validation

    if (staff_id) {
      // Fetch specific staff details
      axios
        .get(`http://127.0.0.1:8000/hr/${type}/staffdetails/${staff_id}/`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => {
          console.log("Staff Details:", res.data);
          setStaffDetails(res.data);
          setAppraisalForm((prev) => ({
            ...prev,
            staff_id: res.data.staff_id,
            staff_name: res.data.name,
          }));
        })
        .catch((err) => {
          console.error("Error fetching staff details:", err.response?.data);
          setError("Failed to load staff details.");
        });

      // Fetch appraisal requests for specific staff
      axios
        .get(`http://127.0.0.1:8000/hr/${type}/appraisals/?staff_id=${staff_id}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => {
          console.log("Appraisal Requests:", res.data);
          const normalizedData = res.data.map((request) => ({
            ...request,
            request_date: normalizeDate(request.request_date),
          }));
          setAppraisalRequests(normalizedData);
          setFilteredRequests(normalizedData);
        })
        .catch((err) => {
          console.error("Error fetching appraisal requests:", err.response?.data);
          setError("Failed to load appraisal requests.");
        });
    } else {
      // Fetch all staff details
      axios
        .get(`http://127.0.0.1:8000/hr/${type}/staffdetails/`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => {
          console.log("Staff List:", res.data);
          setStaffList(res.data);
        })
        .catch((err) => {
          console.error("Error fetching staff details:", err.response?.data);
          setError("Failed to load staff details.");
        });

      // Fetch all appraisal requests
      axios
        .get(`http://127.0.0.1:8000/hr/${type}/appraisals/`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => {
          console.log("Appraisal Requests:", res.data);
          const normalizedData = res.data.map((request) => ({
            ...request,
            request_date: normalizeDate(request.request_date),
          }));
          setAppraisalRequests(normalizedData);
          setFilteredRequests(normalizedData);
        })
        .catch((err) => {
          console.error("Error fetching appraisal requests:", err.response?.data);
          setError("Failed to load appraisal requests.");
        });
    }
  }, [token, staff_id, type]);

  // Get unique years from request_date for the year filter (only when no staff_id)
  const uniqueYears = Array.from(
    new Set(
      appraisalRequests
        .map((request) =>
          request.request_date
            ? new Date(request.request_date).getFullYear().toString()
            : null
        )
        .filter((year) => year !== null)
    )
  ).sort();

  useEffect(() => {
    if (staff_id) {
      // No filtering needed when staff_id is provided
      setFilteredRequests(appraisalRequests);
    } else {
      // Apply filters when no staff_id
      setFilteredRequests(
        appraisalRequests.filter((request) => {
          const requestDate = new Date(request.request_date);
          const filterDate = filters.appraisalDate
            ? new Date(filters.appraisalDate)
            : null;

          return (
            (!filters.staffName ||
              request.staff_name
                .toLowerCase()
                .includes(filters.staffName.toLowerCase())) &&
            (!filters.year ||
              new Date(request.request_date).getFullYear().toString() ===
                filters.year) &&
            (!filters.requestDate ||
              request.request_date === filters.requestDate) &&
            (!filters.appraisalDate ||
              requestDate.toISOString().split("T")[0] === filters.appraisalDate)
          );
        })
      );
    }
  }, [filters, appraisalRequests, staff_id]);

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleNewFormChange = (e) => {
    const { name, value } = e.target;
    if (name === "staff_name" && !staff_id) {
      const selectedStaff = staffList.find((staff) => staff.name === value);
      setAppraisalForm((prev) => ({
        ...prev,
        staff_name: value,
        staff_id: selectedStaff ? selectedStaff.staff_id : "",
      }));
    } else {
      setAppraisalForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCommentChange = (index, value) => {
    const updatedComments = [...editForm.comments];
    updatedComments[index].text = value;
    setEditForm((prev) => ({ ...prev, comments: updatedComments }));
  };

  const addCommentInput = () => {
    setEditForm((prev) => ({
      ...prev,
      comments: [...prev.comments, { text: "" }],
    }));
  };

  const deleteComment = async (index) => {
    if (editForm.comments.length <= 1) {
      return; // Prevent deleting the last comment input
    }

    const comment = editForm.comments[index];
    if (comment.id) {
      try {
        await axios.delete(
          `http://127.0.0.1:8000/hr/${type}/appraisals/${selectedRequest.id}/comments/${comment.id}/`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        console.log(`Comment ${comment.id} deleted from backend`);
      } catch (err) {
        console.error("Error deleting comment:", err.response?.data);
        setError(
          err.response?.data?.detail || "Failed to delete comment from the server."
        );
        return;
      }
    }

    const updatedComments = editForm.comments.filter((_, i) => i !== index);
    setEditForm((prev) => ({ ...prev, comments: updatedComments }));
  };

  const handleStatusChange = async (requestId, field, value) => {
    if (!token) {
      setError("Please log in to update status.");
      return;
    }

    try {
      const response = await axios.patch(
        `http://127.0.0.1:8000/hr/${type}/appraisals/${requestId}/`,
        { [field]: value },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log("Status updated:", response.data);
      setAppraisalRequests((prev) =>
        prev.map((req) =>
          req.id === requestId
            ? {
                ...req,
                [field]: value,
                request_date: normalizeDate(response.data.request_date),
              }
            : req
        )
      );
      setError("");
    } catch (err) {
      console.error("Error updating status:", err.response?.data);
      setError(
        err.response?.data?.detail ||
          err.response?.data?.non_field_errors?.[0] ||
          "Failed to update status."
      );
    }
  };

  const handleSubmitNewAppraisal = async (e) => {
    e.preventDefault();
    if (!token) {
      setError("Please log in to submit an appraisal request.");
      return;
    }

    if (!appraisalForm.staff_id) {
      setError("Please select a staff member.");
      return;
    }

    if (!appraisalForm.appraisal_amount || appraisalForm.appraisal_amount <= 0) {
      setError("Appraisal amount must be greater than zero.");
      return;
    }

    if (!appraisalForm.reason.trim()) {
      setError("Reason cannot be empty.");
      return;
    }

    const requestData = {
      staff_id: appraisalForm.staff_id,
      appraisal_amount: parseFloat(appraisalForm.appraisal_amount),
      reason: appraisalForm.reason,
    };

    try {
      const response = await axios.post(
        `http://127.0.0.1:8000/hr/${type}/appraisals/`,
        requestData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log("Appraisal request submitted:", response.data);
      setAppraisalRequests((prev) => [
        ...prev,
        {
          ...response.data,
          request_date: normalizeDate(response.data.request_date),
        },
      ]);
      setError("");
      setShowNewModal(false);
      setAppraisalForm({
        staff_id: staff_id || "",
        staff_name: staff_id ? appraisalForm.staff_name : "",
        appraisal_amount: "",
        reason: "",
      });
    } catch (err) {
      console.error("Error submitting appraisal request:", err.response?.data);
      setError(
        err.response?.data?.detail ||
          err.response?.data?.non_field_errors?.[0] ||
          "Failed to submit appraisal request."
      );
    }
  };

  const handleSubmitEditAppraisal = async (e) => {
    e.preventDefault();
    if (!token) {
      setError("Please log in to update appraisal request.");
      return;
    }

    if (!editForm.appraisal_amount || editForm.appraisal_amount <= 0) {
      setError("Appraisal amount must be greater than zero.");
      return;
    }

    if (!editForm.reason.trim()) {
      setError("Reason cannot be empty.");
      return;
    }

    const requestData = {
      appraisal_amount: parseFloat(editForm.appraisal_amount),
      reason: editForm.reason,
    };

    try {
      const response = await axios.patch(
        `http://127.0.0.1:8000/hr/${type}/appraisals/${selectedRequest.id}/`,
        requestData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log("Appraisal request updated:", response.data);
      for (const comment of editForm.comments) {
        if (comment.text.trim() && !comment.id) {
          try {
            await axios.post(
              `http://127.0.0.1:8000/hr/${type}/appraisals/${selectedRequest.id}/comments/`,
              { comment: comment.text },
              { headers: { Authorization: `Bearer ${token}` } }
            );
          } catch (commentErr) {
            console.error("Error posting comment:", commentErr.response?.data);
            throw new Error(
              commentErr.response?.data?.detail || "Failed to post comment."
            );
          }
        }
      }
      const url = staff_id
        ? `http://127.0.0.1:8000/hr/${type}/appraisals/?staff_id=${staff_id}`
        : `http://127.0.0.1:8000/hr/${type}/appraisals/`;
      const refreshResponse = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const normalizedData = refreshResponse.data.map((request) => ({
        ...request,
        request_date: normalizeDate(request.request_date),
      }));
      setAppraisalRequests(normalizedData);
      setFilteredRequests(normalizedData);
      setError("");
      setShowEditModal(false);
      setEditForm({
        appraisal_amount: "",
        reason: "",
        comments: [{ text: "" }],
      });
    } catch (err) {
      console.error("Error updating appraisal request:", err.response?.data);
      setError(
        err.response?.data?.detail ||
          err.response?.data?.non_field_errors?.[0] ||
          Object.values(err.response?.data)?.[0] ||
          "Failed to update appraisal request or post comment."
      );
    }
  };

  const handleViewRequest = (request) => {
    setSelectedRequest(request);
    setShowViewModal(true);
  };

  const handleEditRequest = (request) => {
    setSelectedRequest(request);
    const existingComments =
      request.comments && request.comments.length > 0
        ? request.comments.map((comment) => ({
            id: comment.id,
            text: comment.comment,
          }))
        : [{ text: "" }];
    setEditForm({
      appraisal_amount: request.appraisal_amount,
      reason: request.reason,
      comments: existingComments,
    });
    setShowEditModal(true);
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
    margin: "0.2rem",
  };
  const smallButtonStyle = {
    ...buttonStyle,
    padding: "0.3rem 0.6463rem",
    fontSize: "0.8rem",
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
    maxWidth: "600px",
    boxShadow: "0 8px 16px rgba(0, 0, 0, 0.2)",
    position: "relative",
    border: "1px solid #e0e0e0",
    maxHeight: "80vh",
    overflowY: "auto",
  };
  const closeBtnStyle = {
    position: "absolute",
    top: "10px",
    right: "10px",
    fontSize: "20px",
    cursor: "pointer",
    color: "#666",
    backgroundColor: "transparent",
    border: "none",
    width: "30px",
    height: "30px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "color 0.3s",
  };
  const inputStyle = {
    padding: "0.6rem",
    border: "1px solid #ccc",
    borderRadius: "5px",
    fontSize: "0.9rem",
    width: "100%",
    boxSizing: "border-box",
  };
  const selectStyle = {
    padding: "0.6rem",
    border: "1px solid #ccc",
    borderRadius: "5px",
    fontSize: "0.9rem",
    width: "100%",
    boxSizing: "border-box",
  };
  const textareaStyle = {
    padding: "0.6rem",
    border: "1px solid #ccc",
    borderRadius: "5px",
    fontSize: "0.9rem",
    width: "100%",
    height: "80px",
    resize: "vertical",
    boxSizing: "border-box",
  };
  const formRowStyle = {
    display: "flex",
    gap: "1rem",
    marginBottom: "1rem",
    flexWrap: "wrap",
    alignItems: "flex-start",
  };
  const formColumnStyle = {
    flex: "1",
    minWidth: "120px",
    display: "flex",
    flexDirection: "column",
  };
  const labelStyle = {
    fontSize: "0.9rem",
    fontWeight: "600",
    marginBottom: "0.3rem",
    color: "#333",
  };
  const sectionStyle = {
    marginBottom: "1.5rem",
  };
  const errorStyle = {
    color: "red",
    fontSize: "0.85rem",
    marginTop: "0.5rem",
  };
  const viewFormStyle = {
    display: "grid",
    gap: "1rem",
    gridTemplateColumns: "1fr 1fr",
    marginBottom: "1.5rem",
  };
  const viewFormItemStyle = {
    display: "flex",
    flexDirection: "column",
  };

  return (
    <div style={{ padding: "2rem", margin: "0 auto" }}>
      <h2 style={{ marginBottom: "1rem", color: "#333", fontSize: "1.5rem" }}>
        Appraisal Requests {staff_id ? `for ${type === "staff" ? "Staff" : "Manpower"} ID: ${staff_id}` : `for ${type === "staff" ? "Staff" : "Manpower"}`}
      </h2>
      {error && <div style={errorStyle}>{error}</div>}
      {!staff_id && (
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
                name: "staffName",
                label: "Search by Staff Name",
                width: "200px",
                type: "text",
              },
              {
                name: "requestDate",
                label: "Request Date",
                width: "150px",
                type: "date",
              },
              {
                name: "appraisalDate",
                label: "Appraisal Date",
                width: "150px",
                type: "date",
              },
            ].map(({ name, label, width, type }) => (
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
                  type={type}
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
                Year
              </label>
              <select
                name="year"
                value={filters.year}
                onChange={handleFilterChange}
                style={{ ...selectStyle, width: "150px" }}
              >
                <option value="">All Years</option>
                {uniqueYears.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <button
              onClick={() => setShowNewModal(true)}
              style={buttonStyle}
              onMouseOver={(e) => (e.target.style.backgroundColor = "#333")}
              onMouseOut={(e) => (e.target.style.backgroundColor = "#000")}
              aria-label="New appraisal application"
            >
              New Appraisal Application
            </button>
          </div>
        </div>
      )}
      {staff_id && staffDetails && (
        <div style={{ marginBottom: "1rem" }}>
          <button
            onClick={() => setShowNewModal(true)}
            style={buttonStyle}
            onMouseOver={(e) => (e.target.style.backgroundColor = "#333")}
            onMouseOut={(e) => (e.target.style.backgroundColor = "#000")}
            aria-label="New appraisal application"
          >
            New Appraisal Application
          </button>
        </div>
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
              "Appraisal Amount",
              "Reason",
              "Status",
              "GM Status",
              "Mgmt Status",
              "More Details",
              "Request Date",
              "Submitted By",
            ].map((header) => (
              <th
                key={header}
                style={{ border: "1px solid #000", padding: "0.8rem", fontSize: "0.9rem" }}
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filteredRequests.length === 0 ? (
            <tr>
              <td
                colSpan="11"
                style={{
                  border: "1px solid #000",
                  padding: "0.8rem",
                  textAlign: "center",
                  fontSize: "0.9rem",
                }}
              >
                No Appraisal Requests Found
              </td>
            </tr>
          ) : (
            filteredRequests.map((request, index) => (
              <tr key={request.id} style={{ backgroundColor: "#fff" }}>
                <td
                  style={{
                    border: "1px solid #000",
                    padding: "0.8rem",
                    fontSize: "0.9rem",
                  }}
                >
                  {index + 1}
                </td>
                <td
                  style={{
                    border: "1px solid #000",
                    padding: "0.8rem",
                    fontSize: "0.9rem",
                  }}
                >
                  {request.output_staff_id}
                </td>
                <td
                  style={{
                    border: "1px solid #000",
                    padding: "0.8rem",
                    fontSize: "0.9rem",
                  }}
                >
                  {request.staff_name}
                </td>
                <td
                  style={{
                    border: "1px solid #000",
                    padding: "0.8rem",
                    fontSize: "0.9rem",
                  }}
                >
                  {request.appraisal_amount}
                </td>
                <td
                  style={{
                    border: "1px solid #000",
                    padding: "0.8rem",
                    fontSize: "0.9rem",
                  }}
                >
                  {request.reason}
                </td>
                <td
                  style={{
                    border: "1px solid #000",
                    padding: "0.8rem",
                    fontSize: "0.9rem",
                  }}
                >
                  <select
                    value={request.status}
                    onChange={(e) =>
                      handleStatusChange(request.id, "status", e.target.value)
                    }
                    style={{ ...selectStyle, padding: "0.3rem" }}
                  >
                    {statusOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </td>
                <td
                  style={{
                    border: "1px solid #000",
                    padding: "0.8rem",
                    fontSize: "0.9rem",
                  }}
                >
                  <select
                    value={request.gm_status}
                    onChange={(e) =>
                      handleStatusChange(request.id, "gm_status", e.target.value)
                    }
                    style={{ ...selectStyle, padding: "0.3rem" }}
                  >
                    {extendedStatusOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </td>
                <td
                  style={{
                    border: "1px solid #000",
                    padding: "0.8rem",
                    fontSize: "0.9rem",
                  }}
                >
                  <select
                    value={request.mgmt_status}
                    onChange={(e) =>
                      handleStatusChange(request.id, "mgmt_status", e.target.value)
                    }
                    style={{ ...selectStyle, padding: "0.3rem" }}
                  >
                    {extendedStatusOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </td>
                <td
                  style={{
                    border: "1px solid #000",
                    padding: "0.8rem",
                    fontSize: "0.9rem",
                  }}
                >
                  <button
                    onClick={() => handleViewRequest(request)}
                    style={smallButtonStyle}
                    onMouseOver={(e) => (e.target.style.backgroundColor = "#333")}
                    onMouseOut={(e) => (e.target.style.backgroundColor = "#000")}
                  >
                    View
                  </button>
                  <button
                    onClick={() => handleEditRequest(request)}
                    style={smallButtonStyle}
                    onMouseOver={(e) => (e.target.style.backgroundColor = "#333")}
                    onMouseOut={(e) => (e.target.style.backgroundColor = "#000")}
                  >
                    Edit
                  </button>
                </td>
                <td
                  style={{
                    border: "1px solid #000",
                    padding: "0.8rem",
                    fontSize: "0.9rem",
                  }}
                >
                  {request.request_date}
                </td>
                <td
                  style={{
                    border: "1px solid #000",
                    padding: "0.8rem",
                    fontSize: "0.9rem",
                  }}
                >
                  {request.submitted_by}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {(showNewModal || (staff_id && showNewModal)) && (
        <div style={modalStyle}>
          <div style={modalContentStyle}>
            <button
              onClick={() => setShowNewModal(false)}
              style={closeBtnStyle}
              aria-label="Close modal"
            >
              ×
            </button>
            <h3
              style={{
                fontSize: "1.2rem",
                marginBottom: "1.5rem",
                color: "#333 third",
              }}
            >
              New Appraisal Application
            </h3>
            <form onSubmit={handleSubmitNewAppraisal}>
              <div style={{ ...formRowStyle, alignItems: "center" }}>
                <div style={formColumnStyle}>
                  <label style={labelStyle}>Staff Name</label>
                  {staff_id ? (
                    <input
                      type="text"
                      value={appraisalForm.staff_name}
                      readOnly
                      style={inputStyle}
                    />
                  ) : (
                    <select
                      name="staff_name"
                      value={appraisalForm.staff_name}
                      onChange={handleNewFormChange}
                      style={selectStyle}
                      required
                    >
                      <option value="">Select Staff</option>
                      {staffList.map((staff) => (
                        <option key={staff.staff_id} value={staff.name}>
                          {staff.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                <div style={formColumnStyle}>
                  <label style={labelStyle}>Staff ID</label>
                  <input
                    type="text"
                    name="staff_id"
                    value={appraisalForm.staff_id}
                    readOnly
                    style={inputStyle}
                  />
                </div>
                <div style={formColumnStyle}>
                  <label style={labelStyle}>Appraisal Amount</label>
                  <input
                    type="number"
                    name="appraisal_amount"
                    value={appraisalForm.appraisal_amount}
                    onChange={handleNewFormChange}
                    style={inputStyle}
                    min="0.01"
                    step="0.01"
                    required
                  />
                </div>
              </div>
              <div style={sectionStyle}>
                <label style={labelStyle}>Reason for Appraisal</label>
                <textarea
                  name="reason"
                  value={appraisalForm.reason}
                  onChange={handleNewFormChange}
                  style={textareaStyle}
                  required
                />
              </div>
              {error && <div style={errorStyle}>{error}</div>}
              <button
                type="submit"
                style={{ ...buttonStyle, width: "100%" }}
                onMouseOver={(e) => (e.target.style.backgroundColor = "#333")}
                onMouseOut={(e) => (e.target.style.backgroundColor = "#000")}
              >
                Raise Request
              </button>
            </form>
          </div>
        </div>
      )}

      {showViewModal && selectedRequest && (
        <div style={modalStyle}>
          <div style={modalContentStyle}>
            <button
              onClick={() => setShowViewModal(false)}
              style={closeBtnStyle}
              aria-label="Close modal"
            >
              ×
            </button>
            <h3
              style={{
                fontSize: "1.2rem",
                marginBottom: "1.5rem",
                color: "#333",
              }}
            >
              Appraisal Request Details
            </h3>
            <div style={viewFormStyle}>
              <div style={viewFormItemStyle}>
                <label style={labelStyle}>Staff Name</label>
                <input
                  type="text"
                  value={selectedRequest.staff_name}
                  readOnly
                  style={inputStyle}
                />
              </div>
              <div style={viewFormItemStyle}>
                <label style={labelStyle}>Staff ID</label>
                <input
                  type="text"
                  value={selectedRequest.output_staff_id}
                  readOnly
                  style={inputStyle}
                />
              </div>
              <div style={viewFormItemStyle}>
                <label style={labelStyle}>Appraisal Amount</label>
                <input
                  type="text"
                  value={selectedRequest.appraisal_amount}
                  readOnly
                  style={inputStyle}
                />
              </div>
              <div style={{ ...viewFormItemStyle, gridColumn: "1 / -1" }}>
                <label style={labelStyle}>Reason</label>
                <textarea
                  value={selectedRequest.reason}
                  readOnly
                  style={textareaStyle}
                />
              </div>
              <div style={viewFormItemStyle}>
                <label style={labelStyle}>Status</label>
                <input
                  type="text"
                  value={selectedRequest.status}
                  readOnly
                  style={inputStyle}
                />
              </div>
              <div style={viewFormItemStyle}>
                <label style={labelStyle}>GM Status</label>
                <input
                  type="text"
                  value={selectedRequest.gm_status}
                  readOnly
                  style={inputStyle}
                />
              </div>
              <div style={viewFormItemStyle}>
                <label style={labelStyle}>Mgmt Status</label>
                <input
                  type="text"
                  value={selectedRequest.mgmt_status}
                  readOnly
                  style={inputStyle}
                />
              </div>
              <div style={viewFormItemStyle}>
                <label style={labelStyle}>Request Date</label>
                <input
                  type="text"
                  value={selectedRequest.request_date}
                  readOnly
                  style={inputStyle}
                />
              </div>
              <div style={viewFormItemStyle}>
                <label style={labelStyle}>Submitted By</label>
                <input
                  type="text"
                  value={selectedRequest.submitted_by}
                  readOnly
                  style={inputStyle}
                />
              </div>
            </div>
            <div style={sectionStyle}>
              <h4 style={{ fontSize: "1rem", marginBottom: "0.5rem" }}>
                Comments
              </h4>
              {selectedRequest.comments && selectedRequest.comments.length > 0 ? (
                selectedRequest.comments.map((comment) => (
                  <div
                    key={comment.id}
                    style={{ marginBottom: "0.5rem", fontSize: "0.9rem" }}
                  >
                    <strong>{comment.commenter}</strong> (
                    {new Date(comment.comment_date).toLocaleString()}):{" "}
                    {comment.comment}
                  </div>
                ))
              ) : (
                <p style={{ fontSize: "0.9rem" }}>No comments</p>
              )}
            </div>
          </div>
        </div>
      )}

      {showEditModal && selectedRequest && (
        <div style={modalStyle}>
          <div style={modalContentStyle}>
            <button
              onClick={() => setShowEditModal(false)}
              style={closeBtnStyle}
              aria-label="Close modal"
            >
              ×
            </button>
            <h3
              style={{
                fontSize: "1.2rem",
                marginBottom: "1.5rem",
                color: "#333",
              }}
            >
              Edit Appraisal Request
            </h3>
            <form onSubmit={handleSubmitEditAppraisal}>
              <div style={{ ...formRowStyle, alignItems: "center" }}>
                <div style={formColumnStyle}>
                  <label style={labelStyle}>Staff Name</label>
                  <input
                    type="text"
                    value={selectedRequest.staff_name}
                    readOnly
                    style={inputStyle}
                  />
                </div>
                <div style={formColumnStyle}>
                  <label style={labelStyle}>Staff ID</label>
                  <input
                    type="text"
                    value={selectedRequest.output_staff_id}
                    readOnly
                    style={inputStyle}
                  />
                </div>
                <div style={formColumnStyle}>
                  <label style={labelStyle}>Appraisal Amount</label>
                  <input
                    type="number"
                    name="appraisal_amount"
                    value={editForm.appraisal_amount}
                    onChange={handleEditFormChange}
                    style={inputStyle}
                    min="0.01"
                    step="0.01"
                    required
                  />
                </div>
              </div>
              <div style={sectionStyle}>
                <label style={labelStyle}>Reason for Appraisal</label>
                <textarea
                  name="reason"
                  value={editForm.reason}
                  onChange={handleEditFormChange}
                  style={textareaStyle}
                  required
                />
              </div>
              <div style={sectionStyle}>
                <label style={labelStyle}>Comments</label>
                {editForm.comments.map((comment, index) => (
                  <div
                    key={index}
                    style={{
                      marginBottom: "0.5rem",
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "0.5rem",
                    }}
                  >
                    <textarea
                      value={comment.text}
                      onChange={(e) => handleCommentChange(index, e.target.value)}
                      style={textareaStyle}
                      placeholder={`Comment ${index + 1}`}
                    />
                    {editForm.comments.length > 1 && (
                      <button
                        type="button"
                        onClick={() => deleteComment(index)}
                        style={smallButtonStyle}
                        onMouseOver={(e) =>
                          (e.target.style.backgroundColor = "#333")
                        }
                        onMouseOut={(e) =>
                          (e.target.style.backgroundColor = "#000")
                        }
                      >
                        Delete
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addCommentInput}
                  style={{ ...buttonStyle, marginTop: "0.5rem" }}
                  onMouseOver={(e) => (e.target.style.backgroundColor = "#333")}
                  onMouseOut={(e) => (e.target.style.backgroundColor = "#000")}
                >
                  Add Comment
                </button>
              </div>
              {error && <div style={errorStyle}>{error}</div>}
              <button
                type="submit"
                style={{ ...buttonStyle, width: "100%" }}
                onMouseOver={(e) => (e.target.style.backgroundColor = "#333")}
                onMouseOut={(e) => (e.target.style.backgroundColor = "#000")}
              >
                Update Appraisal Request
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Appraisals;