import crypto from 'crypto';

const verifySign = ({ pdfHash, signature, publicKey }) => {
    try {
        // const { pdfHash, signature, publicKey } = req.body;
        console.log('friends################################################################3')
        const hashBuffer = Buffer.from(pdfHash, 'hex');
        const signatureBuffer = Buffer.from(signature, 'base64');
        // 1. Decode the Base64 JWK public key string
        const decodedJWKString = Buffer.from(publicKey, 'base64').toString('utf8');
        const jwkObject = JSON.parse(decodedJWKString);

        // 2. Create the KeyObject from JWK
        const keyObject = crypto.createPublicKey({
            key: jwkObject,
            format: 'jwk'
        });

        return crypto.verify(
            'sha256',
            hashBuffer,
            {
                key: keyObject,
                padding: crypto.constants.RSA_PKCS1_PADDING
            },
            signatureBuffer
        );

    } catch (error) {

        console.log('wrong still')
        console.log(error);
        return false;
    }
};

export default verifySign;