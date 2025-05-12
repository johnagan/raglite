import { BaseLoader, LoaderData, Document, Metadata, LoaderInput } from "@root/core";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

export class PdfLoader extends BaseLoader {
  /**
   * Load a PDF document and return the text content.
   * @returns The text content of the PDF document
   */
  async loadDocuments(buffer: Buffer, metadata: Metadata = {}): Promise<Document[]> {
    const data = new Uint8Array(buffer);
    const loadingTask = getDocument({ data });
    const pdf = await loadingTask.promise;
    const documents: Document[] = [];
    const { info } = await pdf.getMetadata();

    // Iterate over each page in the PDF document
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();

      // Join the text content into a single string
      const content = textContent.items.map((item: any) => item.str).join(" ");

      // Create a metadata object with the page number and the info from the PDF
      const pageMetadata = { ...metadata, ...info, pageNumber: i };

      // Push the document to the documents array
      documents.push({ content, metadata: pageMetadata });
    }

    return documents;
  }

  /**
   * Detect if a buffer is a PDF file.
   * @param input - The input to detect
   * @returns True if the input is a PDF file, false otherwise.
   */
  test(input: LoaderInput): boolean {
    return input instanceof Buffer && input.subarray(0, 4).toString("hex") === "25504446";
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
}
