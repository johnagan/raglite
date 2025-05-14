import { Loader, type IDocument, type ILoaderCallback } from "../core";
import { existsSync, readFileSync, statSync } from "fs";

/**
 * A stream that loads a file.
 */
export class FileLoader extends Loader {
  /**
   * Transform the document.
   * @param doc - The document to transform.
   * @param _encoding - The encoding of the document.
   * @param callback - The callback to call when the document is transformed.
   */
  async _transform(
    doc: IDocument,
    _encoding: BufferEncoding,
    callback: ILoaderCallback,
  ) {
    const filePath = doc.content as string;

    // Get the file name from the path
    const fileName = filePath.split("/").pop() || "";
    doc.metadata = { ...doc.metadata, fileName };

    // Read the file
    const buffer = readFileSync(filePath);

    // Update the input
    doc.content = Buffer.from(buffer);

    this.process(doc);
    callback();
  }

  /**
   * Test if the document should be processed.
   * @param doc - The document to test.
   * @returns True if the document should be processed, false otherwise.
   */
  _test(doc: IDocument) {
    return (
      typeof doc.content === "string" &&
      existsSync(doc.content) &&
      statSync(doc.content).isFile()
    );
  }
}
