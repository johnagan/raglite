import { type IConfig, type IDocument } from ".";
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
   * @param doc - The document to load
   * @returns The documents
   */
  async load(doc: IDocument): Promise<IDocument[]> {
    // Create the loaders
    const streams = [
      Readable.from([doc], { objectMode: true }),
      ...this.config.loaders,
    ];

    return new Promise(async (resolve, reject) => {
      // Listen for the final loader
      streams[streams.length - 1].on("documents", resolve);

      // Run the pipeline
      await pipeline([...streams]).catch(reject);
    });
  }
}
