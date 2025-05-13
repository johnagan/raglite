import { BaseDocumentLoader, type LoaderDocumentCallback, type IModel, type LoaderDocument } from "./core";
import { existsSync, readFileSync, statSync } from "fs";
import { DocxLoader } from "./loaders/DocxLoader";
import { PdfLoader } from "./loaders/PdfLoader";
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
  constructor(private model: IModel) {}

  /**
   * Get the embedding loader.
   * @returns The embedding loader.
   */
  getEmbeddingLoader() {
    const { model } = this;
    return new BaseDocumentLoader({
      async transform({ content, metadata }: LoaderDocument, _encoding: BufferEncoding, callback: LoaderDocumentCallback) {
        const vector = await model.embed(content as string);
        this.push({ content, metadata, vector });
        callback();
      },
      test(doc: LoaderDocument) {
        return typeof doc.content === "string";
      }
    });
  }

  /**
   * Get the chunk loader.
   * @returns The chunk loader.
   */
  getChunkLoader() {
    const { model } = this;
    return new BaseDocumentLoader({
      async transform({ content, metadata }: LoaderDocument, _encoding: BufferEncoding, callback: LoaderDocumentCallback) {
        for await (const chunk of model.chunks(content as string)) {
          const vector = await model.embed(chunk);
          this.push({ content: chunk, metadata, vector });
        }
        callback();
      },
      test(doc: LoaderDocument) {
        return typeof doc.content === "string";
      }
    });
  }

  /**
   * Get the URL loader.
   * @returns The URL loader.
   */
  getUrlLoader() {
    return new BaseDocumentLoader({
      async transform(doc: LoaderDocument, _encoding, callback) {
        // Fetch the URL
        const response = await fetch(doc.content as string);
        const bufferArray = await response.arrayBuffer();

        // Update the input
        doc.content = Buffer.from(bufferArray);

        this.push(doc);
        callback();
      },
      test(doc: LoaderDocument) {
        return typeof doc.content === "string" && /^https?:/.test(doc.content);
      }
    });
  }

  /**
   * Get the file loader.
   * @returns The file loader.
   */
  getFileLoader() {
    return new BaseDocumentLoader({
      async transform(doc: LoaderDocument, _encoding, callback) {
        // Read the file
        const buffer = readFileSync(doc.content as string);

        // Update the input
        doc.content = Buffer.from(buffer);

        this.push(doc);
        callback();
      },
      test(doc: LoaderDocument) {
        return typeof doc.content === "string" && existsSync(doc.content) && statSync(doc.content).isFile();
      }
    });
  }

  /**
   * Takes a string or Buffer and resolves it to a Buffer, possibly via URL or file.
   * @param doc - The document to load
   * @returns The documents
   */
  async load(doc: LoaderDocument): Promise<LoaderDocument[]> {

    // Create the loaders
    const loaders = [
      Readable.from([doc], { objectMode: true }),
      this.getUrlLoader(),
      this.getFileLoader(),
      new PdfLoader(),
      new DocxLoader(),
      this.getChunkLoader(),
      this.getEmbeddingLoader()
    ];

    return new Promise(async (resolve, reject) => {
      // Listen for the final loader
      loaders[loaders.length - 1].on("documents", resolve);

      // Run the pipeline
      await pipeline([...loaders]).catch(reject);
    });
  }
}
