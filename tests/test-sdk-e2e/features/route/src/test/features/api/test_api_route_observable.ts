import { TestValidator } from "@nestia/e2e";
import typia from "typia";

import api from "@api";
import { IBbsArticle } from "@api/lib/structures/IBbsArticle";

/**
 * Verifies Observable<T> controller returns generate SDK output as T.
 *
 * Locks the native return-type unwrap branch shared by Swagger metadata and
 * generated SDK aliases. NestJS treats Observable<T> as an asynchronous route
 * response just like Promise<T>; a regression would emit Promise<void> or an
 * Observable-shaped schema instead of the resolved article type.
 *
 * 1. Call a controller method that returns Observable<IBbsArticle>.
 * 2. Assign the generated SDK result to IBbsArticle.
 * 3. Assert the runtime payload satisfies the article structure.
 *
 * @evidence contracts/testing.md#behavioral-verification Generated observable result must compile as IBbsArticle, satisfy its exact shape and equal all five handwritten createArticle fields.
 * @evidence contracts/testing.md#independent-expectations Authored Observable<IBbsArticle> and its literal createArticle values establish expected resolved payload independently of generated SDK output. Exact object equality supplements shape validation.
 * @evidence contracts/testing.md#distinguishing-cases Observable return contrasts Promise and direct cached response, with literal fields detecting empty/incorrect resolved output. This does not cover multi-emission or observable errors.
 * @evidence contracts/testing.md#execution-ownership The matching exported function is discovered and awaited by the actual feature executor after generation and compilation. Assertion failures reject its report and empty discovery rejects the entry.
 * @evidence contracts/e2e.md#necessary-boundary Native Observable unwrapping, generated consumer signature and actual Nest resolution/HTTP serialization must connect; a type-unwrapping unit alone cannot prove the received payload.
 * @evidence contracts/e2e.md#shared-execution Fresh packed dependencies and compatible native producer/emitted runtime programs are shared. Ordinary API/document cases reuse their feature backend; parser/adapter/clone/CLI state differences retain distinct preparation scopes.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Local submitted values and separately copied outputs isolate the feature. Additional adapter listen/calls and connectors are covered by finally closure where present, the entry closes its backend, and the harness releases owned trees after child completion.
 * @evidence contracts/e2e.md#preserved-coverage The requests, exact values, document constraints and rejected controls stated above remain in this executable owner. Transferred SDK expansion assertions retain their shared unit owner; strengthened positive tool/Observable payload controls supplement existing checks.
 */
export const test_api_route_observable = async (
  connection: api.IConnection,
): Promise<void> => {
  const article: IBbsArticle =
    await api.functional.route.observable(connection);

  typia.assertEquals(article);
  TestValidator.equals<unknown>("resolved article", article, {
    id: "00000000-0000-4000-8000-000000000000",
    title: "Observable route article",
    body: "Observable routes should expose their payload type to generated SDKs.",
    files: [],
    created_at: "2026-06-11T00:00:00.000Z",
  });
};
