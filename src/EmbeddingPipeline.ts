import { BaseDocumentLoader, LoaderDocumentCallback } from "./core/BaseDocumentLoader";
import { DocxLoader } from "./loaders/DocxLoader";
import { TextLoader } from "./loaders/TextLoader";
import { PdfLoader } from "./loaders/PdfLoader";
import { pipeline } from "stream/promises";
import { LoaderDocument } from "./types";
import { IModel } from "./core/IModel";

/**
 * A pipeline for loading documents.
 */
export class EmbeddingPipeline {
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
      async transform({ content, metadata }: LoaderDocument, callback: LoaderDocumentCallback) {
        // If the content is not a string, push the data and return
        if (typeof content === "string") {
          const vector = await model.embed(content);
          this.push({ content, metadata, vector });
        }
        callback();
      },
    });
  }

  /**
   * Get the chunk loader.
   * @returns The chunk loader.
   */
  getChunkLoader() {
    const { model } = this;
    return new BaseDocumentLoader({
      async transform({ content, metadata }: LoaderDocument, callback: LoaderDocumentCallback) {
        // If the content is not a string, push the data and return
        if (typeof content === "string") {
          for await (const chunk of model.chunks(content)) {
            const vector = await model.embed(chunk);
            this.push({ content: chunk, metadata, vector });
          }
        }
        callback();
      },
    });
  }

  /**
   * Takes a string or Buffer and resolves it to a Buffer, possibly via URL or file.
   * @param doc - The document to load
   * @returns The documents
   */
  async load(doc: LoaderDocument): Promise<LoaderDocument[]> {
    return new Promise(async (resolve, reject) => {
      // Create the input loader
      const reader = new TextLoader(doc);

      // Create the final loader
      const finalLoader = this.getEmbeddingLoader();
      finalLoader.on("documents", resolve);

      // Create the loaders
      const loaders = [new PdfLoader(), new DocxLoader()];

      // Run the pipeline
      await pipeline([reader, ...loaders, finalLoader]).catch(reject);
    });
  }
}
