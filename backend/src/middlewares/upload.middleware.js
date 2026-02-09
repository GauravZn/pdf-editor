import multer from 'multer';
import path from 'path';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    // 1. Get the original name without the .pdf extension
    const originalName = path.parse(file.originalname).name;

    // 2. Get the extension (e.g., .pdf)
    const ext = path.extname(file.originalname);

    // 3. Combine: OriginalName-Timestamp.pdf
    const humaneName = `${originalName}-${Date.now()}${ext}`;

    cb(null, humaneName);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed!'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 1024 * 1024 * 10 } // 10MB limit
});

export default upload