document.getElementById('generateBtn').addEventListener('click', async () => {
    const status = document.getElementById('status');
    const pdfUpload = document.getElementById('pdfUpload').files[0];
    const fontUpload = document.getElementById('fontUpload').files[0];
    const namesText = document.getElementById('namesList').value;

    // Basic validation
    if (!pdfUpload || !namesText.trim()) {
        status.innerText = "Please upload a PDF template and enter at least one name.";
        return;
    }

    status.innerText = "Processing... this might take a moment depending on the list size.";

    try {
        // 1. Read the uploaded PDF into memory
        const pdfBytes = await pdfUpload.arrayBuffer();

        // 2. Initialize the blank master document that the user will eventually download
        const masterPdf = await PDFLib.PDFDocument.create();

        // 3. Register Fontkit (allows custom font parsing)
        masterPdf.registerFontkit(window.fontkit);

        // 4. Handle Font Logic
        let customFont;
        if (fontUpload) {
            const fontBytes = await fontUpload.arrayBuffer();
            customFont = await masterPdf.embedFont(fontBytes);
        } else {
            // Default fallback if they don't upload a font file
            customFont = await masterPdf.embedFont(PDFLib.StandardFonts.Helvetica);
        }

        // 5. Load the user's template PDF
        const templatePdf = await PDFLib.PDFDocument.load(pdfBytes);

        // 6. Process the names
        const names = namesText.split('\n').filter(name => name.trim() !== '');

        for (const name of names) {
            // Copy the first page of the template for the current name
            const [copiedPage] = await masterPdf.copyPages(templatePdf, [0]);

            // ⚠️ IMPORTANT: You will need to adjust X, Y, and Size for your specific PDF!
            // In pdf-lib, the Y coordinate starts at 0 from the BOTTOM of the page.
            copiedPage.drawText(name.trim(), {
                x: 250,
                y: 400,
                size: 32,
                font: customFont,
                color: PDFLib.rgb(0, 0, 0), // Black text
            });

            // Add the stamped page to the master document
            masterPdf.addPage(copiedPage);
        }

        // 7. Save the master document to raw bytes
        const finalPdfBytes = await masterPdf.save();

        // 8. Calculate file size and update UI
        const mbSize = (finalPdfBytes.byteLength / (1024 * 1024)).toFixed(2);
        status.innerText = `Done! Final size: ${mbSize} MB. Downloading now...`;

        // 9. Trigger the browser download
        const blob = new Blob([finalPdfBytes], { type: "application/pdf" });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = "Combined_Certificates.pdf";
        link.click();

        // Clean up the memory
        URL.revokeObjectURL(link.href);

    } catch (error) {
        console.error("Error generating PDF:", error);
        status.innerText = "An error occurred. Check the browser's developer console for details.";
    }
});