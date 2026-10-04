import core from "@nestia/core";
import { Controller } from "@nestjs/common";
import { tags } from "typia";

export interface ValidateLogQueryOutput {
  id: string & tags.Format<"uuid">;
  count: number;
}

@Controller("http_rich/options/validate_log/query")
export class ValidateLogQueryController {
  /** Answers an id that is no uuid, which `validate.log` logs and sends. */
  @core.TypedQuery.Get()
  public get(): ValidateLogQueryOutput {
    return {
      id: "wrong-data",
      count: 3,
    } as any;
  }
}
