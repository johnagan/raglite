import { LibSQLStore, LibSQLStoreOptionsSchema } from "./stores/LibSQLStore";
import { OpenAIModelOptionsSchema, OpenAIModel } from "./models/OpenAIModel";
import type { IContent, IMetadata, IModel, IStore } from "./core";
import { Pipeline } from "./Pipeline";
import { z } from "zod";

export const RAGLiteOptionsSchema = LibSQLStoreOptionsSchema.merge(OpenAIModelOptionsSchema);

export type RAGLiteOptions = z.infer<typeof RAGLiteOptionsSchema>;

const Model = OpenAIModel;
const Store = LibSQLStore;

export class RAGLite {
  pipeline: Pipeline;
  model: IModel;
  store: IStore;

  /**
   * The constructor for the RAGLite class.
   * @param options - The options for the RAGLite class.
   */
  constructor(options: RAGLiteOptions) {
    this.model = new Model(options);
    this.pipeline = new Pipeline(this.model);
    this.store = new Store(options);
  }

  /**
   * Loads a PDF file into the store.
   * @param content - The content, URL, file path,or buffer to load.
   * @param metadata - The metadata to load.
   */
  async load(content: IContent, metadata: IMetadata) {
    const docs = await this.pipeline.load({ content, metadata });

    if (!docs) {
      throw new Error("No document found");
    }

    for (const doc of docs) {
      await this.store.insert(doc);
    }

    return docs;
  }

  /**
   * Searches the store for documents that match the text.
   * @param text - The text to search for.
   * @param results - The number of results to return.
   */
  async search(text: string, results: number = 3) {
    const vectorQuery = await this.model.embed(text);
    return this.store.search(vectorQuery, results);
  }
}
