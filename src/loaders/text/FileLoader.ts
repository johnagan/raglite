import { BaseLoader, LoaderData, LoaderInput } from "@root/core";
import { existsSync, readFileSync } from "fs";

/**
 * Loads a file and returns a Buffer.
 */
export class FileLoader extends BaseLoader {
  /**
   * Transform the data
   * @param data - The data to transform
   * @returns The transformed data
   */
  async transform(data: LoaderData) {
    const { input } = data;
    data.input = readFileSync(input as string);
    return data;
  }

  /**
   * Detect if a buffer is a PDF file.
   * @param buffer - The buffer to detect
   * @returns True if the buffer is a PDF file, false otherwise.
   */
  test(input: LoaderInput): boolean {
    return typeof input === "string" && existsSync(input);
  }
}
