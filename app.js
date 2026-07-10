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
    
    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"];
    const month = monthNames[now.getMonth()];
    const day = String(now.getDate()).padStart(2, '0');

    let hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'pm' : 'am';

    hours = hours % 12;
    hours = hours ? hours : 12; 

    return `${month}${day}_${hours}-${minutes}${ampm}`;
}

// Helper Function for Title Case (e.g., aMiT jena -> Amit Jena)
function formatName(name) {
    return name
        .trim()
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

// Core Generation Function
async function generateCertificates(isPreviewMode) {
    const status = document.getElementById('status');
    const pdfUpload = document.getElementById('pdfUpload').files[0];
    const namesText = document.getElementById('namesList').value;
    const selectedFontName = fontSelect.value;
    
    // Grab the new layout values from the user interface
    const fontSizeInput = parseInt(document.getElementById('fontSizeInput').value, 10);
    const xCenterInput = parseInt(document.getElementById('xCoordinate').value, 10);
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
        let rawNames = namesText.split('\n').filter(name => name.trim() !== '');

        // Generate ALL pages
        for (const rawName of rawNames) {
            const cleanName = formatName(rawName);
            const [copiedPage] = await masterPdf.copyPages(templatePdf, [0]);

            // DYNAMIC CENTER-ANCHORING 
            // 1. Measure how wide this specific name is at the chosen font size
            const textWidth = customFont.widthOfTextAtSize(cleanName, fontSizeInput);
            
            // 2. Take the user's desired center point (X) and subtract half the text width 
            // to find the exact starting coordinate for the left edge of the text.
            const calculatedLeftEdge = xCenterInput - (textWidth / 2);

            // DRAW TEXT
            copiedPage.drawText(cleanName, {
                x: calculatedLeftEdge,
                y: yCoordInput, 
                size: fontSizeInput,
                font: customFont,
                color: PDFLib.rgb(0.2, 0.2, 0.2), 
            });

            masterPdf.addPage(copiedPage);
        }

        const finalPdfBytes = await masterPdf.save();
        const blob = new Blob([finalPdfBytes], { type: "application/pdf" });
        const blobUrl = URL.createObjectURL(blob);

        if (isPreviewMode) {
            document.getElementById('previewFrame').src = blobUrl;
            status.innerText = `Full preview ready! (${rawNames.length} pages generated) Scroll through the PDF on the right.`;
            document.getElementById('downloadBtn').style.display = "block";
        } else {
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
