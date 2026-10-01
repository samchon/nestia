import core from "@nestia/core";
import { Controller } from "@nestjs/common";
import { tags } from "typia";

export interface ISimulateHeaders {
  "x-id": string & tags.Format<"uuid">;
}

@Controller("headers")
export class HeadersController {
  @core.TypedRoute.Get()
  public get(@core.TypedHeaders() headers: ISimulateHeaders): string {
    return headers["x-id"];
  }
}
