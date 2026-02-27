import { pool } from "../db.js";
import { decryptPrivateKey } from "../utils/crypto.util.js";
import { signDocument } from "../utils/sign.util.js";
import crypto from "crypto";

export const signPdf = async (req, res) => {
  // Assuming req.user is populated by your JWT middleware
  const userId = req.user.id; 
  const { password } = req.body; 
  
  // Assuming you are using a package like 'multer' to handle PDF uploads
  const documentBuffer = req.file.buffer; 

  if (!password || !documentBuffer) {
    return res.status(400).json({ message: "Password and document are required." });
  }

  try {
    // 1. Fetch the user's encrypted private key from the database
    const userResult = await pool.query(
      "SELECT encrypted_private_key FROM users WHERE id = $1",
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const { encrypted_private_key } = userResult.rows[0];

    // 2. Decrypt the private key using the provided password
    let decryptedBase64Key;
    try {
      decryptedBase64Key = decryptPrivateKey(encrypted_private_key, password);
    } catch (error) {
      // If decryption fails, it means they typed the wrong password
      return res.status(401).json({ message: "Invalid password for signing" });
    }

    // 3. Cryptographically sign the document
    const signatureBase64 = await signDocument(decryptedBase64Key, documentBuffer);

    // 4. (Optional but recommended) Calculate the document hash to store alongside the signature
    // This makes verifying the document later much easier.
    const documentHash = crypto.createHash('sha256').update(documentBuffer).digest('hex');

    // 5. Store the signature in the database
    await pool.query(
      "INSERT INTO signatures (user_id, document_hash, signature_value) VALUES ($1, $2, $3)",
      [userId, documentHash, signatureBase64]
    );

    // 6. Memory Cleanup (Crucial for security)
    decryptedBase64Key = null; 

    res.status(200).json({ 
      message: "Document signed successfully",
      signatureId: documentHash // Returning the hash as a reference
    });

  } catch (err) {
    console.error("Signing error:", err);
    res.status(500).json({ message: "Failed to sign document" });
  }
};