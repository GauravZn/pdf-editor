import express from 'express';
import  upload  from '../middlewares/upload.middleware.js';
import { saveWorkflow, signStep, streamUpdatedPdf,renderDocument, viewPdf, getWorkflowMeta } from '../controllers/workflow.controller.js';
import { signPdf } from '../controllers/signature.controller.js';
import verifyToken from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/save-flow', upload.single('file'), saveWorkflow);
router.post('/sign-step', signStep);
router.post("/sign", verifyToken, upload.single("document"), signPdf);
router.get('/workflow/:workflowId', getWorkflowMeta);
router.get('/view-pdf/:workflowId', viewPdf);
router.get('/render-document/:workflowId', renderDocument);

export default router;