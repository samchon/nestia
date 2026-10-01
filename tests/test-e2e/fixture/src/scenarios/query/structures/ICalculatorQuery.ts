import { tags } from "typia";

import { IQueryQuery } from "./IQueryQuery";

export interface ICalculatorQuery {
  getId(): string & tags.Format<"uuid">;
  getQuery(): IQueryQuery;
  plus(x: number, y: number): number;
  minus(x: number, y: number): number;
  multiply(x: number, y: number): number;
  divide(x: number, y: number): number;
}
