import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const transporter = nodemailer.createTransport({
    host: "smtp.office365.com",
    port: 587,
    secure: false, 
    auth: {
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS  
    },
    tls: {
        ciphers: 'SSLv3',
        rejectUnauthorized: false 
    }
});

// Verify connection
transporter.verify((error, success) => {
    if (error) {
        console.log("❌ Outlook Mailer Error:", error);
    } else {
        console.log("📧 Outlook Mailer is ready");
    }
});

export default transporter;