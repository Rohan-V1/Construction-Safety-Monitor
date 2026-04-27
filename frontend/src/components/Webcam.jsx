import { useEffect, useRef } from "react";

export default function Webcam({ onFrame }) {
  const videoRef = useRef(null);

  // Start webcam
  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        videoRef.current.srcObject = stream;
      })
      .catch((err) => console.error("Webcam error:", err));
  }, []);

  // Capture frame every 600ms (~1.5 FPS)
  useEffect(() => {
    const interval = setInterval(() => {
      if (!videoRef.current) return;

      const canvas = document.createElement("canvas");
      canvas.width = 640;
      canvas.height = 480;

      const ctx = canvas.getContext("2d");
      ctx.drawImage(videoRef.current, 0, 0, 640, 480);

      canvas.toBlob((blob) => {
        if (blob) onFrame(blob);
      }, "image/jpeg");
    }, 600);

    return () => clearInterval(interval);
  }, [onFrame]);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      width={640}
      height={480}
      style={{ display: "block" }}
    />
  );
}
