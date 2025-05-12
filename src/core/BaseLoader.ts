import { Transform, TransformCallback } from "stream";
import { Document } from "./Document";

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
    // If the input is not supported, return it
    if (!this.test(data)) {
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
   * Push data to the stream
   * @param data - The data to push
   */
  push(data: LoaderData | Document) {
    return super.push(data);
  }

  /**
   * Detect if a buffer is the type of document this loader can handle
   * @param data - The data to detect
   * @returns True if the input is a document, false otherwise
   */
  test(data: LoaderData): boolean {
    throw new Error("Not implemented");
  }

  /**
   * Transform the data
   * @param data - The data to transform
   * @returns The transformed data
   */
  async transform(data: LoaderData): Promise<void> {
    throw new Error("Not implemented");
  }
}
