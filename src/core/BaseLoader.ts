import { Transform, TransformCallback } from "stream";
import { Document, Metadata } from "./Document";
import fs from "fs";

export type LoaderInput = Buffer | string;

/**
 * The data to be transformed by the loader.
 */
export type LoaderData = {
  input: LoaderInput;
  documents?: Document[];
  metadata?: Record<string, any>;
};

/**
 * The base class for all loaders.
 */
export class BaseLoader extends Transform {
  constructor() {
    super({ objectMode: true });
  }

  /**
   * Transform the data
   * @param data - The data to transform
   * @returns The transformed data
   */
  async _transform(data: LoaderData, _encoding: BufferEncoding, cb: TransformCallback) {
    // If the data has already been transformed or the data is not supported, return it
    if (data.documents !== undefined || !this.test(data.input)) {
      cb(null, data);
      return;
    }

    try {
      const result = await this.transform(data);
      cb(null, result);
    } catch (err) {
      cb(err as Error);
    }
  }

  /**
   * Load a document from a buffer
   * @param buffer - The buffer to load the document from
   * @param metadata - Additional metadata to be added to all documents.
   * @returns The document
   */
  async load(input: LoaderInput, metadata: Metadata = {}): Promise<Document[]> {
    // If the input is a string, it is a path or a URL
    if (typeof input === "string") {
      if (/^https?:\/\//.test(input)) {
        return this.loadFromUrl(input, metadata);
      } else {
        return this.loadFromPath(input, metadata);
      }
    } else {
      return this.loadFromBuffer(input, metadata);
    }
  }

  /**
   * Load a document from a buffer
   * @param buffer - The buffer to load the document from
   * @param metadata - Additional metadata to be added to all documents.
   * @returns The document
   */
  async loadFromBuffer(buffer: Buffer, metadata: Metadata = {}): Promise<Document[]> {
    return this.loadDocuments(buffer, metadata);
  }

  /**
   * Load a document from a URL
   * @param url - The URL to load the document from
   * @param metadata - Additional metadata to be added to all documents.
   * @returns The document
   */
  async loadFromUrl(url: string, metadata: Metadata = {}): Promise<Document[]> {
    const response = await fetch(url);
    const buffer = await response.arrayBuffer();
    return this.loadFromBuffer(Buffer.from(buffer), metadata);
  }

  /**
     * Load a document from a path
     * @param path - The path to load the document from

    * @returns The document
     */
  async loadFromPath(path: string, metadata: Metadata = {}): Promise<Document[]> {
    const buffer = fs.readFileSync(path);
    return this.loadFromBuffer(buffer, metadata);
  }

  /**
   * Detect if a buffer is the type of document this loader can handle
   * @param input - The input to detect
   * @returns True if the input is a document, false otherwise
   */
  test(input: LoaderInput): boolean {
    throw new Error("Not implemented");
  }

  /**
   * Load a document from a buffer
   * @param buffer - The buffer to load the document from
   * @param metadata - Additional metadata to be added to all documents.
   * @returns The document
   */
  async loadDocuments(buffer: Buffer, metadata: Metadata = {}): Promise<Document[]> {
    throw new Error("Not implemented");
  }

  /**
   * Transform the data
   * @param data - The data to transform
   * @returns The transformed data
   */
  async transform(data: LoaderData): Promise<LoaderData> {
    throw new Error("Not implemented");
  }
}
