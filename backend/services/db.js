const { Pool } = require("pg");

const pool = new Pool({
  connectionString:
    "postgresql://neondb_owner:npg_CLDosXh6cjQ3@ep-blue-shape-a1wjwthk-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"
});

module.exports = pool;
