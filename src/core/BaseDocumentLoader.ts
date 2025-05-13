import { Duplex, DuplexOptions } from "stream";
import { LoaderDocument, LoaderDocumentSchema } from "../types";

export interface LoaderDocumentCallback {
  (error?: Error | null, doc?: LoaderDocument): void;
}

interface LoaderDocumentOptions<T extends BaseDocumentLoader = BaseDocumentLoader> extends DuplexOptions<T> {
  transform?(this: T, doc: LoaderDocument, callback: LoaderDocumentCallback): void;
}

export class BaseDocumentLoader extends Duplex {
  /**
   * The documents.
   */
  documents: LoaderDocument[] = [];
  transform?: (doc: LoaderDocument, callback: LoaderDocumentCallback) => void;

  /**
   * Constructor.
   * @param options - The options for the document loader.
   */
  constructor(options: LoaderDocumentOptions = {}) {
    super({ objectMode: true, ...options });
    this.transform = options.transform;
  }

  /**
   * Read the document.
   * @param size - The size of the document.
   */
  async _read(size: number) {
    this.emit("documents", this.documents);
  }

  /**
   * Transform the document.
   * @param doc - The document to transform.
   * @param _encoding - The encoding of the document.
   * @param callback - The callback to call when the document is transformed.
   */
  async _write(doc: LoaderDocument, _encoding: BufferEncoding, callback: LoaderDocumentCallback) {
    try {
      const parsedDoc = LoaderDocumentSchema.parse(doc);

      // Test if the document should be processed
      if (!this.test(parsedDoc)) {
        this.push(doc);
        return callback();
      } else {
        // Transform the document
        this._transform(parsedDoc, callback);
      }
    } catch (error) {
      callback(error as Error);
    }
  }

  /**
   * Transform the document.
   * @param doc - The document to transform.
   * @param callback - The callback to call when the document is transformed.
   */
  async _transform(doc: LoaderDocument, callback: LoaderDocumentCallback) {
    this.transform?.(doc, callback);
  }

  /**
   * Push the document.
   * @param doc - The document to push.
   */
  push(doc: LoaderDocument) {
    this.documents.push(doc);
    this.emit("data", doc);
    return super.push(doc);
  }

  /**
   * Test if the loader should process the document.
   * @param doc - The document to test.
   * @returns True if the loader should process the document, false otherwise.
   */
  test(doc: LoaderDocument): boolean {
    throw new Error("Not implemented");
  }
}
