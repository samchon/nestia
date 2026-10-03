import { TestValidator } from "@nestia/e2e";
import typia from "typia";

import { CloneCombinedBbsArticlesController } from "../../../../../../controllers/clone/combined/BbsArticlesController";

/**
 * Verifies zero and singleton pagination for the compiled clone fixture.
 *
 * The original authored inputs and assertions retain their distinct SDK
 * profile.
 *
 * 1. Execute the original assertions through the shared compiled artifacts.
 * 2. Assert finite literal zero pagination and empty data, then literal singleton
 *    pagination and one data element.
 *
 * @evidence contracts/testing.md#behavioral-verification Assert finite literal zero pagination and empty data, then literal singleton pagination and one data element.
 * @evidence contracts/testing.md#independent-expectations Original authored literals require current0/limit0/records5/pages0 with empty data and current1/limit1/records9/pages9 with one item; responses never supply expected pagination values.
 * @evidence contracts/testing.md#distinguishing-cases This combined profile retains its original assertions; neighboring profiles preserve their distinct clone/keyword/propagate options, DTO documentation and exception-decorator inputs.
 * @evidence contracts/testing.md#execution-ownership The shared public consumer discovers this matching authored file after one compilation; the case creates no installation, compiler or application.
 * @evidence contracts/e2e.md#necessary-boundary The actual native-compiled private DTO controller calls transformed typia.random and its result reaches transformed typia.assert. Untransformed stubs cannot establish this connection; the fixture algorithm is not presented as proof of SDK option semantics.
 * @evidence contracts/e2e.md#shared-execution All profiles share one installed graph, producer program, consumer program and HTTP listener. Only public generation and non-listening application input graphs differ where options or authored controller inputs differ.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Unique route/class identities isolate controller variants. Profile-specific output roots isolate generated APIs and documents; stateless requests share one backend and the runner closes every application in finally.
 * @evidence contracts/e2e.md#preserved-coverage Original assertion bodies survive reversible import, accessor, class, file and document-location changes. No random generated profile cases or authored negative/boundary assertions are dropped.
 */
export const test_clone_combined_bbs_pagination_zero_limit =
  async (): Promise<void> => {
    const controller = new CloneCombinedBbsArticlesController();
    const empty = typia.assert(
      await controller.index("general", { limit: 0, page: 0 }),
    );
    TestValidator.equals("zero-limit pagination", empty.pagination, {
      current: 0,
      limit: 0,
      records: 5,
      pages: 0,
    });
    TestValidator.equals("zero-limit data", empty.data, []);
    const single = typia.assert(
      await controller.index("general", { limit: 1, page: 1 }),
    );
    TestValidator.equals("nonzero-limit pagination", single.pagination, {
      current: 1,
      limit: 1,
      records: 9,
      pages: 9,
    });
    TestValidator.equals("nonzero-limit data", single.data.length, 1);
  };
