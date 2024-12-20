import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";

const HomePage = () => {
  const [records, setRecords] = useState([]);
  const [selectedClient, setSelectedClient] = useState("");
  const [clientDetails, setClientDetails] = useState(null);

  const fetchAirtableRecords = async () => {
    try {
      const response = await fetch("http://localhost:5000/fetch-clients");
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      const data = await response.json();
      setRecords(data);
    } catch (error) {
      console.error("Error fetching Airtable records:", error);
    }
  };

  const fetchClientDetails = async (clientName) => {
    try {
      const response = await fetch(
        `http://localhost:5000/fetch-details?name=${clientName}`
      );
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      const data = await response.json();
      setClientDetails(data);
    } catch (error) {
      console.error("Error fetching client details:", error);
    }
  };

  useEffect(() => {
    fetchAirtableRecords();
  }, []);
  return (
    <div className="container mt-5">
      <h1 className="text-center mb-4">Client Details</h1>

      <div className="mb-3">
        <select
          className="form-select"
          value={selectedClient}
          onChange={(e) => setSelectedClient(e.target.value)}
        >
          <option value="">Select Client</option>
          {records.map((record, index) => (
            <option key={index} value={record.FullName}>
              {record.FullName}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-4">
        <button
          className="btn btn-primary"
          onClick={() => fetchClientDetails(selectedClient)}
          disabled={!selectedClient}
        >
          Fetch Details
        </button>
      </div>

      {clientDetails && (
        <>
          <h3>Client Information</h3>
          <table className="table table-bordered">
            <thead>
              <tr>
                <th>Field</th>
                <th>Value</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(clientDetails[0]).map(([key, value], index) => {
                if (key === "paymentLog") return null;
                return (
                  <tr key={index}>
                    <th>{key}</th>
                    <td>
                      {typeof value === "object" && value !== null
                        ? JSON.stringify(value, null, 2)
                        : value}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {Array.isArray(clientDetails[0]?.paymentLog) &&
            clientDetails[0]?.paymentLog?.length > 0 && (
              <>
                <h3>Payment Log</h3>
                <table className="table table-bordered table-striped">
                  <thead>
                    <tr>
                      <th>Payment Amount</th>
                      <th>Payment Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clientDetails[0]?.paymentLog.map((payment, index) => (
                      <tr key={index}>
                        <td>{payment.PaymentAmount}</td>
                        <td>
                        {payment.PaymentDate ? new Date(payment.PaymentDate).toLocaleDateString() : '-'}                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
        </>
      )}
    </div>
  );
};

export default HomePage;
