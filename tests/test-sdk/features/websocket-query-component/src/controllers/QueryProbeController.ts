import core from "@nestia/core";
import { Controller } from "@nestjs/common";
import { WebSocketAcceptor } from "tgrid";

import { IQueryProbe } from "../api/structures/IQueryProbe";

/** The same path parameter and query read over HTTP and over WebSocket. */
@Controller("probe")
export class QueryProbeController {
  @core.TypedRoute.Get(":name")
  public http(
    @core.TypedParam("name") name: string,
    @core.TypedQuery() query: IQueryProbe.IQuery,
  ): IQueryProbe {
    return { name, query };
  }

  @core.WebSocketRoute(":name")
  public async socket(
    @core.WebSocketRoute.Acceptor()
    acceptor: WebSocketAcceptor<undefined, IQueryProbe.IProvider, null>,
    @core.WebSocketRoute.Param("name") name: string,
    @core.WebSocketRoute.Query() query: IQueryProbe.IQuery,
  ): Promise<void> {
    await acceptor.accept({ get: () => ({ name, query }) });
  }
}
