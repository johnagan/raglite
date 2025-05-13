import { Transform, TransformOptions } from "stream";
import { LoaderDocument, LoaderDocumentSchema } from "./LoaderDocument";

export interface LoaderDocumentCallback {
  (error?: Error | null, doc?: LoaderDocument): void;
}

export interface LoaderDocumentOptions<T extends BaseDocumentLoader = BaseDocumentLoader> extends TransformOptions<T> {
  transform?(this: T, doc: LoaderDocument, encoding: BufferEncoding, callback: LoaderDocumentCallback): void;
  flush?(this: T, callback: LoaderDocumentCallback): void;
  test?(this: T, doc: LoaderDocument): boolean;
}

export class BaseDocumentLoader extends Transform {
  /**
   * The documents.
   */
  documents: LoaderDocument[] = [];
  transform?: (this: BaseDocumentLoader, doc: LoaderDocument, encoding: BufferEncoding, callback: LoaderDocumentCallback) => void;
  flush?: (this: BaseDocumentLoader, callback: LoaderDocumentCallback) => void;
  test?: (this: BaseDocumentLoader, doc: LoaderDocument) => boolean;

  /**
   * Constructor.
   * @param options - The options for the document loader.
   */
  constructor(options: LoaderDocumentOptions = {}) {
    super({ objectMode: true, ...options });
    this.transform = options.transform?.bind(this);
    this.flush = options.flush?.bind(this);
  }

  /**
   * Transform the document.
   * @param doc - The document to transform.
   * @param encoding - The encoding of the document.
   * @param callback - The callback to call when the document is transformed.
   */
  async _write(doc: LoaderDocument, encoding: BufferEncoding, callback: LoaderDocumentCallback) {
    try {
      const parsedDoc = LoaderDocumentSchema.parse(doc);

      // Test if the document should be processed
      if (!this._test(parsedDoc)) {
        this.push(doc);
        return callback();
      } else {
        // Transform the document
        this._transform(parsedDoc, encoding, callback);
      }
    } catch (error) {
      callback(error as Error);
    }
  }

  /**
   * Transform the document.
   * @param doc - The document to transform.
   * @param encoding - The encoding of the document.
   * @param callback - The callback to call when the document is transformed.
   */
  async _transform(doc: LoaderDocument, encoding: BufferEncoding, callback: LoaderDocumentCallback) {
    this.transform?.(doc, encoding, callback);
  }

  /**
   * Push the document.
   * @param doc - The document to push.
   */
  push(doc: LoaderDocument) {
    this.documents.push(doc);
    return super.push(doc);
  }

  /**
   * Finalize the stream.
   * @param callback - The callback to call when the stream is finalized.
   */
  _final(callback: LoaderDocumentCallback) {
    this.emit("documents", this.documents);
    callback();
  }

  /**
   * Test if the loader should process the document.
   * @param doc - The document to test.
   * @returns True if the loader should process the document, false otherwise.
   */
  _test(doc: LoaderDocument): boolean {
    return this.test ? this.test(doc) : true;
  }
}
