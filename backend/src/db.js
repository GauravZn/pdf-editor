import pg from "pg"; //We import the pg package to interact with PostgreSQL databases.

const { Pool } = pg; //We extract the Pool class from the pg package, which manages a pool of database connections. 

console.log("DATABASE_URL =", process.env.DATABASE_URL);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// simple test query to verify the connection with the database.
// gets executed immediately and only once when the db.js file is imported for the first time.

pool.query("SELECT 1")
  .then(() => console.log("PostgreSQL connected successfully"))
  .catch((err) => {
    console.error("PostgreSQL connection failed");
    console.error(err.message);
  });

export default pool;