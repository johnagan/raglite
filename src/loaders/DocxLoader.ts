import { BaseDocumentLoader, LoaderDocumentCallback } from "../core/BaseDocumentLoader";
import { LoaderDocument } from "../types";
import mammoth from "mammoth";

/**
 * Loads a Docx document and returns the text content.
 */
export class DocxLoader extends BaseDocumentLoader {
  /**
   * Transform the data
   * @param doc - The document to transform
   * @param callback - The callback to call when the data is transformed
   */
  async _transform({ content, metadata }: LoaderDocument, callback: LoaderDocumentCallback) {
    const buffer = content as Buffer;
    const { value } = await mammoth.extractRawText({ buffer });

    // Push the transformed document to the stream
    this.push({ content: value, metadata });

    // End the stream
    callback();
  }

  /**
   * Test if the loader should process the document.
   * @param doc - The document to test.
   * @returns True if the loader should process the document, false otherwise.
   */
  test(doc: LoaderDocument): boolean {
    return Buffer.isBuffer(doc.content) && doc.content.subarray(0, 4).toString("hex") === "504b0304";
  }
}
