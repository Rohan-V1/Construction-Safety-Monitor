const express = require("express");
const pool = require("../services/db");

const router = express.Router();

// Get latest analytics
router.get("/latest", async (req, res) => {
  const { rows } = await pool.query(
    "SELECT * FROM safety_analytics ORDER BY created_at DESC LIMIT 1"
  );
  res.json(rows[0]);
});

module.exports = router;
