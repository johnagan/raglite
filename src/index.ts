import { LibSQLStore, LibSQLStoreOptionsSchema } from "./stores/LibSQLStore";
import { OpenAIModelOptionsSchema, OpenAIModel } from "./models/OpenAIModel";
import { EmbeddingPipeline } from "./EmbeddingPipeline";
import { Metadata } from "./types";

import { z } from "zod";

export const RAGLiteOptionsSchema = LibSQLStoreOptionsSchema.merge(OpenAIModelOptionsSchema);

export type RAGLiteOptions = z.infer<typeof RAGLiteOptionsSchema>;

const Store = LibSQLStore;

export class RAGLite {
  pipeline: EmbeddingPipeline;
  model: OpenAIModel;
  store: LibSQLStore;

  /**
   * The constructor for the RAGLite class.
   * @param options - The options for the RAGLite class.
   */
  constructor(options: RAGLiteOptions) {
    this.model = new OpenAIModel(options);
    this.pipeline = new EmbeddingPipeline(options);
    this.store = new Store(options);
  }

  /**
   * Loads a PDF file into the store.
   * @param content - The content, URL, file path,or buffer to load.
   * @param metadata - The metadata to load.
   */
  async load(input: string | Buffer, metadata: Metadata) {
    const docs = await this.pipeline.load({ content: input, metadata });

    if (!docs) {
      throw new Error("No document found");
    }

    for (const doc of docs) {
      await this.store.addDocument(doc);
    }
  }

  /**
   * Searches the store for documents that match the text.
   * @param text - The text to search for.
   * @param results - The number of results to return.
   */
  async search(text: string, results: number = 3) {
    const vectorQuery = await this.pipeline.embed(text);
    return this.store.search(vectorQuery, results);
  }
}
