import type { IContent, IDocument, IMetadata, IRecord } from "./IDocument.js";
import { Loader, LoaderEvent } from "./Loader.js";
import { DocumentSchema } from "./IDocument.js";
import { pipeline } from "stream/promises";
import { Readable } from "stream";

export type PipelineInput = IContent | IDocument | (IContent | IDocument)[];

/**
 * A pipeline for loading documents.
 */
export class Pipeline {
  /**
   * Constructor.
   * @param loaders - The loaders for the pipeline.
   */
  constructor(public loaders: Loader[]) {}

  /**
   * Takes a string or Buffer and resolves it to a Buffer, possibly via URL or file.
   * @param content - The content to load
   * @param metadata - The metadata to attach to the document
   * @returns The documents
   */
  async load(
    input: PipelineInput,
    metadata: IMetadata = {}
  ): Promise<IRecord[]> {
    // ensure the input is an array
    const contentParts = Array.isArray(input) ? input : [input];

    // normalize the input to documents
    const documents = contentParts.map((content) => {
      const { success, data } = DocumentSchema.safeParse(content);
      const doc = success ? data : { content, metadata };
      Object.assign(doc.metadata, metadata);
      return doc;
    });

    return new Promise(async (resolve, reject) => {
      // Create the queue of loaders
      const loaderQueue = [Readable.from(documents), ...(this.loaders || [])];

      // Resolve when the last loader completes
      loaderQueue[loaderQueue.length - 1].on(LoaderEvent.COMPLETED, resolve);

      // Run the pipeline
      await pipeline([...loaderQueue]).catch(reject);
    });
  }
}
