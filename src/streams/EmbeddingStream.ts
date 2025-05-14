import { Stream, type IDocument, type IStreamCallback, type IModel } from "../core";

/**
 * A stream that chunks a document into smaller chunks and embeds them.
 */
export class EmbeddingStream extends Stream {
  constructor(private model: IModel) {
    super();
  }

  /**
   * Transform the document.
   * @param doc - The document to transform.
   * @param _encoding - The encoding of the document.
   * @param callback - The callback to call when the document is transformed.
   */
  async _transform({ content, metadata }: IDocument, _encoding: BufferEncoding, callback: IStreamCallback) {
    for await (const chunk of this.model.chunks(content as string)) {
      const vector = await this.model.embed(chunk);
      this.push({ content: chunk, metadata, vector });
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
