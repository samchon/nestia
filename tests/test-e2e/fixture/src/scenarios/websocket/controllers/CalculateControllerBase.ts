import { TypedRoute, WebSocketRoute } from "@nestia/core";
import { Controller } from "@nestjs/common";
import { Driver, WebSocketAcceptor } from "tgrid";
import { tags } from "typia";

import { ICalcConfigWebsocket } from "../interfaces/ICalcConfigWebsocket";
import { ICalcEventListenerWebsocket } from "../interfaces/ICalcEventListenerWebsocket";
import { ICalcReferrerWebsocket } from "../interfaces/ICalcReferrerWebsocket";
import { ICompositeCalculatorWebsocket } from "../interfaces/ICompositeCalculatorWebsocket";
import { IScientificCalculatorWebsocket } from "../interfaces/IScientificCalculatorWebsocket";
import { ISimpleCalculatorWebsocket } from "../interfaces/ISimpleCalculatorWebsocket";
import { IStatisticsCalculatorWebsocket } from "../interfaces/IStatisticsCalculatorWebsocket";
import { CompositeCalculator } from "../providers/CompositeCalculator";
import { ScientificCalculator } from "../providers/ScientificCalculator";
import { SimpleCalculator } from "../providers/SimpleCalculator";
import { StatisticsCalculator } from "../providers/StatisticsCalculator";

export function CalculateControllerBase(path: string) {
  @Controller(path)
  abstract class CalculateControllerBase {
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
        ICalcConfigWebsocket,
        ICompositeCalculatorWebsocket,
        ICalcEventListenerWebsocket
      >,
      @WebSocketRoute.Header() header: ICalcConfigWebsocket,
      @WebSocketRoute.Driver() listener: Driver<ICalcEventListenerWebsocket>,
      @WebSocketRoute.Query() query: ICalcReferrerWebsocket,
      @WebSocketRoute.Param("id") id: string & tags.Format<"uri">,
      @WebSocketRoute.Param("nickname") nickname: string,
    ): Promise<void> {
      const provider: CompositeCalculator = new CompositeCalculator(
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
        ICalcConfigWebsocket, // header
        ISimpleCalculatorWebsocket, // provider for remote client
        ICalcEventListenerWebsocket // provider from remote client
      >,
    ): Promise<void> {
      const header: ICalcConfigWebsocket = acceptor.header;
      const listener: Driver<ICalcEventListenerWebsocket> =
        acceptor.getDriver();
      const provider: SimpleCalculator = new SimpleCalculator(header, listener);

      await acceptor.accept(provider);
      acceptor.ping(15_000);
    }

    /** Prepare a simple calculator through a route named connection. */
    @WebSocketRoute("connection")
    public async connection(
      @WebSocketRoute.Acceptor()
      acceptor: WebSocketAcceptor<
        ICalcConfigWebsocket, // header
        ISimpleCalculatorWebsocket, // provider for remote client
        ICalcEventListenerWebsocket // provider from remote client
      >,
    ): Promise<void> {
      const header: ICalcConfigWebsocket = acceptor.header;
      const listener: Driver<ICalcEventListenerWebsocket> =
        acceptor.getDriver();
      const provider: SimpleCalculator = new SimpleCalculator(header, listener);

      await acceptor.accept(provider);
      acceptor.ping(15_000);
    }

    /** Prepare a scientific calculator. */
    @WebSocketRoute("scientific")
    public async scientific(
      @WebSocketRoute.Acceptor()
      acceptor: WebSocketAcceptor<
        ICalcConfigWebsocket,
        IScientificCalculatorWebsocket,
        ICalcEventListenerWebsocket
      >,
    ): Promise<void> {
      const header: ICalcConfigWebsocket = acceptor.header;
      const listener: Driver<ICalcEventListenerWebsocket> =
        acceptor.getDriver();
      const provider: ScientificCalculator = new ScientificCalculator(
        header,
        listener,
      );
      await acceptor.accept(provider);
      acceptor.ping(15_000);
    }

    /** Prepare a statistics calculator. */
    @WebSocketRoute("statistics")
    public async statistics(
      @WebSocketRoute.Acceptor()
      acceptor: WebSocketAcceptor<
        ICalcConfigWebsocket,
        IStatisticsCalculatorWebsocket,
        ICalcEventListenerWebsocket
      >,
    ): Promise<void> {
      const header: ICalcConfigWebsocket = acceptor.header;
      const listener: Driver<ICalcEventListenerWebsocket> =
        acceptor.getDriver();
      const provider: IStatisticsCalculatorWebsocket = new StatisticsCalculator(
        header,
        listener,
      );
      await acceptor.accept(provider);
      acceptor.ping(15_000);
    }
  }
  return CalculateControllerBase;
}
