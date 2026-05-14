import { TypedBody, TypedRoute } from "@nestia/core";
import { Controller } from "@nestjs/common";
import {
  EmbedTypeScript,
  type IEmbedTypeScriptDiagnostic,
} from "embed-typescript";
import type { IEmbedTypeScriptResult } from "embed-typescript";

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

  @TypedRoute.Post("diagnostic")
  public async diagnostic(
    @TypedBody()
    body: IEmbedTypeScriptDiagnostic,
  ): Promise<IEmbedTypeScriptDiagnostic> {
    void EmbedTypeScript;
    return body;
  }
}
