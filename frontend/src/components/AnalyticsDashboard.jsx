import { useEffect, useState } from "react";

export default function AnalyticsDashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch("http://localhost:5000/analytics/latest")
      .then(res => res.json())
      .then(setData);
  }, []);

  if (!data) return null;

  return (
    <div style={styles.card}>
      <h3>Safety Analytics</h3>
      <p>👷 People in Frame: {data.people_count}</p>
      <p>🚨 Violations: {data.violations}</p>
      <p>⛑ Helmet Missing: {data.helmet_missing}</p>
      <p>🦺 Vest Missing: {data.vest_missing}</p>
      <p>✅ Compliance: {data.compliance_rate}%</p>
      <small>
        Last updated: {new Date(data.created_at).toLocaleString()}
      </small>
    </div>
  );
}

const styles = {
  card: {
    marginTop: 20,
    padding: 16,
    background: "#111827",
    color: "white",
    borderRadius: 10,
    textAlign: "left"
  }
};
