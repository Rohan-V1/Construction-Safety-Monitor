import { useEffect, useState } from "react";
import { socket } from "../socket";

export default function AnalyticsPanel() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    socket.on("analytics", setStats);
    return () => socket.off("analytics");
  }, []);

  if (!stats) return null;

  return (
    <div style={styles.panel}>
      <div style={styles.item}>👷 People: {stats.people_count}</div>
      <div style={styles.item}>🚨 Violations: {stats.violations}</div>
      <div style={styles.item}>⛑ Helmet Missing: {stats.helmet_missing}</div>
      <div style={styles.item}>🦺 Vest Missing: {stats.vest_missing}</div>
      <div style={styles.item}>
        ✅ Compliance: {stats.compliance_rate}%
      </div>
    </div>
  );
}

const styles = {
  panel: {
    display: "flex",
    justifyContent: "space-around",
    background: "#111827",
    color: "white",
    padding: "12px 16px",
    borderRadius: 10,
    marginTop: 12,
    fontSize: 14
  },
  item: {
    fontWeight: 600
  }
};
