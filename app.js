// Handle Font Uploads to populate the dropdown
const fontUploadInput = document.getElementById('fontUpload');
const fontSelect = document.getElementById('fontSelect');
let uploadedFonts = {}; // Store font files by name

fontUploadInput.addEventListener('change', (event) => {
    const files = event.target.files;
    
    // Clear existing custom options, keep default
    fontSelect.innerHTML = '<option value="default">Default (Helvetica)</option>';
    uploadedFonts = {};

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        uploadedFonts[file.name] = file;
        
        const option = document.createElement('option');
        option.value = file.name;
        option.text = file.name;
        fontSelect.appendChild(option);
    }
});

document.getElementById('generateBtn').addEventListener('click', async () => {
    const status = document.getElementById('status');
    const pdfUpload = document.getElementById('pdfUpload').files[0];
    const namesText = document.getElementById('namesList').value;
    const selectedFontName = fontSelect.value;

    // Basic validation
    if (!pdfUpload || !namesText.trim()) {
        status.innerText = "Please upload a PDF template and enter at least one name.";
        return;
    }

    status.innerText = "Processing... this might take a moment depending on the list size.";

    try {
        // 1. Read the uploaded PDF into memory
        const pdfBytes = await pdfUpload.arrayBuffer();

        // 2. Initialize the blank master document
        const masterPdf = await PDFLib.PDFDocument.create();

        // 3. Register Fontkit (allows custom font parsing)
        masterPdf.registerFontkit(window.fontkit);

        // 4. Handle Font Logic based on selection
        let customFont;
        if (selectedFontName !== 'default' && uploadedFonts[selectedFontName]) {
            const fontBytes = await uploadedFonts[selectedFontName].arrayBuffer();
            customFont = await masterPdf.embedFont(fontBytes);
        } else {
            // Default fallback
            customFont = await masterPdf.embedFont(PDFLib.StandardFonts.Helvetica);
        }

        // 5. Load the user's template PDF
        const templatePdf = await PDFLib.PDFDocument.load(pdfBytes);

        // 6. Process the names
        const names = namesText.split('\n').filter(name => name.trim() !== '');
        
        const fontSize = 36; // Adjust this size as needed

        for (const name of names) {
            const cleanName = name.trim();
            // Copy the first page of the template
            const [copiedPage] = await masterPdf.copyPages(templatePdf, [0]);

            // Calculate center alignment
            const textWidth = customFont.widthOfTextAtSize(cleanName, fontSize);
            const pageWidth = copiedPage.getWidth();
            
            // X coordinate to perfectly center the text
            const xCoordinate = (pageWidth - textWidth) / 2;
            
            // ⚠️ IMPORTANT: Y coordinate starts from the BOTTOM of the page.
            // Adjust this value (e.g., 320) up or down to hit the correct baseline.
            const yCoordinate = 320; 

            copiedPage.drawText(cleanName, {
                x: xCoordinate,
                y: yCoordinate,
                size: fontSize,
                font: customFont,
                color: PDFLib.rgb(0.2, 0.2, 0.2), // Dark grey/black text
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
