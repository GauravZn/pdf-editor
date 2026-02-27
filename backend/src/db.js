import dotenv from "dotenv";
dotenv.config(); 
import mongoose from "mongoose";


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



  const connectDB = async () => {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/signature_finale');
        console.log("✅ Connected to the mongoose DB.");
    } catch (err) {
        console.error("❌ Connection error ->", err);
        process.exit(1); // Stop the app if the DB fails
    }
  };

export {pool, connectDB};