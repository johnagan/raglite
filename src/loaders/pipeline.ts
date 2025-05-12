import { LoaderData, LoaderInput, Metadata } from "@root/core";
import { InputLoader } from "./InputLoader";
import * as docLoaders from "./document";
import { pipeline } from "stream/promises";

/**
 * Takes a string or Buffer and resolves it to a Buffer, possibly via URL or file.
 * @param input - The input to load
 * @param metadata - Additional metadata to be added to all documents.
 * @returns The documents
 */
export async function load(input: LoaderInput, metadata: Metadata = {}) {
  const data: LoaderData = { input, metadata };

  // Create the input loader
  const inputLoader = new InputLoader(data);

  // Create a map of all the loaders
  const docLoaderMap = Object.values(docLoaders).map((loader) => new loader());

  // Run the pipeline
  await pipeline([inputLoader, ...docLoaderMap]);

  // Return the documents
  return data.documents;
}
