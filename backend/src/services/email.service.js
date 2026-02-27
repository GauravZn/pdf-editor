import transporter from '../config/mailer.js';
import Workflow from '../models/workflow.model.js';

export const notifyNextAvailableSigners = async (workflowId, completedSeq) => {
    try {
        const workflow = await Workflow.findById(workflowId);
        if (!workflow) return;

        const targetSeq = completedSeq + 1;
        const signersToNotify = workflow.signers.filter(s => s.seq === targetSeq && s.status === 'pending');

        for (const signer of signersToNotify) {
            const signLink = `http://localhost:5173/sign/${workflowId}/${signer._id}`;
            
            const mailOptions = {
                from: `"Document Request" <${process.env.EMAIL_USER}>`,
                to: signer.email,
                subject: `Signature Requested: ${workflow.title}`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-w: 600px; margin: 0 auto; color: #334155; line-height: 1.6;">
                        <p style="font-size: 16px;">Dear ${signer.name},</p>
                        
                        <p style="font-size: 15px;">I hope this email finds you well.</p>
                        
                        <p style="font-size: 15px;">
                            Please find the document titled <strong>"${workflow.title}"</strong>, which requires your review and signature.
                        </p>
                        
                        <p style="font-size: 15px;">
                            You can securely access and sign the document by clicking the button below:
                        </p>
                        
                        <div style="margin: 35px 0;">
                            <a href="${signLink}" style="background-color: #1e293b; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 15px;">Review & Sign Document</a>
                        </div>
                        
                        <p style="font-size: 15px;">If you have any questions or concerns, please feel free to reach out.</p>
                        
                        <p style="font-size: 15px; margin-top: 30px;">
                            Best regards,<br>
                            <strong>The Rodic Team</strong>
                        </p>
                    </div>
                `
            };

            await transporter.sendMail(mailOptions);
            console.log(`✅ Professional email sent to ${signer.email}`);
        }
    } catch (error) {
        console.error("❌ Failed to trigger emails:", error);
    }
};