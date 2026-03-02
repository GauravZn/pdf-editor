import express from 'express';
import  upload  from '../middlewares/upload.middleware.js';
import { saveWorkflow, signStep, streamUpdatedPdf,renderDocument, viewPdf, getWorkflowMeta,getMyWorkflows, sealDocument } from '../controllers/workflow.controller.js';
import { signPdf } from '../controllers/signature.controller.js';
import verifyToken from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/save-flow',verifyToken, upload.single('file'), saveWorkflow);
router.get('/my-workflows', verifyToken, getMyWorkflows);
router.post('/sign-step', signStep);
router.post("/sign", verifyToken, upload.single("document"), signPdf);
router.get('/workflow/:workflowId', getWorkflowMeta);
router.get('/view-pdf/:workflowId', viewPdf);
router.get('/render-document/:workflowId', renderDocument);
router.post('/seal', sealDocument)

export default router;