import core from "@nestia/core";
import {
  CallHandler,
  CanActivate,
  Catch,
  Controller,
  ExceptionFilter,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  NestInterceptor,
  Scope,
  UnauthorizedException,
  UseFilters,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { REQUEST } from "@nestjs/core";
import { IncomingMessage } from "http";
import { Observable, of, tap } from "rxjs";
import { WebSocketAcceptor } from "tgrid";

import { IEcho } from "@api/lib/structures/IEcho";

type Acceptor = WebSocketAcceptor<undefined, IEcho, null>;

const accept = (acceptor: Acceptor, value: string): Promise<void> =>
  acceptor.accept({ echo: () => value });

const query = (request: IncomingMessage): URLSearchParams =>
  new URLSearchParams((request.url ?? "").split("?")[1] ?? "");

@Injectable()
export class DenyAll implements CanActivate {
  public canActivate(): boolean {
    return false;
  }
}

@Injectable()
export class AllowAll implements CanActivate {
  public canActivate(): boolean {
    return true;
  }
}

/** Reads the upgrade request, as a JWT guard reads its own. */
@Injectable()
export class BearerGuard implements CanActivate {
  public canActivate(context: ExecutionContext): boolean {
    const request: IncomingMessage = context.switchToHttp().getRequest();
    if (request.headers.authorization !== "Bearer secret")
      throw new UnauthorizedException("bearer token required");
    return true;
  }
}

/** Global, registered through `APP_GUARD`. */
@Injectable()
export class GlobalDenyQuery implements CanActivate {
  public canActivate(context: ExecutionContext): boolean {
    return query(context.switchToHttp().getRequest()).get("deny") === null;
  }
}

/** Request-scoped, reading the request it is built for. */
@Injectable({ scope: Scope.REQUEST })
export class RequestScopedGuard implements CanActivate {
  public constructor(
    @Inject(REQUEST) private readonly request: IncomingMessage,
  ) {}

  public canActivate(): boolean {
    return query(this.request).get("pass") === "1";
  }
}

export const INTERCEPTED: string[] = [];

@Injectable()
export class RecordInterceptor implements NestInterceptor {
  public intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<unknown> {
    INTERCEPTED.push(`before ${context.getHandler().name}`);
    return next.handle().pipe(tap(() => INTERCEPTED.push("after")));
  }
}

export class DomainError extends Error {}

/** Maps a domain error to an HTTP exception, which the rejection carries. */
@Catch(DomainError)
export class DomainFilter implements ExceptionFilter {
  public catch(error: DomainError): never {
    throw new ForbiddenException(`mapped: ${error.message}`);
  }
}

/** Handles the error by returning, leaving nothing to answer with. */
@Catch(DomainError)
export class SwallowFilter implements ExceptionFilter {
  public catch(): object {
    return { handled: true };
  }
}

/** Answers without calling the handler, as a cache interceptor may. */
@Injectable()
export class ShortCircuitInterceptor implements NestInterceptor {
  public intercept(): Observable<unknown> {
    return of(undefined);
  }
}

@UseGuards(DenyAll)
@Controller("guarded")
export class GuardedController {
  @core.TypedRoute.Get()
  public http(): string {
    return "http";
  }

  @core.WebSocketRoute()
  public async connect(
    @core.WebSocketRoute.Acceptor() acceptor: Acceptor,
  ): Promise<void> {
    await accept(acceptor, "guarded");
  }
}

@Controller("enhanced")
export class EnhancedController {
  @core.TypedRoute.Get("denied")
  @UseGuards(DenyAll)
  public http(): string {
    return "http";
  }

  @core.WebSocketRoute("denied")
  @UseGuards(DenyAll)
  public async denied(
    @core.WebSocketRoute.Acceptor() acceptor: Acceptor,
    @core.WebSocketRoute.Query() _query: { value: number },
  ): Promise<void> {
    await accept(acceptor, "denied");
  }

  @core.WebSocketRoute("allowed")
  @UseGuards(AllowAll)
  public async allowed(
    @core.WebSocketRoute.Acceptor() acceptor: Acceptor,
  ): Promise<void> {
    await accept(acceptor, "allowed");
  }

  @core.WebSocketRoute("open")
  public async open(
    @core.WebSocketRoute.Acceptor() acceptor: Acceptor,
  ): Promise<void> {
    await accept(acceptor, "open");
  }

  @core.WebSocketRoute("bearer")
  @UseGuards(BearerGuard)
  public async bearer(
    @core.WebSocketRoute.Acceptor() acceptor: Acceptor,
  ): Promise<void> {
    await accept(acceptor, "bearer");
  }

  @core.WebSocketRoute("scoped-guard")
  @UseGuards(RequestScopedGuard)
  public async scopedGuard(
    @core.WebSocketRoute.Acceptor() acceptor: Acceptor,
  ): Promise<void> {
    await accept(acceptor, "scoped-guard");
  }

  @core.WebSocketRoute("intercepted")
  @UseInterceptors(RecordInterceptor)
  public async intercepted(
    @core.WebSocketRoute.Acceptor() acceptor: Acceptor,
  ): Promise<void> {
    INTERCEPTED.push("handler");
    await accept(acceptor, "intercepted");
  }

  @core.WebSocketRoute("filtered")
  @UseFilters(DomainFilter)
  public async filtered(
    @core.WebSocketRoute.Acceptor() _acceptor: Acceptor,
  ): Promise<void> {
    throw new DomainError("domain");
  }

  @core.WebSocketRoute("short-circuited")
  @UseInterceptors(ShortCircuitInterceptor)
  public async shortCircuited(
    @core.WebSocketRoute.Acceptor() acceptor: Acceptor,
  ): Promise<void> {
    await accept(acceptor, "short-circuited");
  }

  @core.WebSocketRoute("swallowed")
  @UseFilters(SwallowFilter)
  public async swallowed(
    @core.WebSocketRoute.Acceptor() _acceptor: Acceptor,
  ): Promise<void> {
    throw new DomainError("domain");
  }
}

/** A request-scoped controller, built per connection with the request. */
@Controller({ path: "scoped", scope: Scope.REQUEST })
export class ScopedController {
  public constructor(
    @Inject(REQUEST) private readonly request: IncomingMessage,
  ) {}

  @core.WebSocketRoute()
  public async connect(
    @core.WebSocketRoute.Acceptor() acceptor: Acceptor,
  ): Promise<void> {
    await accept(acceptor, `request ${query(this.request).get("name")}`);
  }
}
