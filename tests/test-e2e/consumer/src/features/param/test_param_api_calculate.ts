import { TestValidator } from "@nestia/e2e";
import { v4 } from "uuid";

import api from "../../api";
import { IListenerParam } from "../../api/structures/IListenerParam";

/**
 * Verifies generated calculator RPCs and listener events preserve their
 * contract.
 *
 * Deterministic operations retain each branch while bounded completion observes
 * callbacks.
 *
 * 1. Connect through the generated client and invoke each of the four operators.
 * 2. Compare literal results, parameter echoes and ordered listener notifications.
 * 3. Cancel the deadline and close the connector in finally.
 *
 * @evidence contracts/testing.md#behavioral-verification All four generated RPCs must return literal 15/5/2/50 and exactly four ordered notifications must equal their authored events. The submitted UUID must also echo exactly.
 * @evidence contracts/testing.md#independent-expectations Literal results follow ordinary arithmetic for 10 and 5; handwritten handlers publish each result to the listener. Independently submitted path/query values establish echo expectations.
 * @evidence contracts/testing.md#distinguishing-cases Every operator executes deterministically, including subtraction/division operand ordering; event equality detects losses and wrong payloads. Invalid handshakes belong to websocket-rejection; this case does not prove general arithmetic precision.
 * @evidence contracts/testing.md#execution-ownership The common generated consumer DynamicExecutor discovers this named export after the single consumer compilation. It receives the shared connection and aggregates failures without repeating preparation.
 * @evidence contracts/e2e.md#necessary-boundary This connects generated WebSocket path/query encoding, Nest route assembly, bidirectional RPC and listener callbacks. A direct arithmetic call cannot prove this connection.
 * @evidence contracts/e2e.md#shared-execution This request shares one packed installation, one combined controller program, one generated client program and one Nest application with all rich-fixture cases. It creates no compiler project or feature backend.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Scenario routes and DTO names have explicit namespaces in the combined fixture; requests retain their authored inputs and stateless handler expectations. Connectors retain their own finally cleanup. The common entry closes the application before removing its installation.
 * @evidence contracts/e2e.md#preserved-coverage Every original arithmetic/event and path/query echo assertion remains. Four explicit branches replace one hundred probabilistic operator choices, and actual notification completion replaces an unconditional sleep. Clone import assertions remain executable where applicable.
 */
export const test_param_api_calculate = async (
  connection: api.IConnection,
): Promise<void> => {
  const events: IListenerParam.IEventParam[] = [];
  let complete!: () => void;
  const received = new Promise<void>((resolve) => {
    complete = resolve;
  });
  let timer: ReturnType<typeof setTimeout> | undefined;
  const listener: IListenerParam = {
    on: (e) => {
      events.push(e);
      if (events.length === 4) complete();
    },
  };
  const id: string = v4();
  const { connector, driver } = await api.functional.param.calculate.connect(
    connection,
    id,
    listener,
  );
  const expected: IListenerParam.IEventParam[] = [
    { operator: "plus", x: 10, y: 5, z: 15 },
    { operator: "minus", x: 10, y: 5, z: 5 },
    { operator: "divide", x: 10, y: 5, z: 2 },
    { operator: "multiply", x: 10, y: 5, z: 50 },
  ];
  try {
    for (const e of expected) {
      const z: number = await driver[e.operator](e.x, e.y);
      TestValidator.equals("result", z, e.z);
    }
    await TestValidator.equals("id", id, await driver.getId());
    await Promise.race([
      received,
      new Promise<never>((_resolve, reject) => {
        timer = setTimeout(
          () => reject(new Error("Missing calculator events.")),
          5_000,
        );
      }),
    ]);
    TestValidator.equals("events", events, expected);
  } finally {
    if (timer !== undefined) clearTimeout(timer);
    await connector.close();
  }
};
