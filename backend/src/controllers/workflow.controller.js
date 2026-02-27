import Workflow from "../models/workflow.model.js";
import { notifyNextAvailableSigners } from "../services/email.service.js";
import crypto from 'crypto';
import path from "path";
import fs from 'fs';
import { generateSignedPdfBuffer } from '../utils/pdf.util.js';

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
            signers
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

        const pdfBuffer = await generateSignedPdfBuffer(flow.pdfPath, flow.signers,flow._id);

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