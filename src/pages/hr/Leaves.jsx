import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";

const Leaves = ({ staff_id }) => {
  const navigate = useNavigate();
  const { type } = useParams(); // Get the type parameter from the URL
  const [staffDetails, setStaffDetails] = useState(null); // Single staff when staff_id is provided
  const [staffList, setStaffList] = useState([]); // All staff when no staff_id
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [error, setError] = useState("");
  const [showNewModal, setShowNewModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [leaveForm, setLeaveForm] = useState({
    staff_id: staff_id || "",
    staff_name: "",
    from_date: "",
    to_date: "",
    reason: "",
  });
  const [editForm, setEditForm] = useState({
    from_date: "",
    to_date: "",
    reason: "",
    comments: [{ text: "" }],
  });
  const [filters, setFilters] = useState({
    staffName: "",
    year: "",
    requestDate: "",
    fromDate: "",
    toDate: "",
  });
  const token = localStorage.getItem("accessToken");

  const statusOptions = ["Approved", "Under Review", "Rejected"];
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
      setError("Please log in to view leave requests.");
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
          setLeaveForm((prev) => ({
            ...prev,
            staff_name: res.data.name,
            staff_id: res.data.staff_id,
          }));
        })
        .catch((err) => {
          console.error("Error fetching staff details:", err.response?.data);
          setError("Failed to load staff details.");
        });

      // Fetch leave requests for specific staff
      axios
        .get(`http://127.0.0.1:8000/hr/${type}/leaverequests/?staff_id=${staff_id}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => {
          console.log("Leave Requests:", res.data);
          const normalizedData = res.data.map((request) => ({
            ...request,
            from_date: normalizeDate(request.from_date),
            to_date: normalizeDate(request.to_date),
            request_date: normalizeDate(request.request_date),
          }));
          setLeaveRequests(normalizedData);
          setFilteredRequests(normalizedData);
        })
        .catch((err) => {
          console.error("Error fetching leave requests:", err.response?.data);
          setError("Failed to load leave requests.");
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

      // Fetch all leave requests
      axios
        .get(`http://127.0.0.1:8000/hr/${type}/leaverequests/`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => {
          console.log("Leave Requests:", res.data);
          const normalizedData = res.data.map((request) => ({
            ...request,
            from_date: normalizeDate(request.from_date),
            to_date: normalizeDate(request.to_date),
            request_date: normalizeDate(request.request_date),
          }));
          setLeaveRequests(normalizedData);
          setFilteredRequests(normalizedData);
        })
        .catch((err) => {
          console.error("Error fetching leave requests:", err.response?.data);
          setError("Failed to load leave requests.");
        });
    }
  }, [token, staff_id, type]);

  // Get unique years from request_date for the year filter
  const uniqueYears = Array.from(
    new Set(
      leaveRequests
        .map((request) =>
          request.request_date
            ? new Date(request.request_date).getFullYear().toString()
            : null
        )
        .filter((year) => year !== null)
    )
  ).sort();

  useEffect(() => {
    setFilteredRequests(
      leaveRequests.filter((request) => {
        const requestFrom = new Date(request.from_date);
        const requestTo = new Date(request.to_date);
        const filterFrom = filters.fromDate ? new Date(filters.fromDate) : null;
        const filterTo = filters.toDate ? new Date(filters.toDate) : null;

        const dateOverlap =
          (!filterFrom || requestTo >= filterFrom) &&
          (!filterTo || requestFrom <= filterTo);

        return (
          (!filters.staffName ||
            request.staff_name.toLowerCase().includes(filters.staffName.toLowerCase())) &&
          (!filters.year ||
            new Date(request.request_date).getFullYear().toString() === filters.year) &&
          (!filters.requestDate ||
            request.request_date === filters.requestDate) &&
          (!filters.fromDate && !filters.toDate || dateOverlap)
        );
      })
    );
  }, [filters, leaveRequests]);

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleNewFormChange = (e) => {
    const { name, value } = e.target;
    if (name === "staff_name" && !staff_id) {
      const selectedStaff = staffList.find((staff) => staff.name === value);
      setLeaveForm((prev) => ({
        ...prev,
        staff_name: value,
        staff_id: selectedStaff ? selectedStaff.staff_id : "",
      }));
    } else {
      setLeaveForm((prev) => ({ ...prev, [name]: value }));
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
          `http://127.0.0.1:8000/hr/${type}/leaverequests/${selectedRequest.id}/comments/${comment.id}/`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        console.log(`Comment ${comment.id} deleted from backend`);
      } catch (err) {
        console.error("Error deleting comment:", err.response?.data);
        setError(
          err.response?.data?.detail ||
            "Failed to delete comment from the server."
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
        `http://127.0.0.1:8000/hr/${type}/leaverequests/${requestId}/`,
        { [field]: value },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log("Status updated:", response.data);
      setLeaveRequests((prev) =>
        prev.map((req) =>
          req.id === requestId
            ? {
                ...req,
                [field]: value,
                from_date: normalizeDate(response.data.from_date),
                to_date: normalizeDate(response.data.to_date),
                request_date: normalizeDate(response.data.request_date),
              }
            : req
        )
      );
      setFilteredRequests((prev) =>
        prev.map((req) =>
          req.id === requestId
            ? {
                ...req,
                [field]: value,
                from_date: normalizeDate(response.data.from_date),
                to_date: normalizeDate(response.data.to_date),
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

  const handleSubmitNewLeave = async (e) => {
    e.preventDefault();
    if (!token) {
      setError("Please log in to submit a leave request.");
      return;
    }

    if (!leaveForm.staff_id) {
      setError("Please select a staff member.");
      return;
    }

    if (new Date(leaveForm.from_date) > new Date(leaveForm.to_date)) {
      setError("From date cannot be later than to date.");
      return;
    }

    if (!leaveForm.reason.trim()) {
      setError("Reason cannot be empty.");
      return;
    }

    const requestData = {
      staff_id: leaveForm.staff_id,
      from_date: leaveForm.from_date,
      to_date: leaveForm.to_date,
      reason: leaveForm.reason,
    };

    try {
      const response = await axios.post(
        `http://127.0.0.1:8000/hr/${type}/leaverequests/`,
        requestData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log("Leave request submitted:", response.data);
      setLeaveRequests((prev) => [
        ...prev,
        {
          ...response.data,
          from_date: normalizeDate(response.data.from_date),
          to_date: normalizeDate(response.data.to_date),
          request_date: normalizeDate(response.data.request_date),
        },
      ]);
      setFilteredRequests((prev) => [
        ...prev,
        {
          ...response.data,
          from_date: normalizeDate(response.data.from_date),
          to_date: normalizeDate(response.data.to_date),
          request_date: normalizeDate(response.data.request_date),
        },
      ]);
      setError("");
      setShowNewModal(false);
      setLeaveForm({
        staff_id: staff_id || "",
        staff_name: staffDetails?.name || "",
        from_date: "",
        to_date: "",
        reason: "",
      });
    } catch (err) {
      console.error("Error submitting leave request:", err.response?.data);
      setError(
        err.response?.data?.detail ||
          err.response?.data?.non_field_errors?.[0] ||
          "Failed to submit leave request."
      );
    }
  };

  const handleSubmitEditLeave = async (e) => {
    e.preventDefault();
    if (!token) {
      setError("Please log in to update leave request.");
      return;
    }

    if (new Date(editForm.from_date) > new Date(editForm.to_date)) {
      setError("From date cannot be later than to date.");
      return;
    }

    if (!editForm.reason.trim()) {
      setError("Reason cannot be empty.");
      return;
    }

    const requestData = {
      from_date: editForm.from_date,
      to_date: editForm.to_date,
      reason: editForm.reason,
    };

    try {
      const response = await axios.patch(
        `http://127.0.0.1:8000/hr/${type}/leaverequests/${selectedRequest.id}/`,
        requestData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log("Leave request updated:", response.data);
      for (const comment of editForm.comments) {
        if (comment.text.trim() && !comment.id) {
          try {
            await axios.post(
              `http://127.0.0.1:8000/hr/${type}/leaverequests/${selectedRequest.id}/comments/`,
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
      const refreshResponse = await axios.get(
        staff_id
          ? `http://127.0.0.1:8000/hr/${type}/leaverequests/?staff_id=${staff_id}`
          : `http://127.0.0.1:8000/hr/${type}/leaverequests/`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const normalizedData = refreshResponse.data.map((request) => ({
        ...request,
        from_date: normalizeDate(request.from_date),
        to_date: normalizeDate(request.to_date),
        request_date: normalizeDate(request.request_date),
      }));
      setLeaveRequests(normalizedData);
      setFilteredRequests(normalizedData);
      setError("");
      setShowEditModal(false);
      setEditForm({
        from_date: "",
        to_date: "",
        reason: "",
        comments: [{ text: "" }],
      });
    } catch (err) {
      console.error("Error updating leave request:", err.response?.data);
      setError(
        err.response?.data?.detail ||
          err.response?.data?.non_field_errors?.[0] ||
          Object.values(err.response?.data)?.[0] ||
          "Failed to update leave request or post comment."
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
      from_date: request.from_date,
      to_date: request.to_date,
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
    padding: "0.3rem 0.6rem",
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
  const filterContainerStyle = {
    display: "flex",
    flexWrapykernel: "wrap",
    gap: "1rem",
    alignItems: "center",
    marginBottom: "1rem",
  };

  return (
    <div style={{ padding: "2rem", margin: "0 auto" }}>
      {staff_id ? (
        // UI for specific staff_id
        <>
          <h2
            style={{ marginBottom: "1rem", color: "#333", fontSize: "1.5rem" }}
          >
            Leave Requests for {type === "staff" ? "Staff" : "Manpower"} ID: {staff_id}
          </h2>
          {error && <div style={errorStyle}>{error}</div>}
          {staffDetails && (
            <>
              {/* New Leave Application Form */}
              <div style={sectionStyle}>
                <h3
                  style={{ fontSize: "1.2rem", marginBottom: "1rem", color: "#333" }}
                >
                  New Leave Application
                </h3>
                <form onSubmit={handleSubmitNewLeave}>
                  <div style={{ ...formRowStyle, alignItems: "center" }}>
                    <div style={formColumnStyle}>
                      <label style={labelStyle}>Staff Name</label>
                      <input
                        type="text"
                        value={staffDetails.name}
                        readOnly
                        style={inputStyle}
                      />
                    </div>
                    <div style={formColumnStyle}>
                      <label style={labelStyle}>Staff ID</label>
                      <input
                        type="text"
                        value={staffDetails.staff_id}
                        readOnly
                        style={inputStyle}
                      />
                    </div>
                    <div style={formColumnStyle}>
                      <label style={labelStyle}>From Date</label>
                      <input
                        type="date"
                        name="from_date"
                        value={leaveForm.from_date}
                        onChange={handleNewFormChange}
                        style={inputStyle}
                        required
                      />
                    </div>
                    <div style={formColumnStyle}>
                      <label style={labelStyle}>To Date</label>
                      <input
                        type="date"
                        name="to_date"
                        value={leaveForm.to_date}
                        onChange={handleNewFormChange}
                        style={inputStyle}
                        required
                      />
                    </div>
                  </div>
                  <div style={sectionStyle}>
                    <label style={labelStyle}>Reason</label>
                    <textarea
                      name="reason"
                      value={leaveForm.reason}
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
                    Submit Leave Request
                  </button>
                </form>
              </div>

              {/* Filters for Leave Requests */}
              <div style={filterContainerStyle}>
                <div>
                  <label
                    style={{
                      display: "block",
                      color: "#333",
                      fontSize: "0.9rem",
                      marginBottom: "0.25rem",
                    }}
                  >
                    Request Date
                  </label>
                  <input
                    type="date"
                    name="requestDate"
                    value={filters.requestDate}
                    onChange={handleFilterChange}
                    style={{ ...inputStyle, width: "150px" }}
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
                    From Date
                  </label>
                  <input
                    type="date"
                    name="fromDate"
                    value={filters.fromDate}
                    onChange={handleFilterChange}
                    style={{ ...inputStyle, width: "150px" }}
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
                    To Date
                  </label>
                  <input
                    type="date"
                    name="toDate"
                    value={filters.toDate}
                    onChange={handleFilterChange}
                    style={{ ...inputStyle, width: "150px" }}
                  />
                </div>
              </div>

              {/* Leave Requests Table */}
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
                      "From Date",
                      "To Date",
                      "Status",
                      "GM Status",
                      "Mgmt Status",
                      "More Details",
                      "Request Date",
                      "Submitted By",
                    ].map((header) => (
                      <th
                        key={header}
                        style={{
                          border: "1px solid #000",
                          padding: "0.8rem",
                          fontSize: "0.9rem",
                        }}
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
                        colSpan="9"
                        style={{
                          border: "1px solid #000",
                          padding: "0.8rem",
                          textAlign: "center",
                          fontSize: "0.9rem",
                        }}
                      >
                        No Leave Requests Found
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
                          {request.from_date}
                        </td>
                        <td
                          style={{
                            border: "1px solid #000",
                            padding: "0.8rem",
                            fontSize: "0.9rem",
                          }}
                        >
                          {request.to_date}
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
                              handleStatusChange(
                                request.id,
                                "mgmt_status",
                                e.target.value
                              )
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
                            onMouseOver={(e) =>
                              (e.target.style.backgroundColor = "#333")
                            }
                            onMouseOut={(e) =>
                              (e.target.style.backgroundColor = "#000")
                            }
                          >
                            View
                          </button>
                          <button
                            onClick={() => handleEditRequest(request)}
                            style={smallButtonStyle}
                            onMouseOver={(e) =>
                              (e.target.style.backgroundColor = "#333")
                            }
                            onMouseOut={(e) =>
                              (e.target.style.backgroundColor = "#000")
                            }
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
            </>
          )}
        </>
      ) : (
        // Original UI for all staff
        <>
          <h2
            style={{ marginBottom: "1rem", color: "#333", fontSize: "1.5rem" }}
          >
            {type === "staff" ? "Staff" : "Manpower"} Leave Requests
          </h2>
          {error && <div style={errorStyle}>{error}</div>}
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
            <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", alignItems: "center" }}>
              {[
                {
                  name: "staffName",
                  label: "Search by Staff Name",
                  width: "200px",
                  type: "text",
                },
                { name: "requestDate", label: "Request Date", width: "150px", type: "date" },
                { name: "fromDate", label: "From Date", width: "150px", type: "date" },
                { name: "toDate", label: "To Date", width: "150px", type: "date" },
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
                aria-label="New leave application"
              >
                New Leave Application
              </button>
            </div>
          </div>
          <table
            style={{ width: "100%", borderCollapse: "collapse", marginTop: "1rem" }}
          >
            <thead>
              <tr style={{ backgroundColor: "#000", color: "#fff" }}>
                {[
                  "S.No",
                  "Staff ID",
                  "Staff Name",
                  "From Date",
                  "To Date",
                  "Status",
                  "GM Status",
                  "Mgmt Status",
                  "More Details",
                  "Request Date",
                  "Submitted By",
                ].map((header) => (
                  <th
                    key={header}
                    style={{
                      border: "1px solid #000",
                      padding: "0.8rem",
                      fontSize: "0.9rem",
                    }}
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
                    No Leave Requests Found
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
                      {request.from_date}
                    </td>
                    <td
                      style={{
                        border: "1px solid #000",
                        padding: "0.8rem",
                        fontSize: "0.9rem",
                      }}
                    >
                      {request.to_date}
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
                        onMouseOver={(e) =>
                          (e.target.style.backgroundColor = "#333")
                        }
                        onMouseOut={(e) =>
                          (e.target.style.backgroundColor = "#000")
                        }
                      >
                        View
                      </button>
                      <button
                        onClick={() => handleEditRequest(request)}
                        style={smallButtonStyle}
                        onMouseOver={(e) =>
                          (e.target.style.backgroundColor = "#333")
                        }
                        onMouseOut={(e) =>
                          (e.target.style.backgroundColor = "#000")
                        }
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
        </>
      )}

      {/* New Leave Modal (only when no staff_id) */}
      {showNewModal && !staff_id && (
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
              style={{ fontSize: "1.2rem", marginBottom: "1.5rem", color: "#333" }}
            >
              New Leave Application
            </h3>
            <form onSubmit={handleSubmitNewLeave}>
              <div style={{ ...formRowStyle, alignItems: "center" }}>
                <div style={formColumnStyle}>
                  <label style={labelStyle}>Staff Name</label>
                  <select
                    name="staff_name"
                    value={leaveForm.staff_name}
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
                </div>
                <div style={formColumnStyle}>
                  <label style={labelStyle}>Staff ID</label>
                  <input
                    type="text"
                    name="staff_id"
                    value={leaveForm.staff_id}
                    readOnly
                    style={inputStyle}
                  />
                </div>
                <div style={formColumnStyle}>
                  <label style={labelStyle}>From Date</label>
                  <input
                    type="date"
                    name="from_date"
                    value={leaveForm.from_date}
                    onChange={handleNewFormChange}
                    style={inputStyle}
                    required
                  />
                </div>
                <div style={formColumnStyle}>
                  <label style={labelStyle}>To Date</label>
                  <input
                    type="date"
                    name="to_date"
                    value={leaveForm.to_date}
                    onChange={handleNewFormChange}
                    style={inputStyle}
                    required
                  />
                </div>
              </div>
              <div style={sectionStyle}>
                <label style={labelStyle}>Reason</label>
                <textarea
                  name="reason"
                  value={leaveForm.reason}
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
                Submit Leave Request
              </button>
            </form>
          </div>
        </div>
      )}

      {/* View Leave Modal */}
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
              style={{ fontSize: "1.2rem", marginBottom: "1.5rem", color: "#333" }}
            >
              Leave Request Details
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
                <label style={labelStyle}>From Date</label>
                <input
                  type="text"
                  value={selectedRequest.from_date}
                  readOnly
                  style={inputStyle}
                />
              </div>
              <div style={viewFormItemStyle}>
                <label style={labelStyle}>To Date</label>
                <input
                  type="text"
                  value={selectedRequest.to_date}
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

      {/* Edit Leave Modal */}
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
              style={{ fontSize: "1.2rem", marginBottom: "1.5rem", color: "#333" }}
            >
              Edit Leave Request
            </h3>
            <form onSubmit={handleSubmitEditLeave}>
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
                  <label style={labelStyle}>From Date</label>
                  <input
                    type="date"
                    name="from_date"
                    value={editForm.from_date}
                    onChange={handleEditFormChange}
                    style={inputStyle}
                    required
                  />
                </div>
                <div style={formColumnStyle}>
                  <label style={labelStyle}>To Date</label>
                  <input
                    type="date"
                    name="to_date"
                    value={editForm.to_date}
                    onChange={handleEditFormChange}
                    style={inputStyle}
                    required
                  />
                </div>
              </div>
              <div style={sectionStyle}>
                <label style={labelStyle}>Reason</label>
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
                Update Leave Request
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Leaves;