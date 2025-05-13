import type { LoaderDocument } from "./LoaderDocument";

export interface IStore {
  options: any;
  /**
   * Adds a document to the store.
   * @param doc - The document to add.
   * @returns The added document.
   */
  addDocument: (doc: LoaderDocument) => Promise<LoaderDocument>;

  /**
   * Gets a document from the store.
   * @param id - The id of the document to get.
   * @returns The document.
   */
  getOne: (id: number) => Promise<LoaderDocument>;

  /**
   * Searches the store for documents.
   * @param vector - The vector to search for.
   * @param limit - The number of results to return.
   * @returns The search results.
   */
  search: (vector: number[], limit: number) => Promise<LoaderDocument[]>;

  /**
   * Resets the store.
   */
  reset: () => Promise<void>;
}