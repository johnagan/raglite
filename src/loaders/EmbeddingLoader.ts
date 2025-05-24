import {
  pipeline,
  FeatureExtractionPipelineOptions,
} from "@huggingface/transformers";

import {
  Loader,
  type IDocument,
  type ILoaderCallback,
  type ILoaderOptions,
} from "../core/index.js";

import { z } from "zod";

/**
 * The arguments for the LocalModel class.
 */
export const EmbeddingLoaderOptionsSchema = z.object({
  model: z
    .string()
    .optional()
    .default("sentence-transformers/all-MiniLM-L12-v2")
    .describe("The model to use for embedding"),
  chunkSize: z
    .number()
    .optional()
    .default(200)
    .describe("The maximum number of words to embed per chunk"),
  overlap: z
    .number()
    .optional()
    .default(0)
    .describe("The number of words to overlap between chunks"),
});

export type EmbeddingLoaderArgs = z.infer<typeof EmbeddingLoaderOptionsSchema>;

export type EmbeddingLoaderOptions = EmbeddingLoaderArgs & {
  chunkSize: number;
  overlap: number;
  model: string;
};

export interface IEmbeddingLoaderOptions<
  T extends EmbeddingLoader = EmbeddingLoader
> extends ILoaderOptions<T>,
    EmbeddingLoaderArgs {}

/**
 * Loads a document and returns the text content as an embedding.
 */
export class EmbeddingLoader extends Loader {
  constructor(public options: IEmbeddingLoaderOptions = {}) {
    super({ ...options });
  }

  /**
   * Transform the data
   * @param doc - The document to transform
   * @param callback - The callback to call when the data is transformed
   */
  async _load(doc: IDocument, callback: ILoaderCallback) {
    const content = (doc.content as string).trim();

    // nothing to do if the content is empty
    if (content === "") {
      callback();
      return;
    }

    // parse the options
    const { model } = EmbeddingLoaderOptionsSchema.parse(
      this.options
    ) as EmbeddingLoaderOptions;

    // create the embedder
    const embedder = await pipeline("feature-extraction", model, {
      dtype: "fp32",
    });

    // create the embedder options
    const embedderOptions: FeatureExtractionPipelineOptions = {
      pooling: "mean",
      normalize: true,
    };

    for await (const chunk of this.chunks(content)) {
      const { data } = await embedder(chunk, embedderOptions);
      doc.content = chunk;
      doc.vector = Array.from(data);
      this.process(doc);
    }

    callback();
  }

  /**
   * Chunks text into smaller pieces based on word count
   * @param text - The input text to chunk
   * @returns Array of text chunks
   */
  async *chunks(text: string): AsyncGenerator<string> {
    // parse the options
    let { chunkSize, overlap } = EmbeddingLoaderOptionsSchema.parse(
      this.options
    );

    // Split text into words (handles multiple spaces, newlines, etc.)
    const words = text
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0);

    if (words.length <= chunkSize) {
      yield text;
      return;
    }

    // Prevent infinite loop: overlap can't be >= chunkSize
    if (overlap >= chunkSize) {
      overlap = chunkSize - 1;
    }

    let startIndex = 0;

    while (startIndex < words.length) {
      // Calculate end index for this chunk
      const endIndex = Math.min(startIndex + chunkSize, words.length);

      // Extract chunk words and join them
      const chunkWords = words.slice(startIndex, endIndex);
      const chunk = chunkWords.join(" ");

      yield chunk;

      // Move to next chunk position, accounting for overlap
      const step = chunkSize - overlap;
      startIndex += step;

      // Safety check: ensure we're making progress
      if (step <= 0) {
        break;
      }
    }
  }

  /**
   * Test if the loader should process the document.
   * @param doc - The document to test.
   * @returns True if the loader should process the document, false otherwise.
   */
  _test(doc: IDocument): boolean {
    return typeof doc.content === "string";
  }
}

export default EmbeddingLoader;
