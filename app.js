// Handle Font Uploads
const fontUploadInput = document.getElementById('fontUpload');
const fontSelect = document.getElementById('fontSelect');
let uploadedFonts = {};

fontUploadInput.addEventListener('change', (event) => {
    const files = event.target.files;
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

// Helper Function for Date/Time
function getFormattedTimestamp() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;
}

// Core Generation Function
async function generateCertificates(isPreviewMode) {
    const status = document.getElementById('status');
    const pdfUpload = document.getElementById('pdfUpload').files[0];
    const namesText = document.getElementById('namesList').value;
    const selectedFontName = fontSelect.value;
    const yCoordInput = parseInt(document.getElementById('yCoordinate').value, 10);

    if (!pdfUpload || !namesText.trim()) {
        status.innerText = "Error: Please upload a PDF template and enter at least one name.";
        return;
    }

    status.innerText = isPreviewMode ? "Generating full preview... (this may take a moment for large lists)" : "Processing all certificates for download...";

    try {
        const pdfBytes = await pdfUpload.arrayBuffer();
        const masterPdf = await PDFLib.PDFDocument.create();
        masterPdf.registerFontkit(window.fontkit);

        let customFont;
        if (selectedFontName !== 'default' && uploadedFonts[selectedFontName]) {
            const fontBytes = await uploadedFonts[selectedFontName].arrayBuffer();
            customFont = await masterPdf.embedFont(fontBytes);
        } else {
            customFont = await masterPdf.embedFont(PDFLib.StandardFonts.Helvetica);
        }

        const templatePdf = await PDFLib.PDFDocument.load(pdfBytes);
        
        // Split names and remove empty lines
        let names = namesText.split('\n').filter(name => name.trim() !== '');
        
        const fontSize = 36; 

        // Generate ALL pages, whether preview or final download
        for (const name of names) {
            const cleanName = name.trim();
            const [copiedPage] = await masterPdf.copyPages(templatePdf, [0]);

            // DYNAMIC AUTO-CENTERING (X-Axis)
            const textWidth = customFont.widthOfTextAtSize(cleanName, fontSize);
            const pageWidth = copiedPage.getWidth();
            const xCoordinate = (pageWidth - textWidth) / 2;

            // DRAW TEXT
            copiedPage.drawText(cleanName, {
                x: xCoordinate,
                y: yCoordInput, 
                size: fontSize,
                font: customFont,
                color: PDFLib.rgb(0.2, 0.2, 0.2), 
            });

            masterPdf.addPage(copiedPage);
        }

        const finalPdfBytes = await masterPdf.save();
        const blob = new Blob([finalPdfBytes], { type: "application/pdf" });
        const blobUrl = URL.createObjectURL(blob);

        if (isPreviewMode) {
            // Push to the iframe
            document.getElementById('previewFrame').src = blobUrl;
            status.innerText = `Full preview ready! (${names.length} pages generated) Scroll through the PDF on the right.`;
            // Reveal the download button now that they have previewed it
            document.getElementById('downloadBtn').style.display = "block";
        } else {
            // Trigger actual download with dynamic filename
            const mbSize = (finalPdfBytes.byteLength / (1024 * 1024)).toFixed(2);
            status.innerText = `Done! Final size: ${mbSize} MB. Downloading now...`;
            
            const timestamp = getFormattedTimestamp();
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = `certificates_${timestamp}.pdf`;
            link.click();
            URL.revokeObjectURL(link.href);
        }

    } catch (error) {
        console.error("Error generating PDF:", error);
        status.innerText = "An error occurred. Check console for details.";
    }
}

// Event Listeners
document.getElementById('previewBtn').addEventListener('click', () => {
    generateCertificates(true); // true = Preview Mode
});

document.getElementById('downloadBtn').addEventListener('click', () => {
    generateCertificates(false); // false = Production Mode (Download All)
});