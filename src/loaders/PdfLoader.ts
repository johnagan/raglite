import { Loader, type ILoaderCallback, type IDocument } from "../core/index.js";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

/**
 * Loads a PDF document and returns the text content.
 */
export class PdfLoader extends Loader {
  /**
   * Transform the data
   * @param doc - The data to transform
   * @param callback - The callback to call when the data is transformed
   */
  async _load(doc: IDocument, callback: ILoaderCallback) {
    // Read the PDF from buffer
    const data = new Uint8Array(doc.content as Buffer);
    const loadingTask = getDocument({
      data,
      // Disable all font-related features for Node.js
      disableFontFace: true,
      disableRange: false,
      disableStream: false,
      stopAtErrors: false,
      // Node.js specific configurations
      useSystemFonts: false,
      standardFontDataUrl: null, // Explicitly disable
      verbosity: 0, // Reduce console output
      // Disable worker in Node.js
      isEvalSupported: false,
    });

    const pdf = await loadingTask.promise;

    // Get the metadata from the PDF document
    const { info } = await pdf.getMetadata();

    // Iterate over each page in the PDF document
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();

      // Join the text content into a single string
      const content = textContent.items.map((item: any) => item.str).join(" ");

      // Create a new metadata object with the page number
      const metadata = { ...doc.metadata, ...info, pageNumber: i };

      // Push the transformed document to the stream

      this.process({ content, metadata });
    }

    callback(); // End the stream
  }

  /**
   * Test if the loader should process the document.
   * @param doc - The document to test.
   * @returns True if the loader should process the document, false otherwise.
   */
  _test(doc: IDocument): boolean {
    return (
      Buffer.isBuffer(doc.content) &&
      doc.content.subarray(0, 4).toString("hex") === "25504446"
    );
  }
}

export default PdfLoader;
