import pool from "../db.js";
const userHistory = async (req, res) => {

    const { username } = req.user; // Get from JWT/Auth middleware

    try {
        const query = `
            SELECT 
                audit.signature, 
                audit.timestamp, 
                audit.file_hash,
                docs.filename
            FROM signatures_audit AS audit
            INNER JOIN documents AS docs ON audit.file_hash = docs.file_hash
            WHERE audit.username = $1
            ORDER BY audit.timestamp DESC
        `;

        const result = await pool.query(query, [username]);

        // This returns rows that contain BOTH signature info and the filename for the link
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Could not retrieve history" });
    }

}

export default userHistory