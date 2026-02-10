import express from "express"
import crypto from "crypto"
import pool from "../db.js"
import verifySign from "./verifySign.util.js"

const saveSign = async (req, res) => {
    const client = await pool.connect();
    try {
        // We use a TRANSACTION to ensure both tables stay in sync
        // await pool.query('BEGIN');
        // console.log(req)


        const { sign, pdfHash } = req.body;
        const { username, email } = req.user

        const userRes = await client.query('SELECT public_key FROM users WHERE username = $1', [username]);

        if (userRes.rows.length === 0) return res.status(404).json({ error: "User not found" });

        const base64Key = userRes.rows[0].public_key;

        const isValid = verifySign({ pdfHash: pdfHash, signature: sign, publicKey: base64Key })
        // console.log('linking part')
        
        if (isValid) {
            console.log("Verification Successful!");

        } else {
            console.log('something went wrong.Please log in with YOUR OWN ACCOUNT TO SIGN A PDF.')
            return res.status(401).json({ error: "Invalide Signature" });
        }

        const signatureObject = {
            signer_username: username, 
            signer_email: email,       
            signature: sign,           
            timestamp: new Date().toISOString() 
        };

        await client.query('BEGIN')

        const result = await client.query(`UPDATE documents 
                                            SET signatures = signatures || $1::jsonb 
                                            WHERE file_hash = $2 
                                            AND NOT (signatures @> $3::jsonb)`
                                            ,
            [JSON.stringify(signatureObject), pdfHash, JSON.stringify([{ signer_username: username }])]);


        if (result.rowCount === 0) {
            await client.query('ROLLBACK')

            return res.status(409).json({
                error: "Duplicate signature",
                message: "You have already signed this document."
            });
        }

        await client.query(`INSERT INTO signatures_audit (username, email, file_hash, signature, timestamp)
             VALUES ($1, $2, $3, $4, $5)`,
            [username, email, pdfHash, sign, signatureObject.timestamp]
        );
        await client.query('COMMIT');
        res.status(200).json({ message: "Successfully signed and recorded!" });
    }
    catch (err) {
        await client.query('ROLLBACK');
        console.error("Transaction Error: ", err);
        res.status(500).json({ error: "Internal Server Error during signing" });
    } finally {
        
        client.release();
    }
}

export default saveSign