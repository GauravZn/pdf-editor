import Workflow from "../models/workflow.model.js";
import { notifyNextAvailableSigners } from "../services/email.service.js";
import crypto from 'crypto';
import path from "path";
import fs from 'fs';
import bcrypt from "bcrypt"
import { pool } from "../db.js";
import { encryptPrivateKey, decryptPrivateKey } from "../utils/crypto.util.js";
import generateKeys from "../utils/generateKeyPair.util.js";
import { generateSignedPdfBuffer } from '../utils/pdf.util.js';
import { signDocument } from "../utils/sign.util.js";

export const streamUpdatedPdf = async (req, res) => {
    try {
        const { workflowId } = req.params;
        const flow = await Workflow.findById(workflowId);

        if (!flow) return res.status(404).send("Document not found");

        // Generate the PDF buffer with the latest MongoDB data
        const pdfBuffer = await generateSignedPdfBuffer(flow.pdfPath, flow.signers, flow._id);

        res.contentType("application/pdf");
        res.send(Buffer.from(pdfBuffer));
    } catch (error) {
        res.status(500).send("Error rendering PDF");
    }
};


export const saveWorkflow = async (req, res) => {
    try {
        const file = req.file;
        if (!file) {
            return res.status(400).json({ message: "No PDF file received." });
        }

        //Recover data from FormData strings
        const title = file.originalname || "doc";
        const signers = JSON.parse(req.body.signers);

        const fileBuffer = fs.readFileSync(file.path);
        const pdfHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');


        //Save to DB 
        const newFlow = new Workflow({
            title,
            pdfPath: file.path,
            pdfHash,
            signers,
            senderId: req.user.id
        });

        await newFlow.save();

        //Send the first email
        await notifyNextAvailableSigners(newFlow._id, 0);

        res.status(201).json({
            message: "Workflow initiated successfully!",
            id: newFlow._id,
            hash: pdfHash
        });
    } catch (error) {
        console.error("Save Workflow Error:", error);
        res.status(500).json({ error: error.message });
    }
};

export const signStep = async (req, res) => {
    try {
        const { workflowId, signerId, fieldsData } = req.body;
        const currentWorkflow = await Workflow.findById(workflowId);

        const signer = currentWorkflow.signers.id(signerId);
        if (!signer) return res.status(404).json({ message: "Signer not found" });

        if (fieldsData && fieldsData.length > 0) {
            fieldsData.forEach(data => {
                const field = signer.fields.find(f => f.id === data.fieldId);
                if (field) {
                    field.value = data.value;
                    field.color = data.color;
                    field.font = data.font;
                    if (data.type) field.type = data.type;
                }
            });
        }

        signer.status = 'completed';
        signer.signedAt = new Date();

        currentWorkflow.markModified('signers');

        // 1. SAVE THE WORKFLOW FIRST so the database knows this signer is 'completed'
        await currentWorkflow.save();

        // 2. CHECK IF OTHERS IN THE SAME STEP ARE PENDING
        const currentStep = signer.seq;
        const othersInStep = currentWorkflow.signers.filter(
            s => s.seq === currentStep && s.status !== 'completed'
        );

        // 3. IF EVERYONE IN THIS STEP IS DONE, TRIGGER THE NEXT EMAIL!
        if (othersInStep.length === 0) {
            console.log(`Step ${currentStep} completed. Triggering emails for the next sequence...`);
            await notifyNextAvailableSigners(workflowId, currentStep);
        }

        res.status(200).json({ message: "Signed successfully!" });
    } catch (error) {
        console.error("Sign Step Error:", error);
        res.status(500).json({ error: error.message });
    }
};


export const renderDocument = async (req, res) => {
    try {
        const { workflowId } = req.params;
        const flow = await Workflow.findById(workflowId);

        if (!flow) return res.status(404).send("Document not found");

        const pdfBuffer = await generateSignedPdfBuffer(flow.pdfPath, flow.signers, flow._id);

        res.contentType("application/pdf");
        res.send(Buffer.from(pdfBuffer));
    } catch (error) {
        console.error("❌ CONTROLLER RENDER ERROR:", error);
        res.status(500).send("Error generating PDF");
    }
};


export const getWorkflowMeta = async (req, res) => {
    try {
        const { workflowId } = req.params;

        const flow = await Workflow.findById(workflowId);

        if (!flow) {
            return res.status(404).json({ message: "Document not found in DB" });
        }

        res.json(flow);
    } catch (err) {
        console.error("Database Error:", err);
        res.status(500).json({ error: "Server crashed while fetching workflow" });
    }
};

export const viewPdf = async (req, res) => {
    try {
        const workflow = await Workflow.findById(req.params.workflowId);

        if (!workflow) {
            return res.status(404).json({ message: "Workflow not found" });
        }

        const filePath = path.resolve(workflow.pdfPath);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.sendFile(filePath);

        console.log('PDF Streamed successfully for:', workflow.title);
    } catch (error) {
        console.error("View PDF Error:", error);
        res.status(500).json({ message: "Could not stream PDF" });
    }
};


export const sealDocument = async (req, res) => {
    const { workflowId, signerId, fieldsData, password, termsAccepted } = req.body;

    try {
        const workflow = await Workflow.findById(workflowId);
        const signer = workflow.signers.id(signerId);
        if (!signer) return res.status(404).json({ message: "Signer not found" });

        const email = signer.email;
        let decryptedBase64Key;
        let userId;


        // --- 1. IDENTITY & CRYPTOGRAPHY ---
        const userCheck = await pool.query("SELECT * FROM users WHERE email = $1", [email]);

        if (userCheck.rows.length === 0) {
            return res.status(404).json({ message: "User not registered. Please sign up first." });
        }

        const user = userCheck.rows[0];
        userId = user.id;

        // Strict password check! Fake passwords will fail right here.
        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.status(401).json({ message: "Invalid password." });

        try {
            decryptedBase64Key = decryptPrivateKey(user.encrypted_private_key, password);
        } catch (e) {
            return res.status(401).json({ message: "Failed to unlock signature key." });
        }

        // --- 2. SAVE VISUALS TO MONGODB ---
        if (fieldsData && fieldsData.length > 0) {
            fieldsData.forEach(data => {
                const field = signer.fields.find(f => f.id === data.fieldId);
                if (field) {
                    field.value = data.value; field.color = data.color;
                    field.font = data.font; if (data.type) field.type = data.type;
                }
            });
        }
        signer.status = 'completed';
        signer.signedAt = new Date();
        workflow.markModified('signers');
        await workflow.save();

        // --- 3. CRYPTOGRAPHIC SEAL TO POSTGRES ---
        const pdfBuffer = await generateSignedPdfBuffer(workflow.pdfPath, workflow.signers, workflow._id);
        const signatureBase64 = await signDocument(decryptedBase64Key, pdfBuffer);
        const documentHash = crypto.createHash('sha256').update(pdfBuffer).digest('hex');

        await pool.query(
            "INSERT INTO signatures (user_id, document_hash, signature_value) VALUES ($1, $2, $3)",
            [userId, documentHash, signatureBase64]
        );

        // --- 4. TRIGGER NEXT EMAILS ---
        const currentStep = signer.seq;
        const othersInStep = workflow.signers.filter(s => s.seq === currentStep && s.status !== 'completed');
        if (othersInStep.length === 0) {
            await notifyNextAvailableSigners(workflowId, currentStep);
        }

        res.status(200).json({ message: "Document cryptographically sealed!" });

    } catch (error) {
        console.error("Seal Error:", error);
        res.status(500).json({ message: "Fatal error sealing document." });
    }
};


export const getMyWorkflows = async (req, res) => {
    try {
        const flows = await Workflow.find({ senderId: req.user.id }).sort({ createdAt: -1 });
        res.json(flows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};