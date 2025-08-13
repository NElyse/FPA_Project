import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../CSS/RecipientListPage.css";

const RecipientListPage = () => {
  const [recipients, setRecipients] = useState([]);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const fetchRecipients = () => {
    const userString = localStorage.getItem("user");
    if (!userString) {
      setError("You must be logged in to view recipients.");
      return;
    }

    const user = JSON.parse(userString);

    axios
      .get("http://localhost:5000/api/RecipientsRoutes/recipients", {
        headers: { "user-id": user.id },
      })
      .then((res) => {
        if (Array.isArray(res.data)) {
          setRecipients(res.data);
        } else if (Array.isArray(res.data.recipients)) {
          setRecipients(res.data.recipients);
        } else {
          setRecipients([]);
          setError("No recipients data found.");
        }
      })
      .catch((err) => {
        console.error(err);
        setError("Failed to fetch recipients.");
      });
  };

  useEffect(() => {
    fetchRecipients();
  }, []);

  return (
    <div className="recipient-list-container">
      <div className="header-bar">
        <h2>📋 Registered Alert Recipients</h2>
        <button
          className="add-btn"
          onClick={() => navigate("/registerRecipientPage")}
        >
          ➕ Add New
        </button>
      </div>

      {error && <p className="error-text">{error}</p>}

      {!error && (!Array.isArray(recipients) || recipients.length === 0) && (
        <p>No recipients registered yet.</p>
      )}

      {Array.isArray(recipients) && recipients.length > 0 && (
        <table className="recipient-table">
          <thead>
            <tr>
              <th>Number</th>
              <th>Full Name</th>
              <th>Phone</th>
              <th>Location (Sector)</th>
              <th>Email</th>
              <th>Type</th>
            </tr>
          </thead>
          <tbody>
            {recipients.map((r, index) => (
              <tr key={r.id}>
                <td>{index + 1}</td>
                <td>{r.full_name}</td>
                <td>{r.phone}</td>
                <td>{r.location}</td>
                <td>{r.email}</td>
                <td>{r.recipient_type}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default RecipientListPage;
