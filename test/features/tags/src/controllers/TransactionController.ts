import { TypedParam, TypedQuery, TypedRoute } from "@nestia/core";
import { Controller } from "@nestjs/common";
import typia from "typia";

export type RegexPattern<Value extends string> = typia.tags.TagBase<{
  target: "string";
  kind: "regexPattern";
  value: Value;
  validate: `RegExp(${Value}).test($input)`;
  schema: {};
}>;

export type LengthDivisibleBy<Value extends number> = typia.tags.TagBase<{
  target: "string";
  kind: "lengthDivisibleBy";
  value: Value;
  validate: `$input.length % ${Value} === 0`;
}>;

export type PubkeyInput = string &
  RegexPattern<"/^[0-9a-fA-F]+$/"> &
  LengthDivisibleBy<2>;

@Controller("transaction")
export class TransactionController {
  constructor() {}

  @TypedRoute.Get("user/:pubkey")
  async findTransactionsByUser(
    @TypedParam("pubkey")
    pubkey: PubkeyInput,
  ): Promise<void> {
    pubkey;
  }
}
