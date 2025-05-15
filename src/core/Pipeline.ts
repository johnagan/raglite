import type { IContent, IMetadata, IRecord } from "./IDocument";
import type { IConfig } from "./IConfig";
import { LoaderEvent } from "./Loader";
import { pipeline } from "stream/promises";
import { Readable } from "stream";

const DEFAULT_CONFIG_FILE = "ragpipe.config";

export type ConfigOrPath = IConfig | string;

/**
 * A pipeline for loading documents.
 */
export class Pipeline {
  private config?: IConfig;

  /**
   * Constructor.
   * @param config - The config for the pipeline.
   */
  constructor(config?: ConfigOrPath) {
    if (!config || typeof config === "string") {
      this.loadFromConfigFile(config);
    } else {
      this.config = config;
    }
  }

  async loadFromConfigFile(configPath?: string): Promise<void> {
    try {
      // If the config path is not provided, use the current working directory
      configPath = configPath || process.cwd();

      // If the config path is a directory, add /ragpipe.config to the path
      if (!configPath.match(/\.(js|ts)$/)) {
        configPath = configPath + "/" + DEFAULT_CONFIG_FILE;
      }

      // Import the config file
      const module = await import(configPath);
      this.config = module.default || module;
    } catch (error) {
      throw new Error(`No ragpipe.config found in ${process.cwd()}`);
    }
  }

  /**
   * Takes a string or Buffer and resolves it to a Buffer, possibly via URL or file.
   * @param content - The content to load
   * @param metadata - The metadata to attach to the document
   * @returns The documents
   */
  async load(content: IContent, metadata?: IMetadata): Promise<IRecord[]> {
    // If no config is provided, throw an error
    if (!this.config) {
      throw new Error("No config provided");
    }

    // Create the loaders
    const loaders = [
      Readable.from([{ content, metadata }], { objectMode: true }),
      ...(this.config.loaders || []),
    ];

    return new Promise(async (resolve, reject) => {
      // Listen for the final loader
      loaders[loaders.length - 1].on(LoaderEvent.COMPLETED, resolve);

      // Run the pipeline
      await pipeline([...loaders]).catch(reject);
    });
  }

  /**
   * Creates a Pipeline instance from a config file.
   * @returns A Pipeline instance configured from ragpipe.config
   */
  static async fromConfigFile(config?: ConfigOrPath): Promise<Pipeline> {
    return new Pipeline(config);
  }
}

/**
 * Takes a string or Buffer and resolves it to a Buffer, possibly via URL or file.
 * @param content - The content to load
 * @param metadata - The metadata to attach to the document
 * @returns The documents
 */
export async function load(
  content: IContent,
  metadata?: IMetadata,
  config?: ConfigOrPath,
): Promise<IRecord[]> {
  const pipeline = new Pipeline(config);
  return pipeline.load(content, metadata);
}
