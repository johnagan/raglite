import { z } from "zod";

/**
 * The schema of the metadata record
 */
export type Metadata = Record<string, any>;

/**
 * The schema of the loader document record
 */
export const LoaderDocumentSchema = z.object({
  content: z.union([z.string(), z.instanceof(Buffer)]).describe("The content of the document"),
  metadata: z.record(z.string(), z.any()).default({}).describe("The metadata of the document"),
  vector: z.number().array().optional().describe("The vector of the document"),
});

export type LoaderDocument = z.infer<typeof LoaderDocumentSchema>;
