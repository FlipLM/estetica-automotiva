import { z } from "zod";

const vector = z.tuple([
  z.number().finite().min(-100).max(100),
  z.number().finite().min(-100).max(100),
  z.number().finite().min(-100).max(100),
]);

export const anchorSchema = z.object({
  version: z.literal(1),
  modelVersion: z.string().min(1).max(100),
  node: z.string().min(1).max(160),
  part: z.string().min(1).max(80),
  position: vector,
  normal: vector,
  revealAny: z.array(z.enum(["door_lf", "door_rf", "door_lr", "door_rr", "hood", "trunk"])).max(6),
}).strict();

export type Anchor = z.infer<typeof anchorSchema>;

export function readAnchor(value: unknown): Anchor | undefined {
  try {
    const parsed = anchorSchema.safeParse(typeof value === "string" ? JSON.parse(value) : value);
    return parsed.success ? parsed.data : undefined;
  } catch {
    return undefined;
  }
}
