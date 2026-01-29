# PDF Editor - Frontend

A React-based frontend application for PDF editing and manipulation built with Vite.

## Features

- **Authentication**: Login and signup functionality with protected routes
- **PDF Editing**: Change fonts, add watermarks, and edit scanned documents
- **Document Processing**: Summarize and translate PDF content
- **E-Signature**: Add digital signatures to PDFs
- **Responsive UI**: Modern component-based architecture

## Tech Stack

- **React 18** with Vite
- **Axios** for API communication
- **ESLint** for code quality
- **CSS** for styling

## Project Structure

```
src/
├── api/              # API configuration (axios)
├── components/       # Reusable UI components
├── pages/           # Page components (Login, Dashboard, etc.)
├── routes/          # Route protection logic
├── App.jsx          # Main app component
└── main.jsx         # Entry point
```

## Installation

```bash
npm install
```

## Development

```bash
npm run dev
```

## Build

```bash
npm run build
```

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint