const express = require("express");
const multer = require("multer");
const { runYOLO } = require("../services/yoloService");
const pool = require("../services/db");

const upload = multer({ dest: "uploads/" });

module.exports = (io) => {
  const router = express.Router();

  router.post("/", upload.single("file"), async (req, res) => {
    try {
      console.log("File received:", req.file);

      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const result = await runYOLO(req.file.path);

      // Existing emits (UNCHANGED)
      io.emit("detections", result.detections);
      io.emit("analytics", result.analytics);

      // ⭐ ADDED: Store analytics in Neon DB
      const a = result.analytics;
      await pool.query(
        `INSERT INTO safety_analytics
         (people_count, violations, helmet_missing, vest_missing, compliance_rate)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          a.people_count,
          a.violations,
          a.helmet_missing,
          a.vest_missing,
          a.compliance_rate
        ]
      );

      res.json({ success: true, result });

    } catch (err) {
      console.error("DETECTION ERROR:", err);
      res.status(500).json({ error: err.message });
    }
  });

  return router;
};
