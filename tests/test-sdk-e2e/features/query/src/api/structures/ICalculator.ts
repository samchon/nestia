import { tags } from "typia";

import { IQuery } from "./IQuery";

export interface ICalculator {
  getId(): string & tags.Format<"uuid">;
  getQuery(): IQuery;
  plus(x: number, y: number): number;
  minus(x: number, y: number): number;
  multiply(x: number, y: number): number;
  divide(x: number, y: number): number;
}
