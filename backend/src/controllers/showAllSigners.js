import pool from "../db.js";
const showAllSigners = async (req,res) =>{

   const hash = req.query.hash;

const { rows } = await pool.query(`
            SELECT COALESCE(signatures, '[]'::jsonb) as signatures
            FROM documents 
            WHERE file_hash = $1
        `, [hash]);

   // console.log('hash received here', hash);
   // console.log('ummm hummm', rows)
   // const signers = rows[0];
   // console.log("data we got->", signers.result.signed_by)
   // console.log("typeoooo", typeof(signers.result.signed_by))
      return res.send(rows)
}

export default showAllSigners;