import React, { useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.min.js?url";
import { PDFDocument } from 'pdf-lib';


pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

const PdfAnalyzer = () => {
    const [pdfPages, setPdfPages] = useState([]);
    const [textData, setTextData] = useState([]);
    const [societaEmittenteText, setSocietaEmittenteText] = useState(`Società di distribuzione:
E-DISTRIBUZIONE SPA
pronto intervento elettricità
tel. 803500`);

    const [intestatoAText, setIntestatoAText] = useState(`Intestato a : Mario Rossi 
VIA ROMA 123
81100 CASERTA (CE)
Codice fiscale : FLLLTT45M21E345X
Partita IVA : 12423543667`);

    const [logoFile, setLogoFile] = useState(null);


    const handleLogoUpload = (event) => {
        const file = event.target.files[0];
        if (file) {
            const img = new Image();
            img.src = URL.createObjectURL(file);
            img.onload = () => setNewLogo(img);
        }
    };

    const downloadPdf = async () => {
        if (pdfPages.length === 0) return;

        const pdfDoc = await PDFDocument.create();

        for (const canvas of pdfPages) {
            const pngDataUrl = canvas.toDataURL('image/png');
            const pngBase64 = pngDataUrl.split(',')[1];

            const pngImage = await pdfDoc.embedPng(pngBase64);
            const page = pdfDoc.addPage([canvas.width, canvas.height]);

            page.drawImage(pngImage, {
                x: 0,
                y: 0,
                width: canvas.width,
                height: canvas.height,
            });
        }

        const pdfBytes = await pdfDoc.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });

        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'pdf_modificato.pdf';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };


    const loadPdfTextAndRenderPages = async (event) => {
        const file = event.target.files[0];
        if (!file || file.type !== "application/pdf") return;

        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

        const pages = [];
        const textContentArray = [];

        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            const SCALE = 1.5;
            const viewport = page.getViewport({ scale: SCALE  });



            // Canvas setup
            const canvas = document.createElement("canvas");
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            const context = canvas.getContext("2d");

            // Render page
            await page.render({ canvasContext: context, viewport }).promise;

            // Extract text content
            const textContent = await page.getTextContent();
            textContentArray.push({ page: pageNum, items: textContent.items });

            // Loop through text items
            for (const item of textContent.items) {
                const str = item.str.toLowerCase();
                console.log("Testo PDF:", str); // Debug: vedi cosa legge

                const transform = pdfjsLib.Util.transform(viewport.transform, item.transform);
                const x = transform[4];
                const y = transform[5];

                const marginX = 30;
                const marginY = 20;

                // Usa questi offset per spostare tutto (se vuoi)
                const offsetX = 0;
                const offsetY = 0;

                if (str.includes("società emittente")) {
                    const transform = pdfjsLib.Util.transform(viewport.transform, item.transform);
                    const x = transform[4];
                    const y = transform[5];

                    const marginX = 30;
                    const marginY = -3;
                    const offsetX = 0;
                    const offsetY = 0;

                    const newTextLines = societaEmittenteText.split("\n");

                    // Dimensioni rettangolo fisse
                    const maxBoxWidth = item.width * 6.5 + marginX * 2;
                    const maxBoxHeight = 137; // es: 140 px

               
                    // Setup font dinamico
                    const contextFont = (size) => `${size}px sans-serif`;
                    let fontHeight = 20; // valore iniziale
                    let lineSpacing = 1.1;
                    let fits = false;

                    while (fontHeight > 6 && !fits) {
                        context.font = contextFont(fontHeight);
                        const maxLineWidth = Math.max(...newTextLines.map(line => context.measureText(line).width));
                        const totalHeight = newTextLines.length * fontHeight * lineSpacing;

                        if (maxLineWidth <= maxBoxWidth && totalHeight + 5 <= maxBoxHeight) {
                            fits = true;
                        } else {
                            fontHeight -= 1;
                        }
                    }

                    // Rettangolo bianco


                    context.fillStyle = "white";
                    context.fillRect(
                        x - marginX + offsetX,
                        y - fontHeight - marginY + offsetY,
                        maxBoxWidth,
                        maxBoxHeight
                    );

                    // Scrittura testo
                    context.fillStyle = "black";
                    newTextLines.forEach((line, index) => {
                        context.font =
                            line.trim().toUpperCase() === "E-DISTRIBUZIONE SPA"
                                ? `bold ${fontHeight}px sans-serif`
                                : `${fontHeight}px sans-serif`;

                        const lineY = y + offsetY + index * fontHeight * lineSpacing;
                        context.fillText(line, x + offsetX, lineY);
                    });
                }



                if (str.toLowerCase().includes("intestata a")) {
                    const transform = pdfjsLib.Util.transform(viewport.transform, item.transform);
                    const x = transform[4];
                    const y = transform[5];

                    const fontHeight = Math.sqrt(item.transform[2] ** 2 + item.transform[3] ** 2) * viewport.scale || 10;

                    const marginX = 20;
                    const marginY = 10;
                    const offsetX = 0;
                    const offsetY = 0;
                    const topShift = 10;
                    const lineSpacing = 1.1;
                    const bottomShrink = 20;

                    const newTextLines = intestatoAText.split("\n");

                    const rectX = x - marginX;
                    const rectY = y - fontHeight - marginY + topShift;
                    // const rectWidth = item.width * 6 + marginX * 2;
                    // const rectHeight = newTextLines.length * fontHeight * lineSpacing + marginY * 2 - bottomShrink;
                    const rectWidth = 300; // larghezza fissa in px
                    const rectHeight = 70; // altezza fissa in px


                    // Copertura con rettangolo bianco
                    context.fillStyle = "white";
                    context.fillRect(rectX, rectY, rectWidth, rectHeight);
                   

                    // Scrittura testo nuovo
                    newTextLines.forEach((line, index) => {
                        const lineY = y + offsetY + index * fontHeight * lineSpacing;

                        if (line.toLowerCase().includes("intestato a:")) {
                            const keyword = "Intestato a:";

                            const splitIndex = line.toLowerCase().indexOf("intestato a:");
                            const before = line.slice(0, splitIndex);
                            const boldPart = keyword;
                            const after = line.slice(splitIndex + keyword.length);

                            // Disegna "Intestato a:" in grassetto
                            context.font = `bold ${fontHeight}px Arial`;
                            context.fillStyle = "black";
                            context.fillText(boldPart, x + offsetX, lineY);
                            const boldWidth = context.measureText(boldPart).width;

                            // Disegna il resto normalmente
                            context.font = `${fontHeight}px Arial`;
                            context.fillText(after, x + offsetX + boldWidth, lineY);
                        } else {
                            // Riga normale
                            context.font = `${fontHeight}px Arial`;
                            context.fillStyle = "black";
                            context.fillText(line, x + offsetX, lineY);
                        }
                    });



                }







            }

            if (logoFile) {
                const logoWidth = 150;
                const logoHeight = 60;
                const logoX = 35; // orizzontale da sinistra
                const logoY = 20; // verticale da alto (canvas 0,0 in alto a sinistra)

                const image = new Image();
                image.onload = () => {
                    // 1. Copertura del logo vecchio
                    context.fillStyle = "#ffe61b";
                    context.fillRect(logoX, logoY, logoWidth, logoHeight);

                    // 2. Inserimento nuovo logo
                    context.drawImage(image, logoX, logoY, logoWidth, logoHeight);

                    // ✅ Aggiungi canvas alla lista SOLO dopo che il logo è stato disegnato
                    pages.push(canvas);

                    // ⚠️ Aggiorna lo stato solo quando tutti i canvas sono pronti
                    if (pages.length === pdf.numPages) {
                        setPdfPages([...pages]);
                        setTextData(textContentArray);
                    }
                };

                const reader = new FileReader();
                reader.onload = () => {
                    image.src = reader.result;
                };
                reader.readAsDataURL(logoFile);
            } else {
                pages.push(canvas);
            }

        }

        setTextData(textContentArray);
        setPdfPages(pages);
    };

    return (
        <div
        // className="min-h-screen bg-gray-50 flex justify-center items-start py-10 px-4"
        >
            <div className="bg-white rounded-lg shadow-lg max-w-5xl w-full p-6">
                <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">
                    PDF Analyzer & Editor
                </h1>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">

                    <div>
                        <label htmlFor="logo-upload" className="block mb-2 font-semibold text-gray-700">
                            🖼️ Carica nuovo logo
                        </label>
                        <label
                            htmlFor="logo-upload"
                            className="inline-block cursor-pointer px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                        >
                            Scegli file immagine
                        </label>
                        <input
                            id="logo-upload"
                            type="file"
                            accept="image/*"
                            onChange={(e) => setLogoFile(e.target.files[0])}
                            className="hidden"
                        />
                    </div>

                    <div>
                        <label htmlFor="pdf-upload" className="block mb-2 font-semibold text-gray-700">
                            📄 Carica PDF
                        </label>
                        <label
                            htmlFor="pdf-upload"
                            className="inline-block cursor-pointer px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
                        >
                            Scegli file PDF
                        </label>
                        <input
                            id="pdf-upload"
                            type="file"
                            accept="application/pdf"
                            onChange={loadPdfTextAndRenderPages}
                            className="hidden"
                        />
                    </div>

                    <div className="md:col-span-2">
                        <label className="block mb-2 font-semibold text-gray-700">🏢 Testo "Società emittente"</label>
                        <textarea
                            className="w-full border  text-black border-gray-300 rounded px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={societaEmittenteText}
                            onChange={(e) => setSocietaEmittenteText(e.target.value)}
                            rows={4}
                        />
                    </div>

                    <div className="md:col-span-2">
                        <label className="block mb-2 font-semibold text-gray-700">🧾 Testo "Intestato a"</label>
                        <textarea
                            className="w-full border text-black border-gray-300 rounded px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-green-500"
                            value={intestatoAText}
                            onChange={(e) => setIntestatoAText(e.target.value)}
                            rows={3}
                        />
                    </div>
                </div>

                <div
                    className="pdf-preview mb-6"
                >
                    <h2 className="text-2xl font-semibold mb-4 text-gray-800">📄 Anteprima PDF modificato</h2>
                    <div>
                        {pdfPages.map((canvas, index) => (
                            <div key={index} className="mb-6 border border-gray-200 rounded p-4 shadow-sm">
                                <h3 className="font-medium mb-2 text-gray-700">Pagina {index + 1}</h3>
                                <div
                                    // className="pdf-canvas-container"
                                    ref={(ref) => {
                                        if (ref && !ref.hasChildNodes()) {
                                            ref.appendChild(canvas);
                                        }
                                    }}
                                />
                            </div>
                        ))}
                    </div>
                </div>

                {pdfPages.length > 0 && (
                    <div className="download-btn-container text-center">
                        <button
                            onClick={downloadPdf}
                            className="inline-block  bg-purple-600 hover:bg-purple-700 text-black font-semibold py-3 px-6 rounded transition"
                        >
                            📥 Scarica PDF Modificato
                        </button>
                    </div>
                )}
            </div>
        </div>
    );



};

export default PdfAnalyzer;





