import { LoaderData, LoaderInput, Metadata } from "@root/core";
import * as docLoaders from "./document";
import * as textLoaders from "./text";
import { pipeline } from "stream/promises";
import { Readable } from "stream";

/**
 * Takes a string or Buffer and resolves it to a Buffer, possibly via URL or file.
 * @param input - The input to load
 * @param metadata - Additional metadata to be added to all documents.
 * @returns The documents
 */
export async function load(input: LoaderInput, metadata: Metadata = {}) {
  const data: LoaderData = { input, metadata };
  const readable = Readable.from([data], { objectMode: true });

  // Create a map of all the loaders
  const textLoaderMap = Object.values(textLoaders).map((loader) => new loader());
  const docLoaderMap = Object.values(docLoaders).map((loader) => new loader());

  // Run the pipeline
  await pipeline([readable, ...textLoaderMap, ...docLoaderMap]);

  // Return the documents
  return data.documents;
}
