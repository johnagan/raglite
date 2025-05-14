import { Loader, type ILoaderCallback, type IDocument } from "../core";
import mammoth from "mammoth";

/**
 * Loads a Docx document and returns the text content.
 */
export class DocxLoader extends Loader {
  /**
   * Transform the data
   * @param doc - The document to transform
   * @param _encoding - The encoding of the document
   * @param callback - The callback to call when the data is transformed
   */
  async _transform(
    { content, metadata }: IDocument,
    _encoding: BufferEncoding,
    callback: ILoaderCallback,
  ) {
    try {
      const buffer = content as Buffer;
      const { value } = await mammoth.extractRawText({ buffer });
      this.process({ content: value, metadata });
    } catch (error) {
      this.error({ content, metadata }, error);
    }

    // End the stream
    callback();
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
