import { existsSync, readFileSync, statSync } from 'fs';
import { LoaderData } from '@root/core';
import { Readable } from 'stream';
import { Buffer } from 'buffer';

/**
 * Check if the input is a URL
 * @param value - The value to check
 * @returns True if the value is a URL, false otherwise
 */
function isUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return /^https?:/.test(url.protocol);
  } catch {
    return false;
  }
}

/**
 * Check if the path is a file
 * @param path - The path to check
 * @returns True if the path is a file, false otherwise
 */
function isFilePath(path: string): boolean {
  return existsSync(path) && statSync(path).isFile();
}

/**
 * Loads a File Path or URL and returns a Buffer.
 */
export class InputLoader extends Readable {
  private data: LoaderData;

  /**
   * Create a new InputLoader
   * @param data - The data to load
   */
  constructor(data: LoaderData) {
    super({ objectMode: true });
    this.data = data;
  }

  /**
   * Read the input and transform it
   * @returns The transformed data
   */
  async _read() {
    const { data } = this;
    const { input } = data;

    // If the input is a buffer, push it and return
    if (Buffer.isBuffer(input)) {
      this.push(data);
      return;
    }

    // Fetch contents if URL
    await this.transformUrl(data);

    // Read file contents if path
    await this.transformPath(data);

    // Transform document
    await this.transformDocument(data);

    // Push the updated data to the stream
    this.push(data);
  }

  /**
   * Transform the data
   * @param data - The data to transform
   * @returns The transformed data
   */
  async transformDocument(data: LoaderData): Promise<void> {
      const { input: content, metadata } = data;

      // If the input is not a string, return it
      if (typeof content !== "string") {
        return;
      }

      // Push the document to the stream
      this.push({ content, metadata });

      // End the stream since we've got a document
      this.destroy();
  }

  /**
   * Load an input buffer from a URL
   * @param data - The data to transform
   * @returns The document
   */
  async transformUrl(data: LoaderData): Promise<void> {
    const { input } = data;

    // If the input is not a string or a URL, return it
    if (typeof input !== "string" || !isUrl(input)) {
      return;
    }

    // Fetch the URL
    const response = await fetch(input);
    const bufferArray = await response.arrayBuffer();
    data.input = Buffer.from(bufferArray);
  }

  /**
   * Load an input buffer from a path
   * @param data - The path to load the document from
   * @returns The document
   */
  async transformPath(data: LoaderData): Promise<void> {
    const { input } = data;

    // If the input is not a string or a path, return it
    if (typeof input !== "string" || !isFilePath(input)) {
      return;
    }

    // Read the file
    const buffer = readFileSync(input);
    data.input = Buffer.from(buffer);
  }
}
