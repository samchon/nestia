import core from "@nestia/core";
import { Controller } from "@nestjs/common";
import { tags } from "typia";

export interface IQueryOutput {
  id: string & tags.Format<"uuid">;
  count: number;
}

@Controller("query")
export class QueryController {
  /** Answers an id that is no uuid, which `validate.log` logs and sends. */
  @core.TypedQuery.Get()
  public get(): IQueryOutput {
    return {
      id: "wrong-data",
      count: 3,
    } as any;
  }
}
