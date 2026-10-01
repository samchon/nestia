import { TestValidator } from "@nestia/e2e";

import api from "@api";
import { IListener } from "@api/lib/structures/IListener";

/**
 * Verifies WebSocket SDK routing through the application's global prefix.
 *
 * The generated accessor must connect to /x/calculate and preserve RPC results
 * and listener notifications; arithmetic decisions alone cannot prove routing.
 *
 * 1. Connect using the generated SDK and invoke all four operators.
 * 2. Assert literal arithmetic results and matching ordered notifications.
 * 3. Close the connection and cancel the notification deadline in finally.
 *
 * @evidence contracts/testing.md#behavioral-verification The generated accessor connects to /x/calculate; plus, minus, divide and multiply return 15, 5, 2 and 50 for 10 and 5, and the listener must receive the same four ordered event records.
 * @evidence contracts/testing.md#independent-expectations Literal arithmetic results follow ordinary number operations, while the endpoint path follows the fixture's NestJS global prefix configuration rather than generated output.
 * @evidence contracts/testing.md#distinguishing-cases All four operator branches run deterministically, including operand ordering for subtraction and division; ordered callbacks detect dropped or mismatched events. Invalid handshakes are owned by websocket-rejection.
 * @evidence contracts/testing.md#execution-ownership The feature's DynamicExecutor discovers this exported test after the SDK harness generates and compiles its real controller and client; it executes inside its feature entry or the compatible configuration batch.
 * @evidence contracts/e2e.md#necessary-boundary A real generated WebSocket accessor, configured NestJS host and bidirectional RPC connection establish global prefix composition; an in-process arithmetic call cannot detect a client/server path mismatch.
 * @evidence contracts/e2e.md#shared-execution SDK generation and compilation share the compatible-tsconfig batch, and all four RPCs and notifications share this connector and the feature's backend lifetime rather than installing or compiling per operator.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Event state belongs to this call, the feature entry owns its backend port, and finally cancels the bounded notification timer and closes the connector on success or failure.
 * @evidence contracts/e2e.md#preserved-coverage All original operator and event comparisons remain with deterministic inputs; four required branches replace one hundred random choices and notification completion replaces an unconditional sleep.
 */
export const test_api_x_calculate = async (
  connection: api.IConnection,
): Promise<void> => {
  const events: IListener.IEvent[] = [];
  let complete!: () => void;
  const received = new Promise<void>((resolve) => {
    complete = resolve;
  });
  let timer: ReturnType<typeof setTimeout> | undefined;
  const listener: IListener = {
    on: (e) => {
      events.push(e);
      if (events.length === 4) complete();
    },
  };
  const { connector, driver } = await api.functional.x.calculate.connect(
    connection,
    listener,
  );
  const expected: IListener.IEvent[] = [
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
