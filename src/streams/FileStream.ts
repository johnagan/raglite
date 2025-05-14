import { Stream, type IDocument, type IStreamCallback } from "../core";
import { existsSync, readFileSync, statSync } from "fs";

/**
 * A stream that loads a file.
 */
export class FileStream extends Stream {
  /**
   * Transform the document.
   * @param doc - The document to transform.
   * @param _encoding - The encoding of the document.
   * @param callback - The callback to call when the document is transformed.
   */
  async _transform(doc: IDocument, _encoding: BufferEncoding, callback: IStreamCallback) {
    // Read the file
    const buffer = readFileSync(doc.content as string);

    // Update the input
    doc.content = Buffer.from(buffer);

    this.push(doc);
    callback();
  }

  /**
   * Test if the document should be processed.
   * @param doc - The document to test.
   * @returns True if the document should be processed, false otherwise.
   */
  _test(doc: IDocument) {
    return typeof doc.content === "string" && existsSync(doc.content) && statSync(doc.content).isFile();
  }
}
