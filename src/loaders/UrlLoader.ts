import {
  Loader,
  type IContent,
  type IDocument,
  type ILoaderOptions,
  type ILoaderCallback,
} from "../core/index.js";

export interface IUrlLoaderOptions<T extends UrlLoader = UrlLoader>
  extends ILoaderOptions<T> {
  fetchOptions?: RequestInit;
  input?: IContent | IDocument | (IContent | IDocument)[];
}

/** A loader for URL content. */
export class UrlLoader extends Loader {
  /**
   * Constructor.
   * @param options - The options for the URL loader.
   */
  constructor(public options: IUrlLoaderOptions = {}) {
    super({ ...options });
  }

  /**
   * Transform the data
   * @param doc - The data to transform
   * @param callback - The callback to call when the data is transformed
   */
  async _load(doc: IDocument, callback: ILoaderCallback) {
    const url = doc.content as string;

    // Fetch the URL
    const response = await fetch(url, this.options.fetchOptions);

    if (!response.ok) {
      const error = new Error(`Failed to fetch URL: ${url}`);
      callback(error);
      return;
    }

    // If the content type is text-based, set the content to the text
    const contentType = response.headers?.get("content-type") || "";

    if (/^(text|json)/.test(contentType)) {
      doc.content = await response.text();
    } else {
      const bufferArray = await response.arrayBuffer();
      doc.content = Buffer.from(bufferArray);
    }

    // Update the metadata
    doc.metadata.url = url;
    doc.metadata.headers = Object.fromEntries(response.headers.entries());

    callback(null, doc);
  }

  /**
   * Test if the loader should process the document.
   * @param doc - The document to test.
   * @returns True if the loader should process the document, false otherwise.
   */
  _test(doc: IDocument) {
    const { content } = doc;
    return typeof content === "string" && /^https?:\/\//.test(content);
  }
}

export default UrlLoader;
