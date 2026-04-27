import { useState } from "react";
import Upload from "./components/Upload";
import Webcam from "./components/Webcam";
import CanvasOverlay from "./components/CanvasOverlay";
import "./index.css";
import AnalyticsPanel from "./components/AnalyticsPanel";
import AnalyticsDashboard from "./components/AnalyticsDashboard";



function App() {
  const [mode, setMode] = useState("upload");
  const [imageSrc, setImageSrc] = useState(null);

  const sendFrame = async (blob) => {
    const formData = new FormData();
    formData.append("file", blob);

    await fetch("http://localhost:5000/detect", {
      method: "POST",
      body: formData
    });
  };

  return (
    <div className="page">
      <div className="card">
        {/* HEADER */}
        <div className="header">
          <h1>Construction Safety Monitor</h1>
          <p>AI-Powered PPE Detection System</p>
        </div>

        {/* MODE SWITCH */}
        <div className="mode-switch">
          <button
            className={mode === "upload" ? "primary" : "secondary"}
            onClick={() => setMode("upload")}
          >
            Image Upload
          </button>
          <button
            className={mode === "webcam" ? "primary" : "secondary"}
            onClick={() => setMode("webcam")}
          >
            Live Webcam
          </button>
        </div>

        {/* CONTENT */}
        <div className="content">
          {mode === "upload" && (
            <>
              <Upload onPreview={setImageSrc} />
              {imageSrc && (
                <div className="viewer">
                  <img
                    src={imageSrc}
                    width={640}
                    style={{ height: "auto" }}
                    onLoad={() =>
                      window.dispatchEvent(new Event("resize"))
                    }
                  />
                  <CanvasOverlay />
                </div>
              )}
            </>
          )}

          {mode === "webcam" && (
            <div className="viewer">
              <Webcam onFrame={sendFrame} />
              <CanvasOverlay />
            </div>
          )}
        </div>
        <AnalyticsPanel />

        <AnalyticsDashboard />



        {/* FOOTER */}
        <div className="footer">
          Hackathon Project • YOLOv8 • Real-Time AI Safety
        </div>
      </div>
    </div>
  );
}

export default App;
