import { Stream, type IDocument, type IStreamCallback } from "../core";

/**
 * A stream that loads a URL.
 */
export class UrlStream extends Stream {
  /**
   * Transform the document.
   * @param doc - The document to transform.
   * @param _encoding - The encoding of the document.
   * @param callback - The callback to call when the document is transformed.
   */
  async _transform(doc: IDocument, _encoding: BufferEncoding, callback: IStreamCallback) {
    // Fetch the URL
    const response = await fetch(doc.content as string);
    const bufferArray = await response.arrayBuffer();

    // Update the input
    doc.content = Buffer.from(bufferArray);

    this.push(doc);
    callback();
  }

  /**
   * Test if the document should be processed.
   * @param doc - The document to test.
   * @returns True if the document should be processed, false otherwise.
   */
  _test(doc: IDocument) {
    return typeof doc.content === "string" && /^https?:/.test(doc.content);
  }
}
