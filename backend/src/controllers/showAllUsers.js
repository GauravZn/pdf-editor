import pool from "../db.js";
const showAllUsers = async (req, res) => {
    try {
        // We fetch id, username, email, and public_key
        // We do NOT fetch the password for security reasons
        const query = `
            SELECT id, username, email, public_key 
            FROM users 
            ORDER BY created_at DESC
        `;

        const { rows } = await pool.query(query);

        res.status(200).json(rows);
    } catch (err) {
        console.error("Database error:", err.message);
        res.status(500).json({ error: "Failed to fetch users" });
    }
}

export default showAllUsers