import { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';

// --- CRITICAL FIX ---
// This explicitly tells the browser where to find the PDF worker file.
// Without this, the preview will always fail.
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

export default function PdfPreview({ file }) {
  const [numPages, setNumPages] = useState(null);

  function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages);
  }

  return (
    <div className="bg-gray-900 p-6 rounded-xl border border-gray-800 shadow-2xl flex flex-col items-center mt-6">
      <h3 className="text-xl font-bold text-white mb-6">Document Preview</h3>
      
      <Document
        file={file}
        onLoadSuccess={onDocumentLoadSuccess}
        loading={<div className="text-indigo-400 animate-pulse">Loading Pages...</div>}
        error={
          <div className="text-red-500 bg-red-500/10 p-4 rounded text-center">
             ❌ Failed to load PDF.<br/>
             <span className="text-sm text-red-400">Ensure pdfjs-dist matches react-pdf version.</span>
          </div>
        }
        className="flex flex-col gap-4 items-center w-full"
      >
        {/* Render only the first 3 pages to save performance, or remove slice to show all */}
        {Array.from(new Array(numPages), (el, index) => (
          <div key={`page_${index + 1}`} className="relative group">
            <Page 
              pageNumber={index + 1} 
              width={500} 
              renderTextLayer={false} 
              renderAnnotationLayer={false}
              className="rounded-lg shadow-lg border border-gray-700" 
            />
            <span className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
              Page {index + 1}
            </span>
          </div>
        ))}
      </Document>
    </div>
  );
}