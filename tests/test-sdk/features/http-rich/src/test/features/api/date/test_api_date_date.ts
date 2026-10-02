import typia from "typia";

import api from "../../../../api";
import { IDateDefined } from "../../../../structures/date/IDateDefined";

/**
 * Verifies calls date.get and validates Primitive<IDateDefined> response shape.
 *
 * The authored date DTO and typia Primitive JSON representation establish the
 * expected wire shape.
 *
 * 1. Execute the authored feature through its prepared generated artifacts.
 * 2. Assert the distinctions described below.
 *
 * @evidence contracts/testing.md#behavioral-verification The generated date request must return the exact authored Primitive<IDateDefined> JSON representation, rather than a runtime Date or incorrectly serialized object.
 * @evidence contracts/testing.md#independent-expectations The authored date DTO and typia Primitive representation define the wire shape independently of the generated SDK declaration.
 * @evidence contracts/testing.md#distinguishing-cases This case owns the date-bearing response representation and exact shape; the shared array and article cases own their respective structures.
 * @evidence contracts/testing.md#execution-ownership The matching file/export is discovered by the SDK shared HTTP entry. It consumes emitted client artifacts or actual HTTP responses; the case starts no compiler or application.
 * @evidence contracts/e2e.md#necessary-boundary The native producer, generated client where used, authored controller and live adapter must agree on request and response semantics. Direct rule or generator units do not establish that runtime connection.
 * @evidence contracts/e2e.md#shared-execution All 18 scenarios share one input configuration, one generated SDK, one consumer program and one application. This case adds only its original assertions to that prepared population.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Distinct scenario routes select their own authored controllers; payloads and responses are case-local. The duplicated scenario intentionally reads one immutable module value. The runner closes the application in finally.
 * @evidence contracts/e2e.md#preserved-coverage All assertions from date/src/test/features/api/test_api_date.ts survive; only imports, discoverable case identity and the explicitly authored scenario route prefix change. Controller and DTO behavior remains unchanged.
 */
export const test_api_date_date = async (
  connection: api.IConnection,
): Promise<void> => {
  const date: typia.Primitive<IDateDefined> =
    await api.functional.http_rich.date.date.get(connection);
  typia.assertEquals(date);
};
