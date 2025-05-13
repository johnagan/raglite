import { existsSync, readFileSync, statSync } from "fs";
import { LoaderDocument, LoaderDocumentSchema } from "../core/LoaderDocument.ts";
import { Readable } from "stream";
import { Buffer } from "buffer";

/**
 * Loads a text string and returns a Buffer or Document.
 */
export class TextLoader extends Readable {
  doc: LoaderDocument;

  /**
   * Create a new TextLoader
   * @param doc - The data to load
   */
  constructor(doc: LoaderDocument) {
    super({ objectMode: true });
    this.doc = LoaderDocumentSchema.parse(doc);
  }

  /**
   * Read the content and transform it
   * @returns The transformed data
   */
  async _read() {
    const { content } = this.doc;

    // If the input is not a buffer, transform it
    if (!Buffer.isBuffer(content)) {
      await this.transformUrl(); // Fetch contents if URL
      await this.transformPath(); // Read file contents if path
    }

    // Push the updated data to the stream
    this.push(this.doc);
    this.push(null);
  }

  /**
   * Check if the content is a file path
   * @returns True if the path is a file, false otherwise
   */
  get isFilePath(): boolean {
    const { content } = this.doc;
    return typeof content === "string" && existsSync(content) && statSync(content).isFile();
  }

  /**
   * Check if the content is a URL
   * @returns True if the content is a URL, false otherwise
   */
  get isUrl(): boolean {
    const { content } = this.doc;
    return typeof content === "string" && /^https?:/.test(content);
  }

  /**
   * Load an input buffer from a URL
   * @returns The document
   */
  async transformUrl(): Promise<void> {
    const { content } = this.doc;

    // If the input is not a string or a URL, return it
    if (typeof content !== "string" || !this.isUrl) {
      return;
    }

    // Fetch the URL
    const response = await fetch(content);
    const bufferArray = await response.arrayBuffer();

    // Update the input
    this.doc.content = Buffer.from(bufferArray);
  }

  /**
   * Load an input buffer from a path
   * @returns The document
   */
  async transformPath(): Promise<void> {
    const { content } = this.doc;

    // If the input is not a string or a path, return it
    if (typeof content !== "string" || !this.isFilePath) {
      return;
    }

    // Read the file
    const buffer = readFileSync(content);

    // Update the input
    this.doc.content = Buffer.from(buffer);
  }
}
