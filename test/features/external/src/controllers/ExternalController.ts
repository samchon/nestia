import { TypedBody, TypedRoute } from "@nestia/core";
import { Controller } from "@nestjs/common";
import { IEmbedTypeScriptResult } from "embed-typescript";

@Controller("external")
export class ExternalController {
  @TypedRoute.Post("compile")
  public async compile(
    @TypedBody()
    files: Record<string, string>,
  ): Promise<IEmbedTypeScriptResult> {
    files;
    return {
      type: "success",
      javascript: {},
    };
  }
}
