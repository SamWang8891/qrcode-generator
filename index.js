// TODO: Remove this if the functions are fixed
let dotStyle = 'square';
let cornerStyle = 'square';

// Load environment variables
const ENV = {
    // Default values
    EXAMPLE_URL: "NONE"
};

document.addEventListener('DOMContentLoaded', function () {
    let initialLoad = true;

    // Get elements
    const textInput = document.getElementById('text');
    const sizeSelect = document.getElementById('size');
    const errorCorrectionLevelSelect = document.getElementById('errorCorrectionLevel');
    const dotStyleSelect = document.getElementById('dotStyle');
    const cornerStyleSelect = document.getElementById('cornerStyle');
    const foregroundColorInput = document.getElementById('foregroundColor');
    const backgroundColorInput = document.getElementById('backgroundColor');
    const logoSizeSelect = document.getElementById('logoSize');
    const fileUpload = document.getElementById('fileUpload');
    const imagePreview = document.getElementById('imagePreview');
    const generateBtn = document.getElementById('generate');
    const downloadBtn = document.getElementById('downloadBtn');
    const downloadSvgBtn = document.getElementById('downloadSvgBtn');
    const qrcodeDiv = document.getElementById('qrcode');
    const qrCanvas = document.getElementById('qrCanvas');
    const errorDiv = document.getElementById('error');
    const removeLogo = document.getElementById('removeLogo');

    let uploadedLogo = null;

    // Tab functionality
    window.openTab = function (evt, tabName) {
        const tabContents = document.getElementsByClassName('tab-content');
        for (let i = 0; i < tabContents.length; i++) {
            tabContents[i].classList.remove('active');
        }

        const tabLinks = document.getElementsByClassName('tab');
        for (let i = 0; i < tabLinks.length; i++) {
            tabLinks[i].classList.remove('active');
        }

        document.getElementById(tabName).classList.add('active');
        evt.currentTarget.classList.add('active');
    };

    // Handle logo upload
    fileUpload.addEventListener('change', function (e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (event) {
                uploadedLogo = new Image();
                uploadedLogo.onload = function () {
                    imagePreview.src = event.target.result;
                    imagePreview.style.display = 'block';
                    removeLogo.style.display = 'inline-block'; // Show remove button
                };
                uploadedLogo.src = event.target.result;
            };
            reader.readAsDataURL(file);
        }
    });

    // Handle logo removal
    removeLogo.addEventListener('click', function () {
        uploadedLogo = null;
        imagePreview.src = '';
        imagePreview.style.display = 'none';
        removeLogo.style.display = 'none';
        fileUpload.value = ''; // Reset the file input

        // If QR code is already generated, regenerate it without the logo
        if (qrcodeDiv.innerHTML) {
            generateQRCode();
        }
    });

    // Generate QR code on button click
    generateBtn.addEventListener('click', function () {
        initialLoad = false;
        generateQRCode();
    });

    // Download QR code as PNG
    downloadBtn.addEventListener('click', function () {
        if (qrCanvas.width > 0) {
            const link = document.createElement('a');
            link.download = textInput.value + '_qrcode.png';
            link.href = qrCanvas.toDataURL('image/png');
            link.click();
        }
    });

    // Download QR code as SVG
    downloadSvgBtn.addEventListener('click', function () {
        downloadAsSVG();
    });

    // Also generate on Enter key press
    textInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            initialLoad = false;
            generateQRCode();
        }
    });

    function generateQRCode() {
        const text = textInput.value.trim();
        const size = parseInt(sizeSelect.value);
        const errorCorrectionLevel = errorCorrectionLevelSelect.value;
        // TODO: Function not yet fixed
        // const dotStyle = dotStyleSelect.value;
        // const cornerStyle = cornerStyleSelect.value;
        const foregroundColor = foregroundColorInput.value;
        const backgroundColor = backgroundColorInput.value;
        const logoSize = parseFloat(logoSizeSelect.value);

        // Clear previous QR code and error
        qrcodeDiv.innerHTML = '';
        errorDiv.textContent = '';
        downloadBtn.style.display = 'none';
        downloadSvgBtn.style.display = 'none';

        if (!text) {
            if (!initialLoad) {
                errorDiv.textContent = 'Please enter some text or a URL';
            }
            return;
        }

        try {
            // First create a standard QR code
            const qrCode = new QRCode(qrcodeDiv, {
                text: text,
                width: size,
                height: size,
                colorDark: foregroundColor,
                colorLight: backgroundColor,
                correctLevel: QRCode.CorrectLevel[errorCorrectionLevel]
            });

            // If we're using custom styles or logo, we need to modify the SVG
            if (dotStyle !== 'square' || cornerStyle !== 'square' || uploadedLogo) {
                // Immediate styling to prevent timing issues
                stylizeQRCode(size, dotStyle, cornerStyle, foregroundColor, backgroundColor, uploadedLogo, logoSize);
            } else {
                // Enable download button for regular QR code
                prepareDownload();
            }
        } catch (error) {
            console.error("Error generating QR code:", error);
            errorDiv.textContent = 'Error generating QR code: ' + error.message;
        }
    }

    function stylizeQRCode(size, dotStyle, cornerStyle, foregroundColor, backgroundColor, logo, logoSize) {
        try {
            // Get the generated QR code (this will be a canvas or img)
            const qrCodeElement = qrcodeDiv.querySelector('img') || qrcodeDiv.querySelector('canvas');

            if (!qrCodeElement) {
                console.error("No QR code element found");
                return;
            }

            // Create a new canvas with the desired size
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = size;
            canvas.height = size;

            // Draw background
            ctx.fillStyle = backgroundColor;
            ctx.fillRect(0, 0, size, size);

            // Draw the QR code onto the canvas first
            ctx.drawImage(qrCodeElement, 0, 0, size, size);

            // Get the pixel data
            const imageData = ctx.getImageData(0, 0, size, size);
            const data = imageData.data;

            // Clear the canvas for redrawing
            ctx.clearRect(0, 0, size, size);
            ctx.fillStyle = backgroundColor;
            ctx.fillRect(0, 0, size, size);

            // Detect the QR modules (dark pixels)
            const modules = [];
            const pixelSize = size / Math.sqrt(data.length / 4);
            const moduleSize = size / Math.round(size / pixelSize);

            for (let y = 0; y < size; y += moduleSize) {
                for (let x = 0; x < size; x += moduleSize) {
                    const pixelPos = (Math.floor(y) * size + Math.floor(x)) * 4;
                    // If pixel is dark (not white)
                    if (data[pixelPos] < 128 && data[pixelPos + 1] < 128 && data[pixelPos + 2] < 128) {
                        modules.push({x: x, y: y});
                    }
                }
            }

            // Draw styled QR code
            ctx.fillStyle = foregroundColor;

            // Function to check if a module is part of a position detection pattern
            const isPositionDetectionModule = (x, y) => {
                // Better check for position patterns
                const margin = moduleSize * 7; // Position patterns are 7 modules wide
                const threshold = margin / 2; // Half the pattern size

                // Top-left, top-right, bottom-left corners
                return (x < margin && y < margin) ||
                    (x > size - margin && y < margin) ||
                    (x < margin && y > size - margin);
            };

            // Draw modules with the chosen style
            modules.forEach(module => {
                const x = module.x;
                const y = module.y;
                const isCorner = isPositionDetectionModule(x, y);

                if (isCorner) {
                    // Draw corners with special style
                    switch (cornerStyle) {
                        case 'rounded':
                            ctx.beginPath();
                            ctx.arc(x + moduleSize / 2, y + moduleSize / 2, moduleSize / 2, 0, 2 * Math.PI);
                            ctx.fill();
                            break;
                        case 'extra-rounded':
                            ctx.beginPath();
                            ctx.arc(x + moduleSize / 2, y + moduleSize / 2, moduleSize / 1.5, 0, 2 * Math.PI);
                            ctx.fill();
                            break;
                        default: // square
                            ctx.fillRect(x, y, moduleSize, moduleSize);
                    }
                } else {
                    // Draw regular modules with the chosen style
                    switch (dotStyle) {
                        case 'dots':
                            ctx.beginPath();
                            ctx.arc(x + moduleSize / 2, y + moduleSize / 2, moduleSize / 2.5, 0, 2 * Math.PI);
                            ctx.fill();
                            break;
                        case 'rounded':
                            // Use arcTo method instead of roundRect for better compatibility
                            ctx.beginPath();
                            const radius = moduleSize / 4;
                            ctx.moveTo(x + radius, y);
                            ctx.lineTo(x + moduleSize - radius, y);
                            ctx.arcTo(x + moduleSize, y, x + moduleSize, y + radius, radius);
                            ctx.lineTo(x + moduleSize, y + moduleSize - radius);
                            ctx.arcTo(x + moduleSize, y + moduleSize, x + moduleSize - radius, y + moduleSize, radius);
                            ctx.lineTo(x + radius, y + moduleSize);
                            ctx.arcTo(x, y + moduleSize, x, y + moduleSize - radius, radius);
                            ctx.lineTo(x, y + radius);
                            ctx.arcTo(x, y, x + radius, y, radius);
                            ctx.closePath();
                            ctx.fill();
                            break;
                        case 'classy':
                            // Draw a diamond shape
                            ctx.beginPath();
                            ctx.moveTo(x + moduleSize / 2, y);
                            ctx.lineTo(x + moduleSize, y + moduleSize / 2);
                            ctx.lineTo(x + moduleSize / 2, y + moduleSize);
                            ctx.lineTo(x, y + moduleSize / 2);
                            ctx.closePath();
                            ctx.fill();
                            break;
                        case 'classy-rounded':
                            ctx.beginPath();
                            ctx.arc(x + moduleSize / 2, y + moduleSize / 2, moduleSize / 2, 0, 2 * Math.PI);
                            ctx.fill();
                            break;
                        default: // square
                            ctx.fillRect(x, y, moduleSize, moduleSize);
                    }
                }
            });

            // Add logo if provided
            if (logo) {
                const logoWidth = size * logoSize;
                const logoHeight = logoWidth * (logo.height / logo.width);
                const logoX = (size - logoWidth) / 2;
                const logoY = (size - logoHeight) / 2;

                // Draw white background for logo
                ctx.fillStyle = 'white';
                ctx.fillRect(logoX - 5, logoY - 5, logoWidth + 10, logoHeight + 10);

                // Draw the logo
                ctx.drawImage(logo, logoX, logoY, logoWidth, logoHeight);
            }

            // Replace the QR code with our styled version
            qrcodeDiv.innerHTML = '';
            qrcodeDiv.appendChild(canvas);

            // Enable download button
            prepareDownload(canvas);
        } catch (error) {
            console.error("Error applying style:", error);
            errorDiv.textContent = 'Error applying style to QR code: ' + error.message;
        }
    }

    function prepareDownload(canvas) {
        // If a canvas is provided, use it, otherwise get the QR code from the div
        if (!canvas) {
            canvas = qrcodeDiv.querySelector('canvas');
        }

        if (canvas) {
            // Copy to hidden canvas for download
            qrCanvas.width = canvas.width;
            qrCanvas.height = canvas.height;
            const ctx = qrCanvas.getContext('2d');
            ctx.drawImage(canvas, 0, 0);

            // Show download buttons
            downloadBtn.style.display = 'inline-block';
            downloadSvgBtn.style.display = 'inline-block';
        }
    }

    // Helper function to determine if a module is part of a position detection pattern
    function isPositionDetectionModule(x, y, size, moduleSize) {
        const margin = moduleSize * 7; // Position patterns are about 7 modules wide

        // Top-left, top-right, bottom-left corners
        return (x < margin && y < margin) ||
            (x > size - margin && y < margin) ||
            (x < margin && y > size - margin);
    }

    // Function to download QR code as SVG
    function downloadAsSVG() {
        const canvas = qrcodeDiv.querySelector('canvas');
        if (!canvas) return;

        const size = canvas.width;
        const backgroundColor = backgroundColorInput.value;
        const foregroundColor = foregroundColorInput.value;

        // Create SVG element
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', size);
        svg.setAttribute('height', size);
        svg.setAttribute('viewBox', `0 0 ${size} ${size}`);

        // Add background
        const background = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        background.setAttribute('width', '100%');
        background.setAttribute('height', '100%');
        background.setAttribute('fill', backgroundColor);
        svg.appendChild(background);

        // Get module data from canvas
        const ctx = canvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, size, size);
        const data = imageData.data;

        // Extract QR modules
        const pixelSize = size / Math.sqrt(data.length / 4);
        const moduleSize = size / Math.round(size / pixelSize);

        // Group for all modules
        const modulesGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        modulesGroup.setAttribute('fill', foregroundColor);

        // Draw modules as SVG elements
        for (let y = 0; y < size; y += moduleSize) {
            for (let x = 0; x < size; x += moduleSize) {
                const pixelPos = (Math.floor(y) * size + Math.floor(x)) * 4;
                // If pixel is dark (not white/background)
                if (data[pixelPos] < 128 && data[pixelPos + 1] < 128 && data[pixelPos + 2] < 128) {
                    const isCorner = isPositionDetectionModule(x, y, size, moduleSize);
                    const dotStyle = dotStyleSelect.value;
                    const cornerStyle = cornerStyleSelect.value;

                    let element;

                    if (isCorner) {
                        // Corner elements
                        if (cornerStyle === 'rounded' || cornerStyle === 'extra-rounded') {
                            element = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                            element.setAttribute('cx', x + moduleSize / 2);
                            element.setAttribute('cy', y + moduleSize / 2);
                            element.setAttribute('r', cornerStyle === 'extra-rounded' ? moduleSize / 1.5 : moduleSize / 2);
                        } else {
                            element = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                            element.setAttribute('x', x);
                            element.setAttribute('y', y);
                            element.setAttribute('width', moduleSize);
                            element.setAttribute('height', moduleSize);
                        }
                    } else {
                        // Regular modules
                        switch (dotStyle) {
                            case 'dots':
                                element = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                                element.setAttribute('cx', x + moduleSize / 2);
                                element.setAttribute('cy', y + moduleSize / 2);
                                element.setAttribute('r', moduleSize / 2.5);
                                break;
                            case 'rounded':
                                element = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                                element.setAttribute('x', x);
                                element.setAttribute('y', y);
                                element.setAttribute('width', moduleSize);
                                element.setAttribute('height', moduleSize);
                                element.setAttribute('rx', moduleSize / 4);
                                element.setAttribute('ry', moduleSize / 4);
                                break;
                            case 'classy':
                                element = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                                const points = `${x + moduleSize / 2},${y} ${x + moduleSize},${y + moduleSize / 2} ${x + moduleSize / 2},${y + moduleSize} ${x},${y + moduleSize / 2}`;
                                element.setAttribute('points', points);
                                break;
                            case 'classy-rounded':
                                element = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                                element.setAttribute('cx', x + moduleSize / 2);
                                element.setAttribute('cy', y + moduleSize / 2);
                                element.setAttribute('r', moduleSize / 2);
                                break;
                            default: // square
                                element = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                                element.setAttribute('x', x);
                                element.setAttribute('y', y);
                                element.setAttribute('width', moduleSize);
                                element.setAttribute('height', moduleSize);
                        }
                    }

                    modulesGroup.appendChild(element);
                }
            }
        }

        svg.appendChild(modulesGroup);

        // If there's a logo, add it to the SVG
        if (uploadedLogo) {
            const logoSize = parseFloat(logoSizeSelect.value);
            const logoWidth = size * logoSize;
            const logoHeight = logoWidth * (uploadedLogo.height / uploadedLogo.width);
            const logoX = (size - logoWidth) / 2;
            const logoY = (size - logoHeight) / 2;

            // Add white background for logo
            const logoBackground = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            logoBackground.setAttribute('x', logoX - 5);
            logoBackground.setAttribute('y', logoY - 5);
            logoBackground.setAttribute('width', logoWidth + 10);
            logoBackground.setAttribute('height', logoHeight + 10);
            logoBackground.setAttribute('fill', 'white');
            svg.appendChild(logoBackground);

            // Add logo as an image element
            const image = document.createElementNS('http://www.w3.org/2000/svg', 'image');
            image.setAttribute('x', logoX);
            image.setAttribute('y', logoY);
            image.setAttribute('width', logoWidth);
            image.setAttribute('height', logoHeight);
            image.setAttributeNS('http://www.w3.org/1999/xlink', 'href', uploadedLogo.src);
            svg.appendChild(image);
        }

        // Convert SVG to string and download
        const svgData = new XMLSerializer().serializeToString(svg);
        const blob = new Blob([svgData], {type: 'image/svg+xml;charset=utf-8'});
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.download = textInput.value + '_qrcode.svg';
        link.href = url;
        link.click();

        URL.revokeObjectURL(url);
    }

    // Try to load from config.env if available
    fetch('config.env')
        .then(response => response.text())
        .then(text => {
            // Parse config.env file content
            const lines = text.split('\n');
            lines.forEach(line => {
                const parts = line.split('=');
                if (parts.length === 2) {
                    const key = parts[0].trim();
                    const value = parts[1].trim().replace(/^["'](.*)["']$/, '$1');
                    ENV[key] = value;
                }
            });

            // Update input field with the environment variable
            if (ENV.EXAMPLE_URL && ENV.EXAMPLE_URL !== "NONE") {
                textInput.value = ENV.EXAMPLE_URL;
                // Generate QR code only if EXAMPLE_URL is not NONE
                generateQRCode();
                window.qrCodeGenerated = true;
            } else {
                // Clear the input field if EXAMPLE_URL is NONE
                textInput.value = "";
            }
        })
        .catch(error => {
            console.log('No "config.env" file found or error loading it. Using default values.');
        });
});