import core from "@nestia/core";
import { Controller } from "@nestjs/common";
import { tags } from "typia";

export interface IResponseValidateQueryOutput {
  id: string & tags.Format<"uuid">;
  count: number;
}

@Controller("http_rich/options/response_validate/query")
export class ResponseValidateQueryController {
  @core.TypedQuery.Get("valid")
  public valid(): IResponseValidateQueryOutput {
    return { id: "7a1c7b36-0f6e-4c55-9b1e-1f2d3c4b5a69", count: 3 };
  }

  @core.TypedQuery.Get("invalid")
  public invalid(): IResponseValidateQueryOutput {
    return { id: "wrong-data", count: 3 } as any;
  }
}
