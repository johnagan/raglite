import { encoding_for_model, TiktokenModel } from "tiktoken";
import type { IModel } from "../core";
import { OpenAI } from "openai";
import { z } from "zod";

/**
 * The arguments for the OpenAIModel class.
 */
export const OpenAIModelArgsSchema = z.object({
  apiKey: z.string().nonempty().describe("The API key for OpenAI"),
  model: z.string().optional().describe("The model to use for embedding"),
  dimensions: z.number().optional().describe("The dimensions of the embedding"),
  maxTokens: z.number().optional().describe("The maximum number of tokens to embed"),
});

export type OpenAIModelArgs = z.infer<typeof OpenAIModelArgsSchema>;

/**
 * The options for the OpenAIModel class.
 */
export const OpenAIModelOptionsSchema = OpenAIModelArgsSchema.extend({
  maxTokens: z.number().default(200),
  dimensions: z.number().default(1536),
  model: z.string().default("text-embedding-3-small"),
});

export type OpenAIModelOptions = z.infer<typeof OpenAIModelOptionsSchema>;

/**
 * A model that uses OpenAI to create embeddings.
 */
export class OpenAIModel implements IModel {
  options: OpenAIModelOptions;
  client: OpenAI;

  /**
   * The constructor for the OpenAIModel class.
   * @param options - The options for the OpenAIModel class.
   */
  constructor(options: OpenAIModelArgs) {
    this.options = OpenAIModelOptionsSchema.parse(options);
    this.client = new OpenAI({ apiKey: this.options.apiKey });
  }

  /**
   * Embed a text string.
   * @param input - The text to embed.
   * @returns The embedding for the text.
   */
  async embed(input: string): Promise<number[]> {
    const { model } = this.options;
    const { data } = await this.client.embeddings.create({ model, input });
    return data[0].embedding;
  }

  /**
   * Get chunks of text from a string.
   * @param input - The text to get chunks from.
   * @returns The chunks of text.
   */
  async *chunks(input: string): AsyncGenerator<string> {
    const { model, maxTokens } = this.options;
    const encoding = encoding_for_model(model as TiktokenModel);

    // Encode the content into tokens
    const tokens = encoding.encode(input);

    // Split the content into chunks
    for (let i = 0; i < tokens.length; i += maxTokens) {
      const chunk = tokens.slice(i, i + maxTokens);
      const decoded = encoding.decode(chunk);
      yield new TextDecoder().decode(decoded);
    }

    // Free the encoding
    encoding.free();
  }
}
