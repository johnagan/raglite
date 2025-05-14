import type { IDocument, IRecord } from "./IDocument.js";

export interface IStore {
  options: any;
  /**
   * Adds a document to the store.
   * @param doc - The document to add.
   * @returns The added document.
   */
  insert: (doc: IDocument) => Promise<IRecord>;

  /**
   * Gets a document from the store.
   * @param id - The id of the document to get.
   * @returns The document.
   */
  getOne: (id: number) => Promise<IRecord>;

  /**
   * Searches the store for documents.
   * @param vector - The vector to search for.
   * @param limit - The number of results to return.
   * @returns The search results.
   */
  search: (vector: number[], limit: number) => Promise<IRecord[]>;
}
