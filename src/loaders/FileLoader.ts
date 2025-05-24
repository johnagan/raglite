import { readFileSync, statSync, existsSync } from "fs";
import { Loader, type IDocument, type ILoaderCallback } from "../core/index.js";

/** A loader for file content. */
export class FileLoader extends Loader {
  /**
   * Read the input.
   * @param doc - The document to read.
   * @param callback - The callback to call when the document is read.
   */
  _load(doc: IDocument, callback: ILoaderCallback) {
    // Get the file name from the path
    const filePath = doc.content as string;
    const fileName = filePath.split("/").pop() || "";

    // Update the document
    doc.content = readFileSync(filePath);
    doc.metadata.fileName = fileName;

    callback(null, doc);
  }

  /**
   * Test if the loader should process the document.
   * @param doc - The document to test.
   * @returns True if the loader should process the document, false otherwise.
   */
  _test(doc: IDocument) {
    const { content } = doc;

    return (
      typeof content === "string" &&
      existsSync(content) &&
      statSync(content).isFile()
    );
  }
}

export default FileLoader;
