import { Loader, type IDocument, type ILoaderCallback } from "../core";

/**
 * A stream that loads a URL.
 */
export class UrlLoader extends Loader {
  /**
   * Constructor.
   * @param requestInit - The request init options.
   */
  constructor(private requestInit?: RequestInit) {
    super();
  }

  /**
   * Transform the document.
   * @param doc - The document to transform.
   * @param _encoding - The encoding of the document.
   * @param callback - The callback to call when the document is transformed.
   */
  async _transform(
    doc: IDocument,
    _encoding: BufferEncoding,
    callback: ILoaderCallback,
  ) {
    const url = doc.content as string;

    try {
      // Fetch the URL
      const response = await fetch(url, this.requestInit);

      if (!response.ok) {
        throw new Error(`Failed to fetch URL: ${url}`);
      }

      // Check if content type is text-based
      const contentType = response.headers.get("content-type") || "";

      if (/^(text|json)/.test(contentType)) {
        doc.content = await response.text();
      } else {
        const bufferArray = await response.arrayBuffer();
        doc.content = Buffer.from(bufferArray);
      }

      // Add the URL to the metadata
      doc.metadata = { ...doc.metadata, url };

      this.process(doc);
    } catch (error) {
      this.error(doc, error);
    }

    callback();
  }

  /**
   * Test if the document should be processed.
   * @param doc - The document to test.
   * @returns True if the document should be processed, false otherwise.
   */
  _test(doc: IDocument) {
    return typeof doc.content === "string" && /^https?:/.test(doc.content);
  }
}
