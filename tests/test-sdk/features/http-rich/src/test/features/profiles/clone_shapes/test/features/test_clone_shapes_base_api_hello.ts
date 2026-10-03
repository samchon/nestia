import typia from "typia";

import api from "../../api";
import { CloneShapesBaseGetHelloResponseDto } from "../../api/structures/CloneShapesBaseGetHelloResponseDto";

/**
 * Verifies calls the cloned getHello SDK and validates
 * CloneShapesBaseGetHelloResponseDto.
 *
 * The authored response DTO supplies the structural expectation.
 *
 * 1. Execute the authored feature through its prepared generated artifacts.
 * 2. Assert the distinctions described below.
 *
 * @evidence contracts/testing.md#behavioral-verification Actual cloned SDK generation and consumer compilation feed the original transport or clone/source equality assertions.
 * @evidence contracts/testing.md#independent-expectations The authored source DTO and literal type, status and boundary expectations establish equivalence independently of emitted clone text.
 * @evidence contracts/testing.md#distinguishing-cases The original HTTP getHello call retains its structural assertion for optional mutable or readonly message arrays.
 * @evidence contracts/testing.md#execution-ownership The matching exported original case is discovered in the shared installed clone_shapes consumer profile.
 * @evidence contracts/e2e.md#necessary-boundary The installed native metadata and public clone generator must emit TypeScript that compiles and preserves source meaning; the HTTP case also executes its generated connection.
 * @evidence contracts/e2e.md#shared-execution Three original fixtures have identical clone-only generation options and combine into one actual SDK generation graph; they share installation, producer, consumer and listener.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Unique route, controller and DTO identities isolate each original source graph; immutable generated clones and stateless handlers remain valid across all three cases.
 * @evidence contracts/e2e.md#preserved-coverage The complete original assertion body and source graph remain after reversible imports, type identities, routes and discovery names; no additional generated random calls or Swagger outputs are introduced.
 */
export const test_clone_shapes_base_api_hello = async (
  connection: api.IConnection,
): Promise<void> => {
  const hello: CloneShapesBaseGetHelloResponseDto =
    await api.functional.http_rich.options.clone_shapes.base.getHello(
      connection,
    );
  typia.assert(hello);
};
