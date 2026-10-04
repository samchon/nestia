import { TestValidator } from "@nestia/e2e";
import { sleep_for } from "tstl";
import typia from "typia";
import { v4 } from "uuid";

import { IQueryFieldsListener } from "../../../../../../structures/options/field_parameters/IQueryFieldsListener";
import { IQueryFieldsQuery } from "../../../../../../structures/options/field_parameters/IQueryFieldsQuery";
import api from "../../api";

/**
 * Verifies the generated websocket driver and listener deliver arithmetic
 * results and ordered callbacks.
 *
 * The RPC connection and callback delivery cross the generated client/server
 * websocket boundary; connection teardown belongs to the finally block.
 *
 * 1. Execute the authored fixture inputs through the owning route.
 * 2. Assert four operators with x=10 and y=5 are checked by arithmetic
 *    expressions, getId preserves the supplied UUID, and listener events equal
 *    the authored request sequence.
 *
 * @evidence contracts/testing.md#behavioral-verification Four independently computed arithmetic results, supplied UUID and ordered listener callbacks, including the original exact query-driver echo are checked by the actual original assertions.
 * @evidence contracts/testing.md#independent-expectations The original authored literals, controller conversions and arithmetic define the oracle; fresh output is observed rather than copied into expected results.
 * @evidence contracts/testing.md#distinguishing-cases Four independently computed arithmetic results, supplied UUID and ordered listener callbacks, including the original exact query-driver echo define the original case distinctions and failure controls. Complementary field, null and malformed-input controls execute in this same profile.
 * @evidence contracts/testing.md#execution-ownership The matching export is discovered in the shared compiled consumer; its original complete body invokes the freshly generated profile SDK or reads its new document.
 * @evidence contracts/e2e.md#necessary-boundary Actual native decorators, freshly generated installed SDK and WebSocket RPC/callback delivery must agree. Direct writer units cannot prove this compiled metadata and consumer connection.
 * @evidence contracts/e2e.md#shared-execution Parameter and query controllers have equivalent generation options and share this one graph, installed dependencies, default producer, single consumer compilation and actual listener.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Private DTO/controller/route identities separate the two original inputs. Each connection owns its local event array and UUID; the original connector finally releases it, and the runner application finally releases the shared adaptor/listener.
 * @evidence contracts/e2e.md#preserved-coverage Every original operation, import, authored value and assertion remains apart from private identities and generated artifact paths; neither original wrapper adds behavior assertions.
 */
export const test_clone_field_parameters_query_calculate = async (
  connection: api.IConnection,
): Promise<void> => {
  const events: IQueryFieldsListener.IEvent[] = [];
  const listener: IQueryFieldsListener = {
    on: (e) => events.push(e),
  };
  const id: string = v4();
  const query: IQueryFieldsQuery = typia.random<IQueryFieldsQuery>();
  const { connector, driver } =
    await api.functional.http_rich.options.field_parameters.query.calculate.connect(
      connection,
      id,
      query,
      listener,
    );
  const expected: IQueryFieldsListener.IEvent[] = (
    ["plus", "minus", "divide", "multiply"] as const
  ).map((operator) => {
    const x: number = 10;
    const y: number = 5;
    return {
      operator,
      x,
      y,
      z:
        operator === "plus"
          ? x + y
          : operator === "minus"
            ? x - y
            : operator === "divide"
              ? x / y
              : operator === "multiply"
                ? x * y
                : 0,
    };
  });
  try {
    for (const e of expected) {
      const z: number = await driver[e.operator](e.x, e.y);
      TestValidator.equals("result", z, e.z);
    }
    await TestValidator.equals("id", id, await driver.getId());
    await TestValidator.equals("query", query, await driver.getQuery());
    await sleep_for(100);
    TestValidator.equals("events", events, expected);
  } catch (exp) {
    throw exp;
  } finally {
    await connector.close();
  }
};
