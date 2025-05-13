export interface IModel {
  /**
   * Embed a text string.
   * @param input - The text to embed.
   * @returns The embedding for the text.
   */
  embed(input: string): Promise<number[]>;

  /**
   * Get chunks of text from a string.
   * @param input - The text to get chunks from.
   * @returns The chunks of text.
   */
  chunks(input: string): AsyncGenerator<string>;
}
