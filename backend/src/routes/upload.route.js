import { Router } from 'express';
import  uploadMiddleware  from '../middlewares/upload.middleware.js';
import { uploadPDF } from '../controllers/upload.controller.js';

const router = Router();

router.post('/', uploadMiddleware.single('file'), uploadPDF);

export default router;