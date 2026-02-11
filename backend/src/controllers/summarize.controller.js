import pool from "../db.js"
import PDFDocument from 'pdfkit';
import fs from 'fs';

const summarizeController = async (req, res) => {

    const { hash } = req.params;
    const apiKey = process.env.GEMINI_API_KEY;

    try {
        //  Get file from our database
        const result = await pool.query(
            'SELECT file_path, filename FROM documents WHERE file_hash = $1',
            [hash]
        );

        // If we don't have the file, return 'not found'
        if (result.rows.length === 0)
            return res.status(404).json({ error: 'Not found' });

        const { file_path, filename } = result.rows[0];
        const pdfBase64 = fs.readFileSync(file_path).toString("base64");

        // replace the timestamp from the pdf's name.
        const nameOnly = filename.replace(/-(\d+)(\.pdf)*$/i, "").replace(/\.pdf$/i, "");

        // console.log('nameonly->', nameOnly);


        const finalDownloadName = `Summary_${nameOnly}.pdf`;

        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

        // Prompt to get the PDF summary.
        const professionalPrompt = `
            Please provide a comprehensive and professional summary of the attached document. 
            Structure your response using the following format:
            
            1. **Executive Overview**: A 2-3 sentence high-level summary of the document's purpose.
            2. **Key Highlights**: Use bullet points to list the most critical facts, figures, or findings.
            3. **Conclusion/Action Items**: Summarize the final outcome or any next steps mentioned.
            
            Maintain a formal, objective tone. Use clear headings and ensure the information is condensed yet descriptive and preserves the original context.
        `;

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [
                        { text: professionalPrompt },
                        { inlineData: { mimeType: "application/pdf", data: pdfBase64 } }
                    ]
                }]
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("Gemini Error Detail:", data);
            return res.status(500).json({ error: "Gemini API rejected the request" });
        }

        const summaryText = data.candidates[0].content.parts[0].text;

        const doc = new PDFDocument({ margin: 50 });
        // console.log('final downlad name ---->', finalDownloadName)

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${finalDownloadName}"`);

        // Crucial: Expose the header so Axios can read it
        res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');

        // simply add the title "Summary Report"
        doc.pipe(res);
        doc.fillColor('#2563eb').fontSize(24).text(`Summary Report`, { underline: true });
        doc.moveDown(0.5);

        // Add the name of the original document.
        doc.fillColor('#4b5563').fontSize(12).text(`Document: ${nameOnly}`);

        // Add a horizontal line
        doc.moveTo(50, doc.y + 10)
            .lineTo(550, doc.y + 10)
            .strokeColor('#e5e7eb')
            .stroke();

        // Give some space before the summary starts
        doc.moveDown(2);

        const lines = summaryText.split('\n');

        lines.forEach(line => {
            let trimmedLine = line.trim();
            if (trimmedLine.length === 0) return;

            // 1. MAJOR HEADINGS (### or **Heading** or "1. Heading")
            if (trimmedLine.startsWith('###') || (trimmedLine.startsWith('**') && trimmedLine.endsWith('**')) || /^\d+\.\s/.test(trimmedLine)) {
                const cleanHeading = trimmedLine.replace(/[#\*]/g, '').trim();

                doc.moveDown(1);
                doc.fillColor('#000000')
                    .font('Helvetica-Bold') // Set Bold
                    .fontSize(14)
                    .text(cleanHeading);
                doc.moveDown(0.5);
                doc.font('Helvetica'); // Immediate reset to Regular
            }

            //  BULLET POINTS WITH BOLD LABELS
            else if (trimmedLine.startsWith('* ') || trimmedLine.startsWith('- ')) {
                const cleanLine = trimmedLine.replace(/^[\*\-]\s/, '').replace(/\*\*/g, '');
                const parts = cleanLine.split(':');

                if (parts.length > 1) {
                    const label = parts[0].trim() + ':';
                    const description = parts.slice(1).join(':').trim();

                    // Bold Label
                    doc.fillColor('#374151')
                        .font('Helvetica-Bold')
                        .fontSize(11)
                        .text(`• ${label}`, { indent: 20, continued: true });

                    // Regular Description
                    doc.font('Helvetica')
                        .text(` ${description}`, { lineGap: 5 });
                } else {
                    doc.fillColor('#374151')
                        .font('Helvetica')
                        .fontSize(11)
                        .text(`• ${cleanLine}`, { indent: 20, lineGap: 5 });
                }
            }

            // regular paragraphs
            else {
                const cleanText = trimmedLine.replace(/\*\*/g, '');
                doc.fillColor('#374151')
                    .font('Helvetica')
                    .fontSize(11)
                    .text(cleanText, { lineGap: 5, align: 'justify' });
            }
        });

        doc.end();

    } catch (error) {
        console.error("Critical Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
}

export default summarizeController