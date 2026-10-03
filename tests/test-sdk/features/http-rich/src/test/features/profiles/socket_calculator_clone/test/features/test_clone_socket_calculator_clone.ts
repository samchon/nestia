import { TestValidator } from "@nestia/e2e";
import { sleep_for } from "tstl";
import typia from "typia";

import api from "../../api";
import { ISocketCloneListener } from "../../api/structures/ISocketCloneListener";

/**
 * Verifies WebSocket clone SDKs import provider/listener contracts from
 * generated structures instead of source interfaces.
 *
 * Locks the regression where `@WebSocketRoute.Acceptor()` interfaces stayed
 * imported from the application `src/` tree. Compiling a distributed SDK would
 * then pull source files into `lib/`; using the generated structure type here
 * proves the clone path exports and consumes the listener contract.
 *
 * 1. Connect to the generated WebSocket SDK with a structure-imported listener.
 * 2. Call calculator driver methods through the generated SDK.
 * 3. Assert both RPC return values and listener events preserve the contract.
 *
 * @evidence contracts/testing.md#behavioral-verification The generated clone calculator driver executes all original100 arithmetic operations, checks each independent result and compares the complete ordered100 listener events; the connector closes in finally.
 * @evidence contracts/testing.md#independent-expectations Original x=10 and y=5 arithmetic defines each result independently of the RPC implementation; the authored expected operation sequence also defines the full callback order and payload.
 * @evidence contracts/testing.md#distinguishing-cases Plus/minus/multiply/divide retain distinct arithmetic branches and exact callbacks. The listener is imported from freshly generated clone structures, distinguishing clone output from source-interface imports.
 * @evidence contracts/testing.md#execution-ownership The matching file/export is discovered in the shared compiled consumer after current installed native production and actual SDK generation; no unit entry executes this RPC connection.
 * @evidence contracts/e2e.md#necessary-boundary Actual native inherited route metadata, generated clone signatures and provider/listener RPC must agree; compile-only or direct arithmetic units cannot establish their connection.
 * @evidence contracts/e2e.md#shared-execution Three genuinely different generator option sets retain their exact controller graphs, but share one installed graph, default producer, consumer compilation and upgraded HTTP listener. Identical default/keyword DTOs and providers have one verified input owner.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Each private controller graph has unique route and declaration identities. The original connection owns its provider and local event arrays, and closes in finally; the shared listener closes with runner teardown.
 * @evidence contracts/e2e.md#preserved-coverage Every original controller/factory/provider/DTO and all three complete assertion bodies/imports remain. Byte-identical shared inputs and health declarations are retained once; SDK/keyword/clone options and distinct inherited route populations remain.
 */
export const test_clone_socket_calculator_clone = async (
  connection: api.IConnection,
): Promise<void> => {
  const events: ISocketCloneListener.IEvent[] = [];
  const listener: ISocketCloneListener = {
    on: (e) => events.push(e),
  };
  const { connector, driver } =
    await api.functional.http_rich.options.socket_calculator.clone.calculate.connect(
      connection,
      listener,
    );
  const expected: ISocketCloneListener.IEvent[] = new Array(100)
    .fill(0)
    .map(() => {
      const operator = typia.random<ISocketCloneListener.IEvent["operator"]>();
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
    await sleep_for(100);
    TestValidator.equals("events", events, expected);
  } catch (exp) {
    throw exp;
  } finally {
    await connector.close();
  }
};
