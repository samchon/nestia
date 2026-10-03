import core from "@nestia/core";
import { Controller } from "@nestjs/common";
import { WebSocketAcceptor } from "tgrid";

import { ISocketTypesQueryProbe } from "../../../structures/options/socket_types/ISocketTypesQueryProbe";

/** The same path parameter and query read over HTTP and over WebSocket. */
@Controller("http_rich/options/socket_types/probe")
export class SocketTypesQueryProbeController {
  @core.TypedRoute.Get(":name")
  public http(
    @core.TypedParam("name") name: string,
    @core.TypedQuery() query: ISocketTypesQueryProbe.IQuery,
  ): ISocketTypesQueryProbe {
    return { name, query };
  }

  @core.WebSocketRoute(":name")
  public async socket(
    @core.WebSocketRoute.Acceptor()
    acceptor: WebSocketAcceptor<
      undefined,
      ISocketTypesQueryProbe.IProvider,
      null
    >,
    @core.WebSocketRoute.Param("name") name: string,
    @core.WebSocketRoute.Query() query: ISocketTypesQueryProbe.IQuery,
  ): Promise<void> {
    await acceptor.accept({ get: () => ({ name, query }) });
  }
}
