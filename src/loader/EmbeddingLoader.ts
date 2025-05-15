import {
  Loader,
  type IDocument,
  type ILoaderCallback,
  type IModel,
} from "../core";

/**
 * A stream that chunks a document into smaller chunks and embeds them.
 */
export class EmbeddingLoader extends Loader {
  constructor(private model: IModel) {
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
    try {
      const { content, metadata } = doc;
      for await (const chunk of this.model.chunks(content as string)) {
        const vector = await this.model.embed(chunk);
        this.process({ content: chunk, metadata, vector });
      }
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
    return typeof doc.content === "string";
  }
}
