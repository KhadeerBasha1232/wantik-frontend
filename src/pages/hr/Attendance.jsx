import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { Pie } from "react-chartjs-2";
import Chart from "chart.js/auto";

const Attendance = ({ staff_id }) => {
  const navigate = useNavigate();
  const { type } = useParams(); // Get the type parameter from the URL
  const [staffDetails, setStaffDetails] = useState(null); // Single staff when staff_id is provided
  const [staffList, setStaffList] = useState([]); // All staff when no staff_id
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [filteredAttendanceRecords, setFilteredAttendanceRecords] = useState([]);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [searchName, setSearchName] = useState("");
  const [searchStaffId, setSearchStaffId] = useState("");
  const [mainTableStatus, setMainTableStatus] = useState("All");
  const token = localStorage.getItem("accessToken");

  const statusOptions = ["Present", "Absent", "On Leave", "Half Day"];
  const filterStatusOptions = ["All", ...statusOptions];

  // Normalize date strings
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

  // Fetch staff details and attendance records
  useEffect(() => {
    if (!token) {
      setError("Please log in to view attendance.");
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
          setStaffDetails({
            ...res.data,
            joining_date: normalizeDate(res.data.joining_date),
          });
        })
        .catch((err) => {
          console.error("Error fetching staff details:", err.response?.data);
          setError("Failed to load staff details.");
        });

      // Fetch attendance records for specific staff
      axios
        .get(`http://127.0.0.1:8000/hr/${type}/attendance/?staff_id=${staff_id}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => {
          console.log("Attendance Records:", res.data);
          const normalizedData = res.data.map((record) => ({
            ...record,
            date: normalizeDate(record.date),
          }));
          setAttendanceRecords(normalizedData);
          setFilteredAttendanceRecords(normalizedData);
        })
        .catch((err) => {
          console.error("Error fetching attendance records:", err.response?.data);
          setError("Failed to load attendance records.");
        });
    } else {
      // Fetch all staff details
      axios
        .get(`http://127.0.0.1:8000/hr/${type}/staffdetails/`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => {
          console.log("Staff List:", res.data);
          const normalizedData = res.data.map((staff) => ({
            ...staff,
            joining_date: normalizeDate(staff.joining_date),
          }));
          setStaffList(normalizedData);
        })
        .catch((err) => {
          console.error("Error fetching staff details:", err.response?.data);
          setError("Failed to load staff details.");
        });

      // Fetch all attendance records
      axios
        .get(`http://127.0.0.1:8000/hr/${type}/attendance/`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => {
          console.log("Attendance Records:", res.data);
          const normalizedData = res.data.map((record) => ({
            ...record,
            date: normalizeDate(record.date),
          }));
          setAttendanceRecords(normalizedData);
        })
        .catch((err) => {
          console.error("Error fetching attendance records:", err.response?.data);
          setError("Failed to load attendance records.");
        });
    }
  }, [token, staff_id, type]);

  // Handle attendance status change
  const handleAttendanceChange = async (staffId, field, value) => {
    if (!token) {
      setError("Please log in to update attendance.");
      return;
    }

    const staff = staff_id
      ? staffDetails
      : staffList.find((s) => s.staff_id === staffId);
    if (!staff) {
      setError(`Staff with ID ${staffId} not found.`);
      return;
    }

    const today = new Date().toISOString().split("T")[0];
    const existingRecord = attendanceRecords.find(
      (record) => record.output_staff_id === staffId && record.date === today
    );

    // Optimistic update
    const updatedRecords = existingRecord
      ? attendanceRecords.map((record) =>
          record.output_staff_id === staffId && record.date === today
            ? { ...record, [field]: value }
            : record
        )
      : [
          ...attendanceRecords,
          {
            output_staff_id: staffId,
            staff_name: staff.name,
            date: today,
            status: value,
          },
        ];
    setAttendanceRecords(updatedRecords);
    if (staff_id) {
      setFilteredAttendanceRecords(updatedRecords);
    }

    const requestData = {
      staff_id: staff.staff_id,
      date: today,
      status: value,
    };

    try {
      const response = await (existingRecord
        ? axios.patch(
            `http://127.0.0.1:8000/hr/${type}/attendance/${staffId}/${today}/`,
            { [field]: value },
            { headers: { Authorization: `Bearer ${token}` } }
          )
        : axios.post(
            `http://127.0.0.1:8000/hr/${type}/attendance/`,
            requestData,
            { headers: { Authorization: `Bearer ${token}` } }
          ));

      setAttendanceRecords((prevRecords) =>
        existingRecord
          ? prevRecords.map((record) =>
              record.output_staff_id === staffId && record.date === today
                ? { ...response.data, date: normalizeDate(response.data.date) }
                : record
            )
          : [
              ...prevRecords.filter(
                (record) =>
                  !(record.output_staff_id === staffId && record.date === today)
              ),
              { ...response.data, date: normalizeDate(response.data.date) },
            ]
      );
      if (staff_id) {
        setFilteredAttendanceRecords((prevRecords) =>
          existingRecord
            ? prevRecords.map((record) =>
                record.output_staff_id === staffId && record.date === today
                  ? { ...response.data, date: normalizeDate(response.data.date) }
                  : record
              )
            : [
                ...prevRecords.filter(
                  (record) =>
                    !(record.output_staff_id === staffId && record.date === today)
                ),
                { ...response.data, date: normalizeDate(response.data.date) },
              ]
        );
      }
      setError("");
    } catch (err) {
      console.error(`Error updating attendance:`, err.response?.data);
      setError(
        err.response?.data?.staff_id
          ? `Failed to update attendance: ${err.response.data.staff_id.join(", ")}`
          : err.response?.data?.date
          ? `Failed to update attendance: ${err.response.data.date.join(", ")}`
          : err.response?.data?.detail || "Failed to update attendance."
      );
      setAttendanceRecords(attendanceRecords);
      if (staff_id) {
        setFilteredAttendanceRecords(attendanceRecords);
      }
    }
  };

  // Handle bulk status update (only when no staff_id)
  const handleBulkStatusChange = async (status) => {
    const filteredStaff = staffList.filter((staff) => {
      const matchesName = staff.name
        .toLowerCase()
        .includes(searchName.toLowerCase());
      const matchesStaffId = staff.staff_id.toString().includes(searchStaffId);
      const attendance = attendanceRecords.find(
        (record) => record.output_staff_id === staff.staff_id
      );
      const matchesStatus =
        mainTableStatus === "All" ||
        (attendance && attendance.status === mainTableStatus);
      return matchesName && matchesStaffId && matchesStatus;
    });

    const today = new Date().toISOString().split("T")[0];
    setAttendanceRecords((prevRecords) => {
      let updatedRecords = [...prevRecords];
      filteredStaff.forEach((staff) => {
        const existingRecord = updatedRecords.find(
          (record) => record.output_staff_id === staff.staff_id && record.date === today
        );
        if (existingRecord) {
          updatedRecords = updatedRecords.map((record) =>
            record.output_staff_id === staff.staff_id && record.date === today
              ? { ...record, status }
              : record
          );
        } else {
          updatedRecords.push({
            output_staff_id: staff.staff_id,
            staff_name: staff.name,
            date: today,
            status,
          });
        }
      });
      return updatedRecords;
    });

    const requests = filteredStaff.map((staff) =>
      handleAttendanceChange(staff.staff_id, "status", status)
    );

    try {
      await Promise.all(requests);
    } catch (err) {
      setError("Some attendance updates failed. Please try again.");
    }
  };

  // Handle view attendance history (for modal when no staff_id)
  const handleViewAttendance = (staff) => {
    setSelectedStaff(staff);
    setFromDate("");
    setToDate("");
    setSelectedStatus("All");
    setFilteredAttendanceRecords([]);
    axios
      .get(`http://127.0.0.1:8000/hr/${type}/attendance/?staff_id=${staff.staff_id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        console.log(`Attendance History for ${staff.staff_id}:`, res.data);
        const normalizedData = res.data.map((record) => ({
          ...record,
          date: normalizeDate(record.date),
        }));
        setFilteredAttendanceRecords(normalizedData);
        setShowModal(true);
      })
      .catch((err) => {
        console.error("Error fetching attendance history:", err.response?.data);
        setError(`Failed to load attendance history for ${staff.name}.`);
      });
  };

  // Filter attendance records
  useEffect(() => {
    if (!attendanceRecords.length) {
      setFilteredAttendanceRecords([]);
      return;
    }

    if (fromDate && toDate && new Date(fromDate) > new Date(toDate)) {
      setError("From date cannot be later than to date.");
      setFilteredAttendanceRecords(attendanceRecords);
      return;
    }

    let filtered = attendanceRecords;

    if (fromDate && toDate) {
      filtered = filtered.filter((record) => {
        const recordDate = new Date(record.date);
        return recordDate >= new Date(fromDate) && recordDate <= new Date(toDate);
      });
    }

    if (selectedStatus !== "All") {
      filtered = filtered.filter((record) => record.status === selectedStatus);
    }

    setFilteredAttendanceRecords(filtered);
    setError("");
  }, [attendanceRecords, fromDate, toDate, selectedStatus]);

  // Prepare data for pie chart
  const getPieChartData = () => {
    const statusCounts = {
      Present: 0,
      Absent: 0,
      "On Leave": 0,
      "Half Day": 0,
    };

    filteredAttendanceRecords.forEach((record) => {
      statusCounts[record.status]++;
    });

    return {
      labels: ["Present", "Absent", "On Leave", "Half Day"],
      datasets: [
        {
          data: [
            statusCounts.Present,
            statusCounts.Absent,
            statusCounts["On Leave"],
            statusCounts["Half Day"],
          ],
          backgroundColor: ["#28a745", "#dc3545", "#ffc107", "#17a2b8"],
          hoverBackgroundColor: ["#218838", "#c82333", "#e0a800", "#138496"],
        },
      ],
    };
  };

  // Filter staff list for main table (only when no staff_id)
  const filteredStaffList = staffList.filter((staff) => {
    const matchesName = staff.name
      .toLowerCase()
      .includes(searchName.toLowerCase());
    const matchesStaffId = staff.staff_id.toString().includes(searchStaffId);
    const attendance = attendanceRecords.find(
      (record) =>
        record.output_staff_id === staff.staff_id &&
        record.date === new Date().toISOString().split("T")[0]
    );
    const matchesStatus =
      mainTableStatus === "All" ||
      (attendance && attendance.status === mainTableStatus);
    return matchesName && matchesStaffId && matchesStatus;
  });

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
    marginRight: "0.5rem",
  };
  const smallButtonStyle = {
    ...buttonStyle,
    padding: "0.3rem 0.5rem",
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
    maxWidth: "1000px",
    boxShadow: "0 8px 16px rgba(0, 0, 0, 0.2)",
    position: "relative",
    border: "1px solid #e0e0e0",
    maxHeight: "90vh",
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
  const inputStyle = {
    padding: "0.5rem",
    border: "1px solid #ccc",
    borderRadius: "5px",
    fontSize: "0.9rem",
    marginBottom: "0.5rem",
    width: "100%",
  };
  const selectStyle = {
    padding: "0.5rem",
    border: "1px solid #ccc",
    borderRadius: "5px",
    fontSize: "0.9rem",
    marginBottom: "0.5rem",
    width: "100%",
  };
  const sectionStyle = {
    marginBottom: "2rem",
  };
  const modalColumnsStyle = {
    display: "flex",
    flexDirection: "row",
    gap: "2rem",
    marginBottom: "2rem",
  };
  const leftColumnStyle = {
    flex: "1",
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  };
  const rightColumnStyle = {
    flex: "1",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  };
  const dateFilterStyle = {
    display: "flex",
    gap: "1rem",
    flexWrap: "wrap",
  };
  const filterContainerStyle = {
    display: "flex",
    gap: "1rem",
    flexWrap: "wrap",
    marginBottom: "1rem",
  };
  const bulkButtonContainerStyle = {
    marginBottom: "1rem",
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
            Attendance for {type === "staff" ? "Staff" : "Manpower"} ID: {staff_id}
          </h2>
          {error && <div style={errorStyle}>{error}</div>}
          {staffDetails && (
            <>
              <div style={modalColumnsStyle}>
                <div style={leftColumnStyle}>
                  {/* Staff Name and Staff ID */}
                  <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                    <label
                      style={{
                        flex: "1",
                        fontSize: "0.9rem",
                        fontWeight: "bold",
                      }}
                    >
                      Staff Name:
                      <input
                        type="text"
                        value={staffDetails.name}
                        readOnly
                        style={inputStyle}
                      />
                    </label>
                    <label
                      style={{
                        flex: "1",
                        fontSize: "0.9rem",
                        fontWeight: "bold",
                      }}
                    >
                      Staff ID:
                      <input
                        type="text"
                        value={staffDetails.staff_id}
                        readOnly
                        style={inputStyle}
                      />
                    </label>
                  </div>

                  {/* Today's Attendance */}
                  <div style={sectionStyle}>
                    <h3
                      style={{ fontSize: "1.2rem", marginBottom: "1rem" }}
                    >
                      Today's Attendance
                    </h3>
                    <div
                      style={{ display: "flex", flexWrap: "wrap", gap: "1rem" }}
                    >
                      {statusOptions.map((status) => (
                        <label
                          key={status}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                          }}
                        >
                          <input
                            type="radio"
                            name={`status-${staff_id}`}
                            value={status}
                            checked={
                              attendanceRecords.find(
                                (record) =>
                                  record.output_staff_id === staff_id &&
                                  record.date ===
                                    new Date().toISOString().split("T")[0]
                              )?.status === status
                            }
                            onChange={(e) =>
                              handleAttendanceChange(
                                staff_id,
                                "status",
                                e.target.value
                              )
                            }
                            style={{ cursor: "pointer" }}
                          />
                          {status}
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Date and Status Filters */}
                  <div style={dateFilterStyle}>
                    <label style={{ flex: "1" }}>
                      From Date:
                      <input
                        type="date"
                        value={fromDate}
                        onChange={(e) => setFromDate(e.target.value)}
                        style={inputStyle}
                      />
                    </label>
                    <label style={{ flex: "1" }}>
                      To Date:
                      <input
                        type="date"
                        value={toDate}
                        onChange={(e) => setToDate(e.target.value)}
                        style={inputStyle}
                      />
                    </label>
                    <label style={{ flex: "1" }}>
                      Status:
                      <select
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        style={selectStyle}
                      >
                        {filterStatusOptions.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                </div>

                {/* Pie Chart */}
                <div style={rightColumnStyle}>
                  <div>
                    <h3
                      style={{
                        fontSize: "1.2rem",
                        marginBottom: "1rem",
                        textAlign: "center",
                      }}
                    >
                      Attendance Status Distribution
                    </h3>
                    <div style={{ maxWidth: "200px", margin: "0 auto" }}>
                      <Pie
                        data={getPieChartData()}
                        options={{
                          responsive: true,
                          cutout: "50%",
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              position: "right",
                              labels: {
                                boxWidth: 20,
                                padding: 15,
                                font: { size: 12 },
                              },
                            },
                            tooltip: {
                              callbacks: {
                                label: (context) =>
                                  `${context.label}: ${context.raw}`,
                              },
                            },
                          },
                        }}
                        style={{ maxWidth: "200px" }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Attendance Records Table */}
              <div style={sectionStyle}>
                <h3
                  style={{ fontSize: "1.2rem", marginBottom: "1rem" }}
                >
                  Attendance History for {staffDetails.name} (
                  {staffDetails.staff_id})
                </h3>
                <table
                  style={{ width: "100%", borderCollapse: "collapse" }}
                >
                  <thead>
                    <tr style={{ backgroundColor: "#000", color: "#fff" }}>
                      {["S.No", "Date", "Status", "Reason"].map((header) => (
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
                    {filteredAttendanceRecords.length === 0 ? (
                      <tr>
                        <td
                          colSpan="4"
                          style={{
                            border: "1px solid #000",
                            padding: "0.5rem",
                            textAlign: "center",
                          }}
                        >
                          No Attendance Records Found
                        </td>
                      </tr>
                    ) : (
                      filteredAttendanceRecords.map((record, index) => (
                        <tr
                          key={record.id}
                          style={{ backgroundColor: "#fff" }}
                        >
                          <td
                            style={{
                              border: "1px solid #000",
                              padding: "0.5rem",
                            }}
                          >
                            {index + 1}
                          </td>
                          <td
                            style={{
                              border: "1px solid #000",
                              padding: "0.5rem",
                            }}
                          >
                            {record.date}
                          </td>
                          <td
                            style={{
                              border: "1px solid #000",
                              padding: "0.5rem",
                            }}
                          >
                            {record.status}
                          </td>
                          <td
                            style={{
                              border: "1px solid #000",
                              padding: "0.5rem",
                            }}
                          >
                            {record.reason || "-"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      ) : (
        // Original UI for all staff
        <>
          <h2
            style={{ marginBottom: "1rem", color: "#333", fontSize: "1.5rem" }}
          >
            Today's {type === "staff" ? "Staff" : "Manpower"} Attendance
          </h2>
          {error && <div style={errorStyle}>{error}</div>}
          <div style={filterContainerStyle}>
            <label>
              Search by Name:
              <input
                type="text"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                style={inputStyle}
                placeholder="Enter staff name"
              />
            </label>
            <label>
              Search by Staff ID:
              <input
                type="text"
                value={searchStaffId}
                onChange={(e) => setSearchStaffId(e.target.value)}
                style={inputStyle}
                placeholder="Enter staff ID"
              />
            </label>
            <label>
              Status:
              <select
                value={mainTableStatus}
                onChange={(e) => setMainTableStatus(e.target.value)}
                style={selectStyle}
              >
                {filterStatusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div style={bulkButtonContainerStyle}>
            {statusOptions.map((status) => (
              <button
                key={status}
                onClick={() => handleBulkStatusChange(status)}
                style={buttonStyle}
                onMouseOver={(e) => (e.target.style.backgroundColor = "#333")}
                onMouseOut={(e) => (e.target.style.backgroundColor = "#000")}
              >
                All {status}
              </button>
            ))}
          </div>
          <table
            style={{ width: "100%", borderCollapse: "collapse", marginTop: "1rem" }}
          >
            <thead>
              <tr style={{ backgroundColor: "#000", color: "#fff" }}>
                {["S.No", "Staff ID", "Staff Name", "Attendance Status", "Options"].map(
                  (header) => (
                    <th
                      key={header}
                      style={{ border: "1px solid #000", padding: "0.5rem" }}
                    >
                      {header}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {filteredStaffList.length === 0 ? (
                <tr>
                  <td
                    colSpan="5"
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
                filteredStaffList.map((staff, index) => {
                  const attendance = attendanceRecords.find(
                    (record) =>
                      record.output_staff_id === staff.staff_id &&
                      record.date === new Date().toISOString().split("T")[0]
                  );
                  return (
                    <tr
                      key={staff.staff_id}
                      style={{ backgroundColor: "#fff" }}
                    >
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
                        <div
                          style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: "1rem",
                          }}
                        >
                          {statusOptions.map((status) => (
                            <label
                              key={status}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "0.5rem",
                              }}
                            >
                              <input
                                type="radio"
                                name={`status-${staff.staff_id}`}
                                value={status}
                                checked={
                                  attendance && attendance.status === status
                                }
                                onChange={(e) =>
                                  handleAttendanceChange(
                                    staff.staff_id,
                                    "status",
                                    e.target.value
                                  )
                                }
                                style={{ cursor: "pointer" }}
                              />
                              {status}
                            </label>
                          ))}
                        </div>
                      </td>
                      <td
                        style={{ border: "1px solid #000", padding: "0.5rem" }}
                      >
                        <button
                          onClick={() => handleViewAttendance(staff)}
                          style={smallButtonStyle}
                          onMouseOver={(e) =>
                            (e.target.style.backgroundColor = "#333")
                          }
                          onMouseOut={(e) =>
                            (e.target.style.backgroundColor = "#000")
                          }
                          aria-label={`View attendance history for ${staff.name}`}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          {showModal && selectedStaff && (
            <div style={modalStyle}>
              <div style={modalContentStyle}>
                <span
                  onClick={() => setShowModal(false)}
                  style={closeBtnStyle}
                  aria-label="Close modal"
                >
                  ×
                </span>

                <div style={modalColumnsStyle}>
                  <div style={leftColumnStyle}>
                    <div
                      style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}
                    >
                      <label
                        style={{
                          flex: "1",
                          fontSize: "0.9rem",
                          fontWeight: "bold",
                        }}
                      >
                        Staff Name:
                        <input
                          type="text"
                          value={selectedStaff.name}
                          readOnly
                          style={{ ...inputStyle, width: "100%" }}
                        />
                      </label>
                      <label
                        style={{
                          flex: "1",
                          fontSize: "0.9rem",
                          fontWeight: "bold",
                        }}
                      >
                        Staff ID:
                        <input
                          type="text"
                          value={selectedStaff.staff_id}
                          readOnly
                          style={{ ...inputStyle, width: "100%" }}
                        />
                      </label>
                    </div>

                    <div style={{ ...dateFilterStyle, marginTop: "1rem" }}>
                      <label style={{ flex: "1" }}>
                        From Date:
                        <input
                          type="date"
                          value={fromDate}
                          onChange={(e) => setFromDate(e.target.value)}
                          style={inputStyle}
                        />
                      </label>
                      <label style={{ flex: "1" }}>
                        To Date:
                        <input
                          type="date"
                          value={toDate}
                          onChange={(e) => setToDate(e.target.value)}
                          style={inputStyle}
                        />
                      </label>
                      <label style={{ flex: "1" }}>
                        Status:
                        <select
                          value={selectedStatus}
                          onChange={(e) => setSelectedStatus(e.target.value)}
                          style={selectStyle}
                        >
                          {filterStatusOptions.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                  </div>

                  <div style={rightColumnStyle}>
                    <div>
                      <h3
                        style={{
                          fontSize: "1.2rem",
                          marginBottom: "1rem",
                          textAlign: "center",
                        }}
                      >
                        Attendance Status Distribution
                      </h3>
                      <div style={{ maxWidth: "200px", margin: "0 auto" }}>
                        <Pie
                          data={getPieChartData()}
                          options={{
                            responsive: true,
                            cutout: "50%",
                            maintainAspectRatio: false,
                            plugins: {
                              legend: {
                                position: "right",
                                labels: {
                                  boxWidth: 20,
                                  padding: 15,
                                  font: { size: 12 },
                                },
                              },
                              tooltip: {
                                callbacks: {
                                  label: (context) =>
                                    `${context.label}: ${context.raw}`,
                                },
                              },
                            },
                          }}
                          style={{ maxWidth: "200px" }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div style={sectionStyle}>
                  <h3
                    style={{ fontSize: "1.2rem", marginBottom: "1rem" }}
                  >
                    Attendance Records for {selectedStaff.name} (
                    {selectedStaff.staff_id})
                  </h3>
                  <table
                    style={{ width: "100%", borderCollapse: "collapse" }}
                  >
                    <thead>
                      <tr style={{ backgroundColor: "#000", color: "#fff" }}>
                        {["S.No", "Date", "Status", "Reason"].map((header) => (
                          <th
                            key={header}
                            style={{
                              border: "1px solid #000",
                              padding: "0.5rem",
                            }}
                          >
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAttendanceRecords.length === 0 ? (
                        <tr>
                          <td
                            colSpan="4"
                            style={{
                              border: "1px solid #000",
                              padding: "0.5rem",
                              textAlign: "center",
                            }}
                          >
                            No Attendance Records Found for {selectedStaff.name}
                          </td>
                        </tr>
                      ) : (
                        filteredAttendanceRecords.map((record, index) => (
                          <tr
                            key={record.id}
                            style={{ backgroundColor: "#fff" }}
                          >
                            <td
                              style={{
                                border: "1px solid #000",
                                padding: "0.5rem",
                              }}
                            >
                              {index + 1}
                            </td>
                            <td
                              style={{
                                border: "1px solid #000",
                                padding: "0.5rem",
                              }}
                            >
                              {record.date}
                            </td>
                            <td
                              style={{
                                border: "1px solid #000",
                                padding: "0.5rem",
                              }}
                            >
                              {record.status}
                            </td>
                            <td
                              style={{
                                border: "1px solid #000",
                                padding: "0.5rem",
                              }}
                            >
                              {record.reason || "-"}
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
        </>
      )}
    </div>
  );
};

export default Attendance;