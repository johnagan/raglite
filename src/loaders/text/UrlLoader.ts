import { BaseLoader, LoaderData, LoaderInput } from "@root/core";

/**
 * Loads a URL and returns a Buffer.
 */
export class UrlLoader extends BaseLoader {
  /**
   * Transform the data
   * @param data - The data to transform
   * @returns The transformed data
   */
  async transform(data: LoaderData) {
    const input = data.input as string;
    const res = await fetch(input);
    const body = await res.arrayBuffer();

    data.input = Buffer.from(body);
    return data;
  }

  /**
   * Detect if a buffer is a PDF file.
   * @param buffer - The buffer to detect
   * @returns True if the buffer is a PDF file, false otherwise.
   */
  test(input: LoaderInput): boolean {
    return typeof input === "string" && /^https?:\/\//.test(input);
  }
}
