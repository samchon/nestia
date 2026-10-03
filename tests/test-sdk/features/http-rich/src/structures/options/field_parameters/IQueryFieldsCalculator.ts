import { tags } from "typia";

import { IQueryFieldsQuery } from "./IQueryFieldsQuery";

export interface IQueryFieldsCalculator {
  getId(): string & tags.Format<"uuid">;
  getQuery(): IQueryFieldsQuery;
  plus(x: number, y: number): number;
  minus(x: number, y: number): number;
  multiply(x: number, y: number): number;
  divide(x: number, y: number): number;
}
