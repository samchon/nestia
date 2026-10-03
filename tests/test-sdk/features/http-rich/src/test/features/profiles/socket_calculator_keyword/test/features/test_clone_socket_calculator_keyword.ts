import { TestValidator } from "@nestia/e2e";
import { sleep_for } from "tstl";
import typia from "typia";

import { ISocketCalcEvent } from "../../../../../../structures/options/socket_calculator/ISocketCalcEvent";
import { ISocketCalcEventListener } from "../../../../../../structures/options/socket_calculator/ISocketCalcEventListener";
import api from "../../api";

/**
 * Verifies keyword-wrapped WebSocket calculator calls and ordered listener
 * events.
 *
 * The native inheritance path and generated provider calling convention must
 * retain every arithmetic result and callback across one connected session.
 *
 * 1. Connect with precision two and the original local event listener.
 * 2. Execute all 100 authored arithmetic operations and compare return values.
 * 3. Require the entire ordered callback array before closing the connector.
 *
 * @evidence contracts/testing.md#behavioral-verification The generated keyword calculator driver executes all original100 arithmetic operations, checks each independent result and compares the complete ordered100 listener events; the connector closes in finally.
 * @evidence contracts/testing.md#independent-expectations Original x=10 and y=5 arithmetic defines each result independently of the RPC implementation; the authored expected operation sequence also defines the full callback order and payload.
 * @evidence contracts/testing.md#distinguishing-cases Plus/minus/multiplies/divides retain distinct arithmetic branches and exact callbacks. The provider-wrapped listener distinguishes keyword calling from positional.
 * @evidence contracts/testing.md#execution-ownership The matching file/export is discovered in the shared compiled consumer after current installed native production and actual SDK generation; no unit entry executes this RPC connection.
 * @evidence contracts/e2e.md#necessary-boundary Actual native inherited route metadata, generated keyword signatures and provider/listener RPC must agree; compile-only or direct arithmetic units cannot establish their connection.
 * @evidence contracts/e2e.md#shared-execution Three genuinely different generator option sets retain their exact controller graphs, but share one installed graph, default producer, consumer compilation and upgraded HTTP listener. Identical default/keyword DTOs and providers have one verified input owner.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Each private controller graph has unique route and declaration identities. The original connection owns its provider and local event arrays, and closes in finally; the shared listener closes with runner teardown.
 * @evidence contracts/e2e.md#preserved-coverage Every original controller/factory/provider/DTO and all three complete assertion bodies/imports remain. Byte-identical shared inputs and health declarations are retained once; SDK/keyword/clone options and distinct inherited route populations remain.
 */
export const test_clone_socket_calculator_keyword = async (
  connection: api.IConnection,
): Promise<void> => {
  const events: ISocketCalcEvent[] = [];
  const listener: ISocketCalcEventListener = {
    on: (e) => events.push(e),
  };
  const { connector, driver } =
    await api.functional.http_rich.options.socket_calculator.keyword.calculate.simple(
      {
        ...connection,
        headers: {
          precision: 2,
        },
      },
      {
        provider: listener,
      },
    );
  const expected = new Array(100).fill(0).map(() => {
    const type = typia.random<"plus" | "minus" | "multiplies" | "divides">();
    const x: number = 10;
    const y: number = 5;
    return {
      type,
      input: [x, y],
      output:
        type === "plus"
          ? x + y
          : type === "minus"
            ? x - y
            : type === "divides"
              ? x / y
              : type === "multiplies"
                ? x * y
                : 0,
    };
  });
  try {
    for (const e of expected) {
      const z: number = await driver[e.type](e.input[0]!, e.input[1]!);
      TestValidator.equals("result", z, e.output);
    }
    await sleep_for(100);
    TestValidator.equals("events", events, expected);
  } catch (exp) {
    throw exp;
  } finally {
    await connector.close();
  }
};
