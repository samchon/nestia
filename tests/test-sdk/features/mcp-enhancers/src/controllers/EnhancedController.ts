import core from "@nestia/core";
import {
  ArgumentsHost,
  CallHandler,
  CanActivate,
  Catch,
  ConflictException,
  Controller,
  ExceptionFilter,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  PipeTransform,
  UnauthorizedException,
  UseFilters,
  UseGuards,
  UseInterceptors,
  UsePipes,
} from "@nestjs/common";
import { Observable, map } from "rxjs";

export interface IEcho {
  value: string;
}

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

/** Reads the MCP HTTP request, as a JWT guard reads its own. */
@Injectable()
export class BearerGuard implements CanActivate {
  public canActivate(context: ExecutionContext): boolean {
    const request: { headers: Record<string, string | undefined> } = context
      .switchToHttp()
      .getRequest();
    if (request.headers.authorization !== "Bearer secret")
      throw new UnauthorizedException("bearer token required");
    return true;
  }
}

/** Global, registered through `APP_GUARD`. */
@Injectable()
export class GlobalDenyHeader implements CanActivate {
  public canActivate(context: ExecutionContext): boolean {
    const request: { headers: Record<string, string | undefined> } = context
      .switchToHttp()
      .getRequest();
    return request.headers["x-deny"] === undefined;
  }
}

@Injectable()
export class SuffixInterceptor implements NestInterceptor {
  public intercept(
    context: ExecutionContext,
    next: CallHandler<IEcho>,
  ): Observable<IEcho> {
    const handler: string = context.getHandler().name;
    return next
      .handle()
      .pipe(map((echo) => ({ value: `${echo.value}:${handler}` })));
  }
}

@Injectable()
export class UpperPipe implements PipeTransform<IEcho, IEcho> {
  public transform(echo: IEcho): IEcho {
    return { value: echo.value.toUpperCase() };
  }
}

export class DomainError extends Error {}
export class TeapotError extends Error {}

/** Maps a domain error to an HTTP exception, which the MCP result carries. */
@Catch(DomainError)
export class DomainFilter implements ExceptionFilter {
  public catch(error: DomainError): never {
    throw new ConflictException(`mapped: ${error.message}`);
  }
}

/** Answers the HTTP request itself, as an HTTP application's filter does. */
@Catch(TeapotError)
export class TeapotFilter implements ExceptionFilter {
  public catch(error: TeapotError, host: ArgumentsHost): void {
    const response: any = host.switchToHttp().getResponse();
    const raw: any = response.raw ?? response;
    raw.writeHead(418, { "content-type": "application/json" });
    raw.end(JSON.stringify({ teapot: error.message }));
  }
}

@UseGuards(DenyAll)
@Controller("guarded")
export class GuardedController {
  @core.TypedRoute.Get()
  public http(): IEcho {
    return { value: "http" };
  }

  @core.McpRoute("guarded_tool")
  public async tool(@core.McpRoute.Params() params: IEcho): Promise<IEcho> {
    return params;
  }
}

@Controller("enhanced")
export class EnhancedController {
  @core.TypedRoute.Get("denied")
  @UseGuards(DenyAll)
  public http(): IEcho {
    return { value: "http" };
  }

  @core.McpRoute("denied_tool")
  @UseGuards(DenyAll)
  public async denied(@core.McpRoute.Params() params: IEcho): Promise<IEcho> {
    return params;
  }

  @core.McpRoute("allowed_tool")
  @UseGuards(AllowAll)
  public async allowed(
    @core.McpRoute.Params() params: IEcho,
  ): Promise<IEcho> {
    return params;
  }

  @core.McpRoute("open_tool")
  public async open(@core.McpRoute.Params() params: IEcho): Promise<IEcho> {
    return params;
  }

  @core.McpRoute("bearer_tool")
  @UseGuards(BearerGuard)
  public async bearer(@core.McpRoute.Params() params: IEcho): Promise<IEcho> {
    return params;
  }

  @core.McpRoute("intercepted_tool")
  @UseInterceptors(SuffixInterceptor)
  public async intercepted(
    @core.McpRoute.Params() params: IEcho,
  ): Promise<IEcho> {
    return params;
  }

  @core.McpRoute("piped_tool")
  @UsePipes(UpperPipe)
  public async piped(@core.McpRoute.Params() params: IEcho): Promise<IEcho> {
    return params;
  }

  @core.McpRoute("domain_tool")
  @UseFilters(DomainFilter)
  public async domain(@core.McpRoute.Params() params: IEcho): Promise<IEcho> {
    throw new DomainError(params.value);
  }

  @core.McpRoute("teapot_tool")
  @UseFilters(TeapotFilter)
  public async teapot(@core.McpRoute.Params() params: IEcho): Promise<IEcho> {
    throw new TeapotError(params.value);
  }
}
