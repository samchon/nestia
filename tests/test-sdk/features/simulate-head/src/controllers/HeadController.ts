import core from "@nestia/core";
import { Controller, Head } from "@nestjs/common";
import { tags } from "typia";

@Controller("heads")
export class HeadController {
  @Head(":id")
  public head(@core.TypedParam("id") id: string & tags.Format<"uuid">): void {
    id;
  }
}
