import { z } from "zod";

export const MetaDataSchema = z.any().default({}).describe("The metadata of the document");
export type Metadata = z.infer<typeof MetaDataSchema>;

/**
 * The schema of the document record
 */
export const DocumentSchema = z.object({
  content: z.string().describe("The content of the document"),
  metadata: MetaDataSchema,
});

export type Document = z.infer<typeof DocumentSchema>;
