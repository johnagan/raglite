import { Loader, type ILoaderCallback, type IDocument } from "../core/index.js";
import mammoth from "mammoth";

/**
 * Loads a Docx document and returns the text content.
 */
export class DocxLoader extends Loader {
  /**
   * Transform the data
   * @param doc - The document to transform
   * @param callback - The callback to call when the data is transformed
   */
  async _load(doc: IDocument, callback: ILoaderCallback) {
    try {
      const buffer = doc.content as Buffer;
      const { value } = await mammoth.extractRawText({ buffer });
      doc.content = value;
      callback(null, doc);
    } catch (error) {
      callback(error as Error, doc);
    }
  }

  /**
   * Test if the loader should process the document.
   * @param doc - The document to test.
   * @returns True if the loader should process the document, false otherwise.
   */
  _test(doc: IDocument): boolean {
    return (
      Buffer.isBuffer(doc.content) &&
      doc.content.subarray(0, 4).toString("hex") === "504b0304"
    );
  }
}

export default DocxLoader;
