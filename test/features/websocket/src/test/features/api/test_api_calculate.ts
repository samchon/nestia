import { TestValidator } from "@nestia/e2e";
import { sleep_for } from "tstl";
import typia from "typia";

import api from "@api";
import { IListener } from "@api/lib/structures/IListener";

export const test_api_calculate = async (
  connection: api.IConnection,
): Promise<void> => {
  const events: IListener.IEvent[] = [];
  const listener: IListener = {
    on: (e) => events.push(e),
  };
  const { connector, driver } = await api.functional.calculate.connect(
    connection,
    listener,
  );
  const expected: IListener.IEvent[] = new Array(100).fill(0).map(() => {
    const operator = typia.random<IListener.IEvent["operator"]>();
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
  for (const e of expected) {
    const z: number = await driver[e.operator](e.x, e.y);
    TestValidator.equals("result")(z)(e.z);
  }
  await sleep_for(100);
  TestValidator.equals("events")(events)(expected);
  await connector.close();
};
