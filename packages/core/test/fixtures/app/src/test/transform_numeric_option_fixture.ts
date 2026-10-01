import typia from "typia";

interface IMeasurement {
  value: number;
}

export const check = (input: unknown): IMeasurement =>
  typia.assert<IMeasurement>(input);
