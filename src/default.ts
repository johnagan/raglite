import {
  type PipelineInput,
  type IMetadata,
  type IRecord,
  EmbeddingLoader,
  DataStoreLoader,
  DocxLoader,
  FileLoader,
  UrlLoader,
  PdfLoader,
  Pipeline,
} from "./index.js";

/**
 * Loads a document into the data store.
 * @param input - The input to load.
 * @param metadata - The metadata to load.
 * @returns The loaded record.
 */
export function load(
  input: PipelineInput,
  metadata?: IMetadata
): Promise<IRecord[]> {
  const writer = new Pipeline([
    new UrlLoader(),
    new FileLoader(),
    new PdfLoader(),
    new DocxLoader(),
    new EmbeddingLoader(),
    new DataStoreLoader(),
  ]);

  return writer.load(input, metadata);
}

/**
 * Searches the data store for a record.
 * @param input - The input to search.
 * @param metadata - The metadata to search.
 * @returns The search results.
 */
export function search(
  input: PipelineInput,
  metadata?: IMetadata
): Promise<IRecord[]> {
  const reader = new Pipeline([
    new EmbeddingLoader(),
    new DataStoreLoader({ search: true }),
  ]);

  return reader.load(input, metadata);
}
