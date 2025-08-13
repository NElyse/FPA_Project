import React, { useState } from "react";
import axios from "axios";
import locationData from "../Home/locations.json";
import "../CSS/RegisterRecipientForm.css";

const recipientTypes = ["Farmer", "Resident", "Health Worker", "Local Leader", "Other"];

const RegisterRecipientPage = () => {
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    email: "",
    recipient_type: "Farmer",
    sector: "",
  });

  const [districts, setDistricts] = useState([]);
  const [sectors, setSectors] = useState([]);
  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");

  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleProvinceChange = (e) => {
    const province = e.target.value;
    setSelectedProvince(province);
    const found = locationData.provinces.find((p) => p.name === province);
    setDistricts(found ? found.districts : []);
    setSelectedDistrict("");
    setSectors([]);
    setFormData({ ...formData, sector: "" });
  };

  const handleDistrictChange = (e) => {
    const district = e.target.value;
    setSelectedDistrict(district);
    const found = districts.find((d) => d.name === district);
    setSectors(found ? found.sectors : []);
    setFormData({ ...formData, sector: "" });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const userString = localStorage.getItem("user");
    if (!userString) {
      setError("You must be logged in to register recipients.");
      return;
    }

    const user = JSON.parse(userString);

    try {
      setIsLoading(true);
      console.log("📨 Submitting recipient form data:", formData);
      console.log("👤 User ID being sent in headers:", user.id);

      const response = await axios.post(
        "http://localhost:5000/api/RecipientsRoutes/register-recipient",
        formData,
        {
          headers: { "user-id": user.id },
        }
      );

      console.log("✅ Server response:", response.data);

      setSuccess("✅ Recipient registered successfully!");
      setFormData({
        full_name: "",
        phone: "",
        email: "",
        recipient_type: "Farmer",
        sector: "",
      });
      setSelectedProvince("");
      setSelectedDistrict("");
      setDistricts([]);
      setSectors([]);
    } catch (err) {
      console.error("❌ Error registering recipient:", err.response || err);
      setError(err.response?.data?.error || "❌ Failed to register recipient.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="register-form-container">
      <h2>📨 Register Flood Alert Recipient</h2>

      <form onSubmit={handleSubmit} className="register-form">
        <label>
          Full Name:
          <input
            type="text"
            name="full_name"
            value={formData.full_name}
            onChange={handleChange}
            required
          />
        </label>

        <label>
          Phone Number:
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            required
          />
        </label>

        <label>
          Email Address:
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </label>

        <label>
          Recipient Type:
          <select
            name="recipient_type"
            value={formData.recipient_type}
            onChange={handleChange}
          >
            {recipientTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>

        <label>
          Province:
          <select value={selectedProvince} onChange={handleProvinceChange} required>
            <option value="">-- Select Province --</option>
            {locationData.provinces.map((p) => (
              <option key={p.name} value={p.name}>
                {p.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          District:
          <select value={selectedDistrict} onChange={handleDistrictChange} required>
            <option value="">-- Select District --</option>
            {districts.map((d) => (
              <option key={d.name} value={d.name}>
                {d.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          Sector:
          <select name="sector" value={formData.sector} onChange={handleChange} required>
            <option value="">-- Select Sector --</option>
            {sectors.map((s) => (
              <option key={s.name} value={s.name}>
                {s.name}
              </option>
            ))}
          </select>
        </label>

        <button type="submit" disabled={isLoading}>
          {isLoading ? "Saving..." : "Register Recipient"}
        </button>
      </form>

      {success && <p className="success-msg">{success}</p>}
      {error && <p className="error-msg">{error}</p>}
    </div>
  );
};

export default RegisterRecipientPage;
