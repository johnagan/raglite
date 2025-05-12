import { z } from "zod";

/**
 * A chunk of text with its embedding.
 */
export const ChunkSchema = z.object({
  content: z.string().describe("The text content of the chunk"),
  embedding: z.number().array().describe("The embedding vector for the chunk"),
});

export type Chunk = z.infer<typeof ChunkSchema>;

export class BaseModel {
  /**
   * Create an embedding for a string.
   * @param text - The string to create an embedding for.
   * @returns The embedding for the string.
   */
  async embed(text: string): Promise<number[]> {
    throw new Error("Not implemented");
  }

  /**
   * Get chunks of text from a string.
   * @param text - The text to get chunks from.
   * @param maxWords - The maximum number of words per chunk.
   * @returns The chunks of text.
   */
  async *getTextChunks(text: string, maxWords: number = 200): AsyncGenerator<string> {
    const words = text.split(/\s+/);

    // Yield chunks of text
    for (let i = 0; i < words.length; i += maxWords) {
      yield words.slice(i, i + maxWords).join(" ");
    }
  }

  /**
   * Embed text into a vector space.
   * @param text - The text to embed.
   * @param maxTokens - The maximum number of tokens per chunk.
   * @returns The embeddings of the text.
   */
  async embedTextIntoChunks(text: string): Promise<Chunk[]> {
    const chunks: Chunk[] = [];

    // Embed each text chunk
    for await (const chunk of this.getTextChunks(text)) {
      const embedding = await this.embed(chunk);
      chunks.push({ content: chunk, embedding });
    }

    return chunks;
  }
}
