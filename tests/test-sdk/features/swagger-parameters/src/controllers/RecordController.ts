import core from "@nestia/core";
import { Controller, Headers, Query } from "@nestjs/common";

import { IMixedHeaders } from "@api/lib/structures/IMixedHeaders";
import { IMixedQuery } from "@api/lib/structures/IMixedQuery";
import { IRequiredMixedQuery } from "@api/lib/structures/IRequiredMixedQuery";

@Controller("record")
export class RecordController {
  @core.TypedRoute.Get("headers")
  public recordHeaders(@Headers() headers: Record<string, string>): void {
    headers;
  }

  @core.TypedRoute.Get("mixed-headers")
  public mixedHeaders(@Headers() headers: IMixedHeaders): void {
    headers;
  }

  @core.TypedRoute.Get("query")
  public recordQuery(@Query() query: Record<string, string>): void {
    query;
  }

  @core.TypedRoute.Get("mixed")
  public mixedQuery(@Query() query: IMixedQuery): void {
    query;
  }

  @core.TypedRoute.Get("required")
  public requiredQuery(@Query() query: IRequiredMixedQuery): void {
    query;
  }
}
