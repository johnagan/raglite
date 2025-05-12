import { BaseModel } from "@root/core";
import { OpenAI } from "openai";
import { z } from "zod";

/**
 * The arguments for the OpenAIModel class.
 */
export const OpenAIModelArgsSchema = z.object({
  model: z.string().optional().describe("The model to use for embedding"),
  apiKey: z.string().nonempty().optional().describe("The API key for OpenAI"),
});

export type OpenAIModelArgs = z.infer<typeof OpenAIModelArgsSchema>;

/**
 * The options for the OpenAIModel class.
 */
export const OpenAIModelOptionsSchema = OpenAIModelArgsSchema.extend({
  model: z.string().default("text-embedding-3-small"),
});

export type OpenAIModelOptions = z.infer<typeof OpenAIModelOptionsSchema>;

/**
 * A model that uses OpenAI to create embeddings.
 */
export class OpenAIModel extends BaseModel {
  options: OpenAIModelOptions;
  client: OpenAI;

  /**
   * The constructor for the OpenAIModel class.
   * @param options - The options for the OpenAIModel class.
   */
  constructor(options: OpenAIModelArgs = {}) {
    super();
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
}
