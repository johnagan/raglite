import type { IContent, IMetadata, IRecord } from "./IDocument";
import type { IConfig } from "./IConfig";
import { LoaderEvent } from "./Loader";
import { pipeline } from "stream/promises";
import { Readable } from "stream";

/**
 * A pipeline for loading documents.
 */
export class Pipeline {
  /**
   * Constructor.
   * @param config - The config for the pipeline.
   */
  constructor(private config: IConfig) {}

  /**
   * Takes a string or Buffer and resolves it to a Buffer, possibly via URL or file.
   * @param content - The content to load
   * @param metadata - The metadata to attach to the document
   * @returns The documents
   */
  async load(content: IContent, metadata?: IMetadata): Promise<IRecord[]> {
    // Create the loaders
    const loaders = [
      Readable.from([{ content, metadata }], { objectMode: true }),
      ...this.config.loaders,
    ];

    return new Promise(async (resolve, reject) => {
      // Listen for the final loader
      loaders[loaders.length - 1].on(LoaderEvent.COMPLETED, resolve);

      // Run the pipeline
      await pipeline([...loaders]).catch(reject);
    });
  }
}
