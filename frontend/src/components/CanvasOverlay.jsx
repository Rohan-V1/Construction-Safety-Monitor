import { useEffect, useRef, useState } from "react";
import { socket } from "../socket";

export default function CanvasOverlay() {
  const canvasRef = useRef(null);
  const [detections, setDetections] = useState([]);

  useEffect(() => {
    socket.on("detections", (data) => {
      setDetections(data);
    });

    return () => socket.off("detections");
  }, []);

  useEffect(() => {
    draw();
  }, [detections]);

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const img = canvas.previousSibling; // <img> or <video>
    if (!img) return;

    const ctx = canvas.getContext("2d");

    // 🔥 ACTUAL displayed size
    const displayWidth = img.clientWidth;
    const displayHeight = img.clientHeight;

    // 🔥 ORIGINAL image size (YOLO space)
    const naturalWidth = img.naturalWidth || img.videoWidth;
    const naturalHeight = img.naturalHeight || img.videoHeight;

    canvas.width = displayWidth;
    canvas.height = displayHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const scaleX = displayWidth / naturalWidth;
    const scaleY = displayHeight / naturalHeight;

    detections.forEach(det => {
      const [x1, y1, x2, y2] = det.person_bbox;

      const sx1 = x1 * scaleX;
      const sy1 = y1 * scaleY;
      const sw = (x2 - x1) * scaleX;
      const sh = (y2 - y1) * scaleY;

      // Person box
      ctx.strokeStyle = det.violation ? "red" : "green";
      ctx.lineWidth = 2;
      ctx.strokeRect(sx1, sy1, sw, sh);

      if (det.violation) {
        ctx.fillStyle = "red";
        ctx.font = "14px Arial";
        ctx.fillText("⚠ PPE VIOLATION", sx1, sy1 - 5);
      }

      // PPE boxes
      det.ppe_boxes.forEach(p => {
        const [px1, py1, px2, py2] = p.bbox;

        const psx1 = px1 * scaleX;
        const psy1 = py1 * scaleY;
        const psw = (px2 - px1) * scaleX;
        const psh = (py2 - py1) * scaleY;

        ctx.strokeStyle = "lime";
        ctx.lineWidth = 2;
        ctx.strokeRect(psx1, psy1, psw, psh);

        ctx.fillStyle = "lime";
        ctx.fillText(p.class, psx1, psy1 - 4);
      });
    });
  };

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        pointerEvents: "none"
      }}
    />
  );
}
