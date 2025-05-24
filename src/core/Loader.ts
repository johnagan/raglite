import { Transform, TransformOptions } from "stream";
import { type IDocument, DocumentSchema } from "./IDocument.js";
import { z } from "zod";

export enum LoaderEvent {
  COMPLETED = "completed",
  PROCESSED = "processed",
  RECEIVED = "received",
  SKIPPED = "skipped",
  ERROR = "error",
}

export type ILoaderErrorEvent = {
  doc: IDocument;
  error: Error;
};

/**
 * A callback for the loader.
 */
export interface ILoaderCallback {
  (error?: Error | null, doc?: IDocument): void;
}

/**
 * Options for the loader.
 */
export interface ILoaderOptions<T extends Loader = Loader>
  extends TransformOptions<T> {
  load?(this: T, doc: IDocument, callback: ILoaderCallback): void;
  complete?(this: T, docs: IDocument[], callback: ILoaderCallback): void;
  test?(this: T, doc: IDocument): boolean;
  schema?: z.ZodSchema;
}

/**
 * A loader for the pipeline.
 */
export class Loader extends Transform implements ILoaderOptions {
  processed: IDocument[] = [];
  received: IDocument[] = [];
  skipped: IDocument[] = [];
  errors: IDocument[] = [];

  /**
   * Constructor.
   * @param options - The options for the document loader.
   */
  constructor(public options: ILoaderOptions = {}) {
    super({ objectMode: true, ...options });
  }

  /**
   * Load the document.
   * @param doc - The document to load.
   * @param callback - The callback to call when the document is loaded.
   */
  _load(doc: IDocument, callback: ILoaderCallback) {
    callback(null, doc);
  }

  /**
   * Load the document.
   * @param doc - The document to load.
   * @param callback - The callback to call when the document is loaded.
   */
  _transform(
    doc: IDocument,
    _encoding: BufferEncoding,
    callback: ILoaderCallback
  ) {
    try {
      doc = DocumentSchema.parse(doc);

      // Create a load callback
      const loadCallback = (error?: unknown, updatedDoc?: IDocument) => {
        if (error) {
          this.error(updatedDoc || doc, error);
        } else if (updatedDoc) {
          this.process(updatedDoc);
        }
        this._final(callback);
      };

      // Call load from options or default
      if (this.options.load) {
        this.options.load.call(this, doc, loadCallback);
      } else {
        this._load(doc, loadCallback);
      }
    } catch (error) {
      this.error(doc, error);
      this._final(callback);
    }
  }

  /**
   * Write the document.
   * @param doc - The document to transform.
   * @param encoding - The encoding of the document.
   * @param callback - The callback to call when the document is transformed.
   */
  _write(doc: IDocument, encoding: BufferEncoding, callback: ILoaderCallback) {
    try {
      // Add the document to the documents received
      this.received.push(doc);
      this.emit(LoaderEvent.RECEIVED, doc);

      // Attempt to parse the document
      const { success, error, data } = DocumentSchema.safeParse(doc);

      // Test if the document should be processed
      if (!success || !this._test(data)) {
        // Log the parsing error
        if (error) {
          console.error(error);
        }

        this.skip(doc);
        this._final(callback);
        return;
      }

      // Transform the document
      super._write(data, encoding, callback);
    } catch (error) {
      this.error(doc, error);
      this._final(callback);
    }
  }

  /**
   * Finalize the stream.
   * @param callback - The callback to call when the stream is finalized.
   */
  _final(callback: ILoaderCallback) {
    this.emit(LoaderEvent.COMPLETED, this.processed);
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

  /**
   * Process the document.
   * @param doc - The document to process.
   */
  process(doc: IDocument) {
    this.processed.push(doc);
    this.emit(LoaderEvent.PROCESSED, doc);

    // Push the document to the stream
    return this.push(doc);
  }

  /**
   * Skip the document.
   * @param doc - The document to skip.
   */
  skip(doc: IDocument) {
    this.skipped.push(doc);
    this.emit(LoaderEvent.SKIPPED, doc);

    // Push the document to the stream
    return this.push(doc);
  }

  /**
   * Error the document.
   * @param doc - The document to error.
   * @param error - The error details.
   */
  error(doc: IDocument, error: unknown) {
    console.error(error);
    this.errors.push(doc);
    this.emit(LoaderEvent.ERROR, { doc, error });

    // Push the document to the stream
    return this.push(doc);
  }

  /**
   * Listen for the documents loaded event.
   * @param listener - The listener to listen for.
   */
  on(event: LoaderEvent | string, listener: (...args: any[]) => void) {
    return super.on(event, listener);
  }

  /**
   * Listen for the documents loaded event.
   * @param listener - The listener to listen for.
   */
  once(event: LoaderEvent | string, listener: (...args: any[]) => void) {
    return super.once(event, listener);
  }

  /**
   * Emit the event.
   * @param event - The event to emit.
   * @param args - The arguments to emit.
   */
  emit(event: LoaderEvent | string, ...args: any[]) {
    return super.emit(event, ...args);
  }
}
