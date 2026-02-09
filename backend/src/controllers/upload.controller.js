import pool from '../db.js';
import { generateFileHash } from '../utils/hash.util.js';

export const uploadPDF = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file provided' });
  }

  try {
    const fileHash = await generateFileHash(req.file.path);
    const { filename, path } = req.file;

    await pool.query(
      `INSERT INTO documents (file_hash, file_path, filename) 
       VALUES ($1, $2, $3) 
       ON CONFLICT (file_hash) DO NOTHING`, 
      [fileHash, path, filename]
    );


    res.status(200).json({
      message: 'Success',
      hash: fileHash,
      filename: req.file.filename
    });
  } catch (error) {
    res.status(500).json({ error: 'Hash calculation failed' });
  }
};