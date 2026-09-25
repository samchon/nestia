import core from "@nestia/core";
import { Controller } from "@nestjs/common";
import { WebSocketAcceptor } from "tgrid";

export interface ICalculator {
  plus(x: number, y: number): number;
}

/**
 * WebSocket routes whose handshake header the generated SDK cannot send.
 *
 * The SDK carries the header as `connection.headers`, typed by `IConnection<
 * Headers extends object | undefined>`, so a `null`, nullable, or primitive
 * header would generate a client that does not compile (#1701). tgrid leaves
 * the header unconstrained, so each route builds and serves; `nestia sdk` must
 * name each parameter instead.
 */
@Controller("header")
export class HeaderTypeController {
  @core.WebSocketRoute("null")
  public async nullHeader(
    @core.WebSocketRoute.Acceptor()
    acceptor: WebSocketAcceptor<null, ICalculator, null>,
  ): Promise<void> {
    await acceptor.accept({ plus: (x, y) => x + y });
  }

  @core.WebSocketRoute("nullable")
  public async nullableHeader(
    @core.WebSocketRoute.Acceptor()
    connection: WebSocketAcceptor<{ token: string } | null, ICalculator, null>,
  ): Promise<void> {
    await connection.accept({ plus: (x, y) => x + y });
  }

  @core.WebSocketRoute("string")
  public async stringHeader(
    @core.WebSocketRoute.Acceptor()
    acceptor: WebSocketAcceptor<any, ICalculator, null>,
    @core.WebSocketRoute.Header() token: string,
  ): Promise<void> {
    token;
    await acceptor.accept({ plus: (x, y) => x + y });
  }
}
