import { Transform, TransformOptions } from "stream";
import { type IDocument, IDocumentSchema } from "./IDocument.js";

export interface IStreamCallback {
  (error?: Error | null, doc?: IDocument): void;
}

export interface IStreamOptions<T extends Stream = Stream> extends TransformOptions<T> {
  transform?(this: T, doc: IDocument, encoding: BufferEncoding, callback: IStreamCallback): void;
  flush?(this: T, callback: IStreamCallback): void;
  test?(this: T, doc: IDocument): boolean;
}

export class Stream extends Transform {
  /**
   * The documents.
   */
  documents: IDocument[] = [];
  transform?: (this: Stream, doc: IDocument, encoding: BufferEncoding, callback: IStreamCallback) => void;
  flush?: (this: Stream, callback: IStreamCallback) => void;
  test?: (this: Stream, doc: IDocument) => boolean;

  /**
   * Constructor.
   * @param options - The options for the document loader.
   */
  constructor(private options: IStreamOptions = {}) {
    super({ objectMode: true, ...options });
  }

  /**
   * Write the document.
   * @param doc - The document to transform.
   * @param encoding - The encoding of the document.
   * @param callback - The callback to call when the document is transformed.
   */
  _write(doc: IDocument, encoding: BufferEncoding, callback: IStreamCallback) {
    const parsedDoc = IDocumentSchema.parse(doc);

    // Test if the document should be processed
    if (!this._test(parsedDoc)) {
      this.push(doc);
      callback();
      return true;
    }

    return super._write(parsedDoc, encoding, callback);
  }

  /**
   * Push the document.
   * @param doc - The document to push.
   */
  push(doc: IDocument) {
    if (doc !== null) {
      this.documents.push(doc);
    }
    return super.push(doc);
  }

  /**
   * Finalize the stream.
   * @param callback - The callback to call when the stream is finalized.
   */
  _final(callback: IStreamCallback) {
    this.emit("documents", this.documents);
    callback();
  }

  /**
   * Test if the loader should process the document.
   * @param doc - The document to test.
   * @returns True if the loader should process the document, false otherwise.
   */
  _test(doc: IDocument): boolean {
    return this.options.test?.call(this, doc) ?? true;
  }
}
