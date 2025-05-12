import { BaseLoader, LoaderData, LoaderInput, Metadata, Document } from "@root/core";

/**
 * Takes a Buffer and resolves it to an array of Documents, possibly via Docx.
 */
export class ContentLoader extends BaseLoader {
  /**
   * Transform the data
   * @param data - The data to transform
   * @returns The transformed data
   */
  async transform(data: LoaderData) {
    const content = data.input as string;
    data.documents = [{ content, metadata: data.metadata }];
    return data;
  }

  /**
   * Detect if a buffer is a PDF file.
   * @param buffer - The buffer to detect
   * @returns True if the buffer is a PDF file, false otherwise.
   */
  test(input: LoaderInput): boolean {
    return typeof input === "string";
  }
}
