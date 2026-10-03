import type { tags } from "typia";

/**
 * The declaration a bundler cannot see.
 *
 * `controller.ts` imports this interface with `import type`, so every bundler
 * erases the edge from its own module graph. The transform envelope's `graph`
 * section is the only channel that reports it, and the generated validator in
 * `controller.ts` is built from exactly this shape.
 */
export interface IEnvelopeArticle {
  id: string & tags.Format<"uuid">;
  title: string;
}
