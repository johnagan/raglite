import {
  Loader,
  type IDocument,
  type IStore,
  type ILoaderCallback,
} from "../core";

export class StoreLoader extends Loader {
  constructor(private store: IStore) {
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
    const result = await this.store.insert(doc);
    this.process(result);
    callback();
  }

  /**
   * Test if the document should be processed.
   * @param doc - The document to test.
   * @returns True if the document should be processed, false otherwise.
   */
  _test({ content, vector }: IDocument) {
    return typeof content === "string" && Array.isArray(vector);
  }
}
