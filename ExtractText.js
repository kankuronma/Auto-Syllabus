// import fs from "fs";
// import PDFParser from "pdf2json";

const fs = require("fs");
const PDFParser = require("pdf2json");

const pdfParser = new PDFParser();

function extract(filename){
    pdfParser.on("pdfParser_dataError", (errData) =>
        console.error(errData.parserError)
    );

    // pdfParser.on("pdfParser_dataReady", (pdfData) => {
    //     //console.log({ textContent: pdfParser.getRawTextContent()});
    //     console.log(pdfData)
    // });

    // pdfParser.on("pdfParser_dataReady", (pdfData) => {
    //     fs.writeFile(
    //         //pdfParser.getAllFieldsTypes(),
    //         JSON.stringify(pdfData),
    //         (data) => console.log(data)
    //     );
    // });
    
    pdfParser.on("pdfParser_dataReady", () => {
        const rawText = pdfParser.getRawTextContent();
        console.log(pdfParser.getRawTextContent());
        processText(rawText);
    })
    pdfParser.loadPDF(filename);
}

function processText(text){
    const events = [];
    const monthLib = {
        Jan: "01", Feb: "02", Mar: "03", Apr: "04", May: "05", Jun: "06",
        Jul: "07", Aug: "08", Sep: "09", Oct: "10", Nov: "11", Dec: "12"
    };
    
    const lines = text.split("\n");

    const assignmentRegex = /(A\d+)/;
    const testKeyword = /test/i;
    const midtermKeyword = /midterm/i;
    const examKeyword = /exam/i;
    const dateRegex = /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d+)/;

    lines.forEach(line => {
        const dateMatch = line.match(dateRegex);
        if(!dateMatch) return;

        const month = dateMatch[1];
        const day = dateMatch[2];


        const assignmentMatch = line.match(assignmentRegex);
        if (assignmentMatch) {
            events.push({
                type: "assignment",
                title: assignmentMatch[1],
                date: "2026-" + month + "-" + day
            });
            return;
        }

        if (testKeyword.test(line)) {
            events.push({
                type:"test",
                title: "Test",
                date: "2026-" + month + "-" + day
            });
        }
    });

    fs.writeFileSync(
        "ExtractedEvents.json",
        JSON.stringify(events, null, 2)
    );
}
extract("C:/UofM/COMP 2080 (Zhu)/Course Info/2080-schedule.pdf");
//extract("C:/UofM/DATA 2010/DATA_2010.pdf");