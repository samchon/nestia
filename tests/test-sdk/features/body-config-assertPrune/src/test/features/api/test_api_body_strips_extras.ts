import { TestValidator } from "@nestia/e2e";
import typia from "typia";

import api from "@api";
import { IBbsArticle } from "@api/lib/structures/IBbsArticle";

/**
 * Verifies @TypedBody with `validate: "assertPrune"` strips extras from both
 * the controller input and the spread-back return value.
 *
 * The `Prune`-family modes (`assertPrune`, `validatePrune`, `assertClone`,
 * etc.) are distinguished from plain `assert`/`validate` by exactly this
 * behavior: extras must be removed, not rejected. The controller spreads
 * `input` into its response, so any leak survives the round-trip and is
 * observable through the SDK response. A regression in transformer helper
 * selection would silently fall back to a non-pruning validator and let the
 * extra slip through.
 *
 * 1. Build a valid `IBbsArticle.IStore` and attach an extra property.
 * 2. Send the payload via the SDK; the tainted object is cast back to
 *    `IBbsArticle.IStore` so the SDK accepts it, and the SDK's `JSON.stringify`
 *    fallback (see `FetcherBase.ts:107`) transmits the extra to the server
 *    untouched.
 * 3. Cast the response through `unknown` to read the unknown key and assert it is
 *    absent; then `typia.assertEquals` on the article to verify the rest of the
 *    payload still validates.
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
    (article as unknown as Record<string, unknown>).__unexpected__,
    undefined,
  );
  typia.assertEquals(article);
};
