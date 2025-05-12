import { OpenAIModel, OpenAIModelOptionsSchema } from "@root/models";
import { LibSQLStore, LibSQLStoreOptionsSchema } from "@root/stores";
import { LoaderInput, BaseVectorStore } from "@root/core";
import { load } from "@root/loaders/pipeline";

import { z } from "zod";

export const RAGLiteOptionsSchema = LibSQLStoreOptionsSchema.merge(OpenAIModelOptionsSchema);

export type RAGLiteOptions = z.infer<typeof RAGLiteOptionsSchema>;

const Model = OpenAIModel;
const Store = LibSQLStore;

export class RAGLite {
  store: BaseVectorStore;

  /**
   * The constructor for the RAGLite class.
   * @param options - The options for the RAGLite class.
   */
  constructor(options: RAGLiteOptions) {
    const model = new Model(options);
    this.store = new Store({ ...options, model });
  }

  /**
   * Loads a PDF file into the store.
   * @param input - The PDF file to load.
   */
  async load(input: LoaderInput) {
    const docs = await load(input);

    if (!docs) {
      throw new Error("No document found");
    }

    return this.store.addDocuments(docs);
  }

  /**
   * Searches the store for documents that match the text.
   * @param text - The text to search for.
   * @param results - The number of results to return.
   */
  async search(text: string, results: number = 3) {
    return this.store.search(text, results);
  }
}
