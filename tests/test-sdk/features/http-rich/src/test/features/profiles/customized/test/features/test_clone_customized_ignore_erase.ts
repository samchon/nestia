import { TestValidator } from "@nestia/e2e";

import api from "../../api";

/**
 * Verifies requires the generated articles namespace to omit erase.
 *
 * The authored erase operation is explicitly ignored for SDK generation.
 *
 * 1. Execute the authored feature through its prepared generated artifacts.
 * 2. Assert the distinctions described below.
 *
 * @evidence contracts/testing.md#behavioral-verification The original ignored erase accessor must be absent; visible store/update and health/performance cases own adjacent routes.
 * @evidence contracts/testing.md#independent-expectations Original authored routes, DTOs, decorator values and literal assertions define the expected result independently of emitted artifacts.
 * @evidence contracts/testing.md#distinguishing-cases The original ignored erase accessor must be absent; visible store/update and health/performance cases own adjacent routes.
 * @evidence contracts/testing.md#execution-ownership The matching exported case executes through DynamicExecutor in the shared compiled customized-profile consumer; it reads the actual document or calls the actual generated client.
 * @evidence contracts/e2e.md#necessary-boundary The actual installed SDK writer must omit the ignored erase accessor while retaining visible neighbors; direct metadata alone does not prove the generated namespace.
 * @evidence contracts/e2e.md#shared-execution The two original SDK/Swagger configurations are identical and their controllers join one generation graph, one shared producer/consumer and one listener. Neither original fixture enables automated E2E generation.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Private source/controller/type/route identities isolate the graph. Customizers address its own routes and the document belongs to this profile; the authored request handlers retain their original state behavior.
 * @evidence contracts/e2e.md#preserved-coverage Every original assertion and failure branch remains with only private identities, imports, accessors and artifact paths changed.
 */
export const test_clone_customized_ignore_erase = (): void => {
  const erase = (
    api.functional.http_rich.options.customized.ignore_bbs.articles as any
  ).erase;
  TestValidator.equals("ignore", erase, undefined);
};
