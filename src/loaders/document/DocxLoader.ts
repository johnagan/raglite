import { Document, Metadata, BaseLoader, LoaderData, LoaderInput } from "@root/core";
import mammoth from "mammoth";

/**
 * Loads a Docx document and returns the text content.
 */
export class DocxLoader extends BaseLoader {
  /**
   * Load a Docx document and return the text content.
   * @param data - The buffer to load the document from
   * @param metadata - Additional metadata to be added to all documents.
   * @returns The text content of the Docx document
   */
  async loadDocuments(data: Buffer, metadata: Metadata = {}): Promise<Document[]> {
    const { value: content } = await mammoth.extractRawText({ buffer: data });
    const documents: Document[] = [{ content, metadata }];
    return documents;
  }

  /**
   * Transform the data
   * @param data - The data to transform
   * @returns The transformed data
   */
  async transform(data: LoaderData): Promise<LoaderData> {
    const buffer = data.input as Buffer;
    data.documents = await this.loadDocuments(buffer, data.metadata);
    return data;
  }

  /**
   * Detect if a buffer is a Docx file.
   * @param data - The data to detect
   * @returns True if the buffer is a Docx file, false otherwise.
   */
  test(input: LoaderInput): boolean {
    return input instanceof Buffer && input.subarray(0, 4).toString("hex") === "504b0304";
  }
}
