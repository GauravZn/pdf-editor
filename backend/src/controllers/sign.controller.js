import crypto from "crypto"
import pool from "../db.js";

const signHash = (req, res) => {

    try {

        const { pdfHash, privateKey } = req.body;
        const hashBuffer = Buffer.from(pdfHash, 'hex')

        const decodedJWKString = Buffer.from(privateKey, 'base64').toString('utf8');
        const jwkObject = JSON.parse(decodedJWKString);


        const keyObject = crypto.createPrivateKey({
            key: jwkObject,
            format: 'jwk' // This tells Node to look for "kty", "n", "e", etc.
        });

        const signature = crypto.sign('sha256', hashBuffer, {
            key: keyObject,
            padding: crypto.constants.RSA_PKCS1_PADDING
        });

        return res.status(200).send({
            'message': 'You have signed the document successfully.',
            'signature': signature.toString('base64')
        });
    }
    catch (error) {
        return res.status(500).send({
            error: "JWK Import Failed",
            details: error.message
        })
    }
}

export default signHash