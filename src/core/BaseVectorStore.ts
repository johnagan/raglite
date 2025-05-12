import { DocumentSchema, Document, BaseModel, LoaderInput, LoaderData, Metadata } from "./index";

import { z } from "zod";

export const EmbeddableDocumentSchema = DocumentSchema.extend({
  id: z.number().describe("The id of the document"),
  vector: z.number().array().describe("The vector of the document"),
});

export type EmbeddableDocument = z.infer<typeof EmbeddableDocumentSchema>;

export const BaseVectorStoreArgsSchema = z.object({
  model: z.instanceof(BaseModel).describe("The model to use for the vector store"),
});

export type BaseVectorStoreArgs = z.infer<typeof BaseVectorStoreArgsSchema>;

/**
 * The base class for a vector store
 */
export class BaseVectorStore {
  model: BaseModel;

  /**
   * The constructor for the BaseVectorStore class
   * @param args - The arguments for the BaseVectorStore class
   */
  constructor(args: BaseVectorStoreArgs) {
    this.model = args.model;
  }

  // /**
  //  * Takes a string or Buffer and resolves it to a Buffer, possibly via URL or file.
  //  * @param input - The input to load
  //  * @param metadata - Additional metadata to be added to all documents.
  //  * @returns The documents
  //  */
  // async load(input: LoaderInput, metadata: Metadata = {}) {
  //   const data: LoaderData = { input, metadata };
  //   const readable = Readable.from([data], { objectMode: true });

  //   await pipeline([readable, urlLoader, fileLoader, contentLoader, pdfLoader, docxLoader]);

  //   if (data.documents) {
  //     this.addDocuments(data.documents);
  //   }
  // }

  /**
   * Reset the vector store
   */
  async reset() {
    throw new Error("Not implemented");
  }

  /**
   * Get a document by its id
   * @param id - The id of the document
   * @returns The document
   */
  async getOne(id: number): Promise<EmbeddableDocument> {
    throw new Error("Not implemented");
  }

  /**
   * Add a document to the vector store
   * @param document - The document to add
   * @returns The document
   */
  async addDocument(document: Document): Promise<EmbeddableDocument> {
    throw new Error("Not implemented");
  }

  /**
   * Add multiple documents to the vector store
   * @param documents - The documents to add
   * @returns The documents
   */
  async addDocuments(documents: Document[]): Promise<EmbeddableDocument[]> {
    return Promise.all(documents.map((document) => this.addDocument(document)));
  }

  /**
   * Search for documents by a text query
   * @param text - The text query
   * @param results - The number of results to return
   * @returns The documents
   */
  async search(text: string, results: number = 3): Promise<EmbeddableDocument[]> {
    throw new Error("Not implemented");
  }
}
