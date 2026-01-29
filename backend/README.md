
# PDF Editor Backend Documentation

## Overview
Backend service for a PDF editor application with authentication, e-signature, and PDF processing capabilities.

## Project Structure
```
backend/
├── .env                 # Environment variables
├── .gitignore          # Git ignore rules
├── package.json        # Dependencies & scripts
├── server.js           # Entry point
├── secure/             # Security configs & keys
├── src/
│   ├── db.js          # Database connection
│   ├── controllers/    # Business logic
│   ├── middlewares/    # Auth & custom middlewares
│   ├── routes/        # API endpoints
│   └── utils/         # Utility functions
└── uploads/           # File storage (e-signatures, PDFs)
```

## Setup

1. **Install dependencies**
    ```bash
    npm install
    ```

2. **Configure environment**
    - Copy `.env` and add required variables

3. **Start server**
    ```bash
    npm start
    ```

## API Routes
- **Auth**: `/auth` - Login, registration
- **E-sign**: `/esign` - Digital signatures
- **PDF**: `/pdf` - PDF operations

## Key Features
- User authentication via middleware
- Public key registry for security
- E-signature support
- PDF upload & processing
