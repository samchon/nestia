import core from "@nestia/core";
import {
  CanActivate,
  Controller,
  Inject,
  Injectable,
  Scope,
  UseGuards,
} from "@nestjs/common";
import { REQUEST } from "@nestjs/core";

import { IEcho } from "./EnhancedController";

/** Request-scoped, reading the request it is built for. */
@Injectable({ scope: Scope.REQUEST })
export class RequestScopedGuard implements CanActivate {
  public constructor(
    @Inject(REQUEST)
    private readonly request: { headers: Record<string, string | undefined> },
  ) {}

  public canActivate(): boolean {
    return this.request.headers["x-pass"] === "1";
  }
}

@Controller("scoped-guard")
export class ScopedGuardController {
  @core.TypedRoute.Get()
  @UseGuards(RequestScopedGuard)
  public http(): IEcho {
    return { value: "http" };
  }

  @core.McpRoute("scoped_guard_tool")
  @UseGuards(RequestScopedGuard)
  public async tool(@core.McpRoute.Params() params: IEcho): Promise<IEcho> {
    return params;
  }
}

/** A request-scoped controller, built per request with the request injected. */
@Controller({ path: "scoped", scope: Scope.REQUEST })
export class ScopedController {
  public constructor(
    @Inject(REQUEST)
    private readonly request: { headers: Record<string, string | undefined> },
  ) {}

  @core.McpRoute("scoped_tool")
  public async tool(@core.McpRoute.Params() params: IEcho): Promise<IEcho> {
    return { value: `${params.value}:${this.request.headers["x-name"]}` };
  }
}
