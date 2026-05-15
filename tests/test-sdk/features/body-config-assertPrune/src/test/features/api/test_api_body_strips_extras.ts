import { TestValidator } from "@nestia/e2e";
import typia from "typia";

import api from "@api";
import { IBbsArticle } from "@api/lib/structures/IBbsArticle";

/**
 * Verifies @TypedBody with `validate: "assertPrune"` strips extras from
 * both the controller input and the spread-back return value.
 *
 * The `Prune`-family modes (`assertPrune`, `validatePrune`,
 * `assertClone`, etc.) are distinguished from plain `assert`/`validate`
 * by exactly this behavior: extras must be removed, not rejected. The
 * controller spreads `input` into its response, so any leak survives
 * the round-trip and is observable through the SDK response. A
 * regression in transformer helper selection would silently fall back
 * to a non-pruning validator and let the extra slip through.
 *
 *  1. Build a valid `IBbsArticle.IStore` and attach an extra property.
 *  2. Send the payload via the SDK (cast `any` to bypass the static type).
 *  3. Assert the SDK response carries no `__unexpected__` key and that
 *     the rest of the article still validates as a well-formed `IBbsArticle`.
 */
export const test_api_body_strips_extras = async (
  connection: api.IConnection,
): Promise<void> => {
  const valid: IBbsArticle.IStore = typia.random<IBbsArticle.IStore>();
  const tainted = {
    ...valid,
    __unexpected__: "should-be-stripped",
  };
  const article: IBbsArticle = await api.functional.body.store(
    connection,
    tainted as IBbsArticle.IStore,
  );
  TestValidator.equals(
    "assertPrune strips unknown property",
    (article as Record<string, unknown>).__unexpected__,
    undefined,
  );
  typia.assertEquals(article);
};
