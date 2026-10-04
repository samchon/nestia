import { TypedRoute, WebSocketRoute } from "@nestia/core";
import { Controller } from "@nestjs/common";
import { Driver, WebSocketAcceptor } from "tgrid";
import { tags } from "typia";

import { SocketCompositeCalculator } from "../../../../providers/options/socket_calculator/SocketCompositeCalculator";
import { SocketScientificCalculator } from "../../../../providers/options/socket_calculator/SocketScientificCalculator";
import { SocketSimpleCalculator } from "../../../../providers/options/socket_calculator/SocketSimpleCalculator";
import { SocketStatisticsCalculator } from "../../../../providers/options/socket_calculator/SocketStatisticsCalculator";
import { ISocketCalcConfig } from "../../../../structures/options/socket_calculator/ISocketCalcConfig";
import { ISocketCalcEventListener } from "../../../../structures/options/socket_calculator/ISocketCalcEventListener";
import { ISocketCalcReferrer } from "../../../../structures/options/socket_calculator/ISocketCalcReferrer";
import { ISocketCompositeCalculator } from "../../../../structures/options/socket_calculator/ISocketCompositeCalculator";
import { ISocketScientificCalculator } from "../../../../structures/options/socket_calculator/ISocketScientificCalculator";
import { ISocketSimpleCalculator } from "../../../../structures/options/socket_calculator/ISocketSimpleCalculator";
import { ISocketStatisticsCalculator } from "../../../../structures/options/socket_calculator/ISocketStatisticsCalculator";

export function SocketCalculatorControllerBase(path: string) {
  @Controller(path)
  abstract class SocketCalculatorControllerBase {
    /** Health check API (HTTP GET). */
    @TypedRoute.Get("health")
    public health(): string {
      return "Health check OK";
    }

    /** Prepare a composite calculator. */
    @WebSocketRoute("composite/:id/:nickname")
    public async composite(
      @WebSocketRoute.Acceptor()
      acceptor: WebSocketAcceptor<
        ISocketCalcConfig,
        ISocketCompositeCalculator,
        ISocketCalcEventListener
      >,
      @WebSocketRoute.Header() header: ISocketCalcConfig,
      @WebSocketRoute.Driver() listener: Driver<ISocketCalcEventListener>,
      @WebSocketRoute.Query() query: ISocketCalcReferrer,
      @WebSocketRoute.Param("id") id: string & tags.Format<"uri">,
      @WebSocketRoute.Param("nickname") nickname: string,
    ): Promise<void> {
      const provider: SocketCompositeCalculator = new SocketCompositeCalculator(
        header,
        listener,
      );
      query;
      id;
      nickname;
      await acceptor.accept(provider);
      acceptor.ping(15_000);
    }

    /** Prepare a simple calculator. */
    @WebSocketRoute("simple")
    public async simple(
      @WebSocketRoute.Acceptor()
      acceptor: WebSocketAcceptor<
        ISocketCalcConfig, // header
        ISocketSimpleCalculator, // provider for remote client
        ISocketCalcEventListener // provider from remote client
      >,
    ): Promise<void> {
      const header: ISocketCalcConfig = acceptor.header;
      const listener: Driver<ISocketCalcEventListener> = acceptor.getDriver();
      const provider: SocketSimpleCalculator = new SocketSimpleCalculator(
        header,
        listener,
      );

      await acceptor.accept(provider);
      acceptor.ping(15_000);
    }

    /** Prepare a simple calculator through a route named connection. */
    @WebSocketRoute("connection")
    public async connection(
      @WebSocketRoute.Acceptor()
      acceptor: WebSocketAcceptor<
        ISocketCalcConfig, // header
        ISocketSimpleCalculator, // provider for remote client
        ISocketCalcEventListener // provider from remote client
      >,
    ): Promise<void> {
      const header: ISocketCalcConfig = acceptor.header;
      const listener: Driver<ISocketCalcEventListener> = acceptor.getDriver();
      const provider: SocketSimpleCalculator = new SocketSimpleCalculator(
        header,
        listener,
      );

      await acceptor.accept(provider);
      acceptor.ping(15_000);
    }

    /** Prepare a scientific calculator. */
    @WebSocketRoute("scientific")
    public async scientific(
      @WebSocketRoute.Acceptor()
      acceptor: WebSocketAcceptor<
        ISocketCalcConfig,
        ISocketScientificCalculator,
        ISocketCalcEventListener
      >,
    ): Promise<void> {
      const header: ISocketCalcConfig = acceptor.header;
      const listener: Driver<ISocketCalcEventListener> = acceptor.getDriver();
      const provider: SocketScientificCalculator =
        new SocketScientificCalculator(header, listener);
      await acceptor.accept(provider);
      acceptor.ping(15_000);
    }

    /** Prepare a statistics calculator. */
    @WebSocketRoute("statistics")
    public async statistics(
      @WebSocketRoute.Acceptor()
      acceptor: WebSocketAcceptor<
        ISocketCalcConfig,
        ISocketStatisticsCalculator,
        ISocketCalcEventListener
      >,
    ): Promise<void> {
      const header: ISocketCalcConfig = acceptor.header;
      const listener: Driver<ISocketCalcEventListener> = acceptor.getDriver();
      const provider: ISocketStatisticsCalculator =
        new SocketStatisticsCalculator(header, listener);
      await acceptor.accept(provider);
      acceptor.ping(15_000);
    }
  }
  return SocketCalculatorControllerBase;
}
