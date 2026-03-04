import { tags } from "typia";

export interface ICalculator {
  getId(): string & tags.Format<"uuid">;
  plus(x: number, y: number): number;
  minus(x: number, y: number): number;
  multiply(x: number, y: number): number;
  divide(x: number, y: number): number;
}
