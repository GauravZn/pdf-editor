import dotenv from "dotenv";
dotenv.config(); 

import pkg from "pg";
const { Pool } = pkg;

console.log("DATABASE_URL =", process.env.DATABASE_URL);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});


pool.query("SELECT 1")
  .then(() => console.log("PostgreSQL connected successfully"))
  .catch((err) => {
    console.error("PostgreSQL connection failed");
    console.error(err.message);
  });

export default pool;