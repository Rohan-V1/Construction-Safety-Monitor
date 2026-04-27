import { useEffect, useState } from "react";
import { socket } from "../socket";

export default function LiveCamera() {
  const [violations, setViolations] = useState([]);

  useEffect(() => {
    socket.on("detections", data => {
      const v = data.filter(d => d.violation);
      setViolations(v);
    });

    return () => socket.off("detections");
  }, []);

  return (
    <div>
      <h2>🚧 Live PPE Violations</h2>

      {violations.length === 0 && <p>✅ All workers compliant</p>}

      {violations.map((v, i) => (
        <div key={i} style={{ color: "red" }}>
          ❌ Missing PPE detected
        </div>
      ))}
    </div>
  );
}
