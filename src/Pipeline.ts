import { FileStream, UrlStream, EmbeddingStream, PdfStream, DocxStream, StoreWriterStream } from "./streams";
import { type IModel, type IDocument, type IStore } from "./core";
import { pipeline } from "stream/promises";
import { Readable } from "stream";

/**
 * A pipeline for loading documents.
 */
export class Pipeline {
  /**
   * Constructor.
   * @param model - The model to use for embedding.
   */
  constructor(private model: IModel, private store: IStore) {}

  /**
   * Takes a string or Buffer and resolves it to a Buffer, possibly via URL or file.
   * @param doc - The document to load
   * @returns The documents
   */
  async load(doc: IDocument): Promise<IDocument[]> {
    // Create the loaders
    const streams = [
      Readable.from([doc], { objectMode: true }),
      new UrlStream(),
      new FileStream(),
      new PdfStream(),
      new DocxStream(),
      new EmbeddingStream(this.model),
      new StoreWriterStream(this.store),
    ];

    return new Promise(async (resolve, reject) => {
      // Listen for the final loader
      streams[streams.length - 1].on("documents", resolve);

      // Run the pipeline
      await pipeline([...streams]).catch(reject);
    });
  }
}
