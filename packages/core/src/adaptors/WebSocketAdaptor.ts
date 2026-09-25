/// <reference path="../typings/get-function-location.d.ts" />
import {
  HttpException,
  INestApplication,
  VersioningType,
} from "@nestjs/common";
import {
  HOST_METADATA,
  MODULE_PATH,
  PATH_METADATA,
  SCOPE_OPTIONS_METADATA,
  VERSION_METADATA,
} from "@nestjs/common/constants";
import { VERSION_NEUTRAL, VersionValue } from "@nestjs/common/interfaces";
import { NestContainer } from "@nestjs/core";
import { InstanceWrapper } from "@nestjs/core/injector/instance-wrapper";
import { Module } from "@nestjs/core/injector/module";
import getFunctionLocation from "get-function-location";
import { IncomingMessage, Server } from "http";
import path from "path";
import { Duplex } from "stream";
import { WebSocketAcceptor } from "tgrid";
import typia from "typia";
import WebSocket from "ws";

import { IWebSocketRouteReflect } from "../decorators/internal/IWebSocketRouteReflect";
import { ArrayUtil } from "../utils/ArrayUtil";
import { VersioningStrategy } from "../utils/VersioningStrategy";
import { RoutePathMatcher } from "./internal/RoutePathMatcher";

export class WebSocketAdaptor {
  public static async upgrade(
    app: INestApplication,
  ): Promise<WebSocketAdaptor> {
    return new this(app, await visitApplication(app));
  }

  public readonly close = async (): Promise<void> =>
    new Promise((resolve) => {
      this.http.off("close", this.close);
      this.http.off("upgrade", this.handleUpgrade);
      this.ws.close(() => resolve());
    });

  private constructor(app: INestApplication, operations: IOperator[]) {
    this.operators = operations;
    this.ws = new WebSocket.Server({ noServer: true });
    this.http = app.getHttpServer();
    this.http.on("close", this.close);
    this.http.on("upgrade", this.handleUpgrade);
  }

  private readonly handleUpgrade = (
    request: IncomingMessage,
    duplex: Duplex,
    head: Buffer,
  ) => {
    this.ws.handleUpgrade(request, duplex, head, (client, request) =>
      WebSocketAcceptor.upgrade(
        request,
        client as any,
        async (acceptor): Promise<void> => {
          const path: string = (() => {
            const index: number = acceptor.path.indexOf("?");
            return index === -1 ? acceptor.path : acceptor.path.slice(0, index);
          })();
          for (const op of this.operators) {
            const params: Record<string, string> | null = op.parser.test(path);
            if (params === null) continue;
            try {
              await op.handler({ params, acceptor });
            } catch (error) {
              await terminate({ acceptor, socket: client, error });
            }
            return;
          }
          await terminate({
            acceptor,
            socket: client,
            error: new WebSocketRejection(1002, "WebSocket API not found"),
          });
        },
      ),
    );
  };

  private readonly http: Server;
  private readonly operators: IOperator[];
  private readonly ws: WebSocket.Server;
}

const visitApplication = async (
  app: INestApplication,
): Promise<IOperator[]> => {
  const operators: IOperator[] = [];
  const errors: IControllerError[] = [];

  const config: IConfig = {
    globalPrefix:
      typeof (app as any).config?.globalPrefix === "string"
        ? (app as any).config.globalPrefix
        : undefined,
    versioning: (() => {
      const versioning = (app as any).config?.versioningOptions;
      return versioning === undefined || versioning.type !== VersioningType.URI
        ? undefined
        : {
            // as NestJS's RoutePathFactory.getVersionPrefix(): `false` is no
            // prefix at all, and only an absent one is the default "v"
            prefix:
              versioning.prefix === false ? "" : (versioning.prefix ?? "v"),
            defaultVersion: versioning.defaultVersion,
          };
    })(),
  };
  const container: NestContainer = (app as any).container as NestContainer;
  const modules: Module[] = [...container.getModules().values()].filter(
    (m) => !!m.controllers?.size,
  );
  for (const m of modules) {
    const modulePrefix: string =
      Reflect.getMetadata(
        MODULE_PATH + container.getModules().applicationId,
        m.metatype,
      ) ??
      Reflect.getMetadata(MODULE_PATH, m.metatype) ??
      "";
    for (const controller of m.controllers.values())
      await visitController({
        config,
        errors,
        operators,
        controller,
        modulePrefix,
      });
  }
  if (errors.length)
    throw new Error(
      [
        `WebSocketAdaptor: ${errors.length} error(s) found:`,
        ``,
        ...errors.map((e) =>
          [
            `  - controller: ${e.name}`,
            `    methods:`,
            ...e.methods.map((m) =>
              [
                `    - name: ${m.name}`,
                `      file: ${m.source}:${m.line}:${m.column}`,
                `      reasons:`,
                ...m.messages.map(
                  (msg) =>
                    `        - ${msg
                      .split("\n")
                      .map((str, i) => (i == 0 ? str : `        ${str}`))
                      .join("\n")}`,
                ),
              ].join("\n"),
            ),
          ].join("\n"),
        ),
      ].join("\n"),
    );
  return operators;
};

const visitController = async (props: {
  config: IConfig;
  errors: IControllerError[];
  operators: IOperator[];
  controller: InstanceWrapper<object>;
  modulePrefix: string;
}): Promise<void> => {
  if (
    ArrayUtil.has(
      Reflect.getMetadataKeys(props.controller.metatype as Function),
      PATH_METADATA,
      HOST_METADATA,
      SCOPE_OPTIONS_METADATA,
    ) === false
  )
    return;

  const methodErrors: IMethodError[] = [];
  const controller: IController = {
    name: props.controller.name,
    instance: props.controller.instance,
    constructor: props.controller.metatype as Function,
    prototype: Object.getPrototypeOf(props.controller.instance),
    prefixes: (() => {
      const value: string | string[] = Reflect.getMetadata(
        PATH_METADATA,
        props.controller.metatype as object,
      );
      if (typeof value === "string") return [value];
      else if (value.length === 0) return [""];
      else return value;
    })(),
    versions: props.config.versioning
      ? VersioningStrategy.cast(
          Reflect.getMetadata(
            VERSION_METADATA,
            props.controller.metatype as Function,
          ),
        )
      : undefined,
    modulePrefix: props.modulePrefix,
  };
  for (const mk of getOwnPropertyNames(controller.prototype).filter(
    (key) =>
      key !== "constructor" && typeof controller.prototype[key] === "function",
  )) {
    const errorMessages: string[] = [];
    visitMethod({
      config: props.config,
      operators: props.operators,
      controller,
      method: {
        key: mk,
        value: controller.prototype[mk],
      },
      report: (msg) => errorMessages.push(msg),
    });
    if (errorMessages.length) {
      const file = await getFunctionLocation(controller.prototype[mk]);
      methodErrors.push({
        name: mk,
        messages: errorMessages,
        ...file,
        source: path.relative(
          process.cwd(),
          file.source.replace("file:///", ""),
        ),
      });
    }
  }

  if (methodErrors.length)
    props.errors.push({
      name: controller.name,
      methods: methodErrors,
    });
};

const visitMethod = (props: {
  config: IConfig;
  operators: IOperator[];
  controller: IController;
  method: Entry<Function>;
  report: (message: string) => void;
}): void => {
  const route: IWebSocketRouteReflect | undefined = Reflect.getMetadata(
    "nestia/WebSocketRoute",
    props.method.value,
  );
  if (typia.is<IWebSocketRouteReflect>(route) === false) return;

  const parameters: IWebSocketRouteReflect.IArgument[] = (
    (Reflect.getMetadata(
      "nestia/WebSocketRoute/Parameters",
      props.controller.prototype,
      props.method.key,
    ) ?? []) as IWebSocketRouteReflect.IArgument[]
  ).sort((a, b) => a.index - b.index);
  // acceptor must be
  if (parameters.some((p) => p.category === "acceptor") === false)
    return props.report(
      "@WebSocketRoute.Acceptor() decorated parameter must be.",
    );
  // length of parameters must be fulfilled
  if (parameters.length !== props.method.value.length)
    return props.report(
      [
        "Every parameters must be one of below:",
        "  - @WebSocketRoute.Acceptor()",
        "  - @WebSocketRoute.Driver()",
        "  - @WebSocketRoute.Header()",
        "  - @WebSocketRoute.Param()",
        "  - @WebSocketRoute.Query()",
      ].join("\n"),
    );

  const versions: string[] = VersioningStrategy.merge(props.config.versioning)({
    controller: props.controller.versions,
    method: VersioningStrategy.cast(
      Reflect.getMetadata(VERSION_METADATA, props.method.value),
    ),
  });
  for (const v of versions)
    for (const cp of wrapPaths(props.controller.prefixes))
      for (const mp of wrapPaths(route.paths)) {
        const parser: RoutePathMatcher = new RoutePathMatcher(
          "/" +
            [
              props.config.globalPrefix ?? "",
              v,
              props.controller.modulePrefix,
              cp,
              mp,
            ]
              .filter((str) => !!str.length)
              .join("/")
              .split("/")
              .filter((str) => str.length)
              .join("/"),
        );
        const pathParams: IWebSocketRouteReflect.IParam[] = parameters.filter(
          (p) => p.category === "param",
        ) as IWebSocketRouteReflect.IParam[];
        if (parser.params.length !== pathParams.length) {
          props.report(
            [
              `Path "${parser}" must have same number of parameters with @WebSocketRoute.Param()`,
              `  - path: ${JSON.stringify(parser.params)}`,
              `  - arguments: ${JSON.stringify(pathParams.map((p) => p.field))}`,
            ].join("\n"),
          );
          continue;
        }
        const meet: boolean = pathParams
          .map((p) => {
            const has: boolean = parser.params.includes(p.field);
            if (has === false)
              props.report(
                `Path "${parser}" must have parameter "${p.field}" with @WebSocketRoute.Param()`,
              );
            return has;
          })
          .every((b) => b);
        if (meet === false) continue;

        props.operators.push({
          parser,
          handler: async (input: {
            params: Record<string, string>;
            acceptor: WebSocketAcceptor<any, any, any>;
          }): Promise<void> => {
            const args: any[] = [];
            try {
              for (const p of parameters)
                if (p.category === "acceptor") args.push(input.acceptor);
                else if (p.category === "driver")
                  args.push(input.acceptor.getDriver());
                else if (p.category === "header") {
                  const error: Error | null = p.validate(input.acceptor.header);
                  if (error !== null) throw error;
                  args.push(input.acceptor.header);
                } else if (p.category === "param")
                  args.push(p.assert(input.params[p.field]!));
                else if (p.category === "query") {
                  // the query is all after the first "?", which it may hold too
                  const index: number = input.acceptor.path.indexOf("?");
                  const query: any | Error = p.validate(
                    new URLSearchParams(
                      index !== -1
                        ? input.acceptor.path.substring(index + 1)
                        : "",
                    ),
                  );
                  if (query instanceof Error) throw query;
                  args.push(query);
                }
            } catch (exp) {
              // an invalid handshake: rejected before the handler runs
              throw new WebSocketRejection(1003, exp);
            }
            await props.method.value.call(props.controller.instance, ...args);
          },
        });
      }
};

/**
 * A handshake rejected on purpose, with its close code: 1002 for no route, 1003
 * for a header, param, or query failing its type.
 */
class WebSocketRejection {
  public constructor(
    public readonly code: number,
    public readonly cause: unknown,
  ) {}
}

/**
 * Ends a WebSocket request that failed, so the client always learns it: a
 * handshake not accepted yet is rejected, 1008 for an error of the route
 * itself, and an accepted connection is closed with 1011. When tgrid refuses
 * either, as it does while `accept()` is still running, the socket is closed
 * directly. Nothing escapes, as the upgrade callback has no one to catch it.
 */
const terminate = async (props: {
  acceptor: WebSocketAcceptor<any, any, any>;
  socket: WebSocket;
  error: unknown;
}): Promise<void> => {
  const reason: string = closeReason(
    props.error instanceof WebSocketRejection ? props.error.cause : props.error,
  );
  const state: WebSocketAcceptor.State = props.acceptor.state;
  if (
    state === WebSocketAcceptor.State.REJECTING ||
    state === WebSocketAcceptor.State.CLOSING ||
    state === WebSocketAcceptor.State.CLOSED
  )
    return; // the route already ends the connection itself
  const code: number =
    state !== WebSocketAcceptor.State.NONE
      ? 1011
      : props.error instanceof WebSocketRejection
        ? props.error.code
        : 1008;
  try {
    if (state === WebSocketAcceptor.State.NONE)
      return await props.acceptor.reject(code, reason);
    else if (state === WebSocketAcceptor.State.OPEN)
      return await props.acceptor.close(code, reason);
  } catch {}
  try {
    props.socket.close(code, reason);
  } catch {
    props.socket.terminate();
  }
};

/**
 * The reason a close frame carries: the error's message, cut to the 123 bytes
 * of UTF-8 a close reason may hold, never inside a character. A longer reason
 * makes `ws` throw instead of closing, and the client waits forever.
 *
 * A validator's `BadRequestException` carries a generic message, so the
 * property it names is preferred: typia's `reason` from an assertion, or the
 * first of the `errors` from a validation.
 */
const closeReason = (error: unknown): string => {
  const message: string =
    invalidProperty(error) ??
    (error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "unknown error");
  const encoded: Buffer = Buffer.from(message, "utf8");
  if (encoded.length <= MAX_CLOSE_REASON_BYTES) return message;
  let end: number = MAX_CLOSE_REASON_BYTES;
  // back off continuation bytes (10xxxxxx) to a character boundary
  while (end > 0 && (encoded[end]! & 0xc0) === 0x80) --end;
  return encoded.subarray(0, end).toString("utf8");
};

const invalidProperty = (error: unknown): string | null => {
  if (!(error instanceof HttpException)) return null;
  const response: unknown = error.getResponse();
  if (typeof response !== "object" || response === null) return null;
  const { reason, errors } = response as {
    reason?: unknown;
    errors?: unknown;
  };
  if (typeof reason === "string") return reason;
  if (Array.isArray(errors) && errors.length !== 0) {
    const first: { path?: unknown; expected?: unknown } = errors[0];
    if (typeof first?.path === "string" && typeof first.expected === "string")
      return [
        `invalid type on ${first.path}, expect to be ${first.expected}`,
        errors.length > 1 ? ` (and ${errors.length - 1} more)` : "",
      ].join("");
  }
  return null;
};

/**
 * RFC 6455 §5.5: a control frame's payload is at most 125 bytes, 2 of them the
 * code.
 */
const MAX_CLOSE_REASON_BYTES: number = 123;

const wrapPaths = (value: string[]) => (value.length === 0 ? [""] : value);
const getOwnPropertyNames = (prototype: any): string[] => {
  const result: Set<string> = new Set();
  const iterate = (m: any) => {
    if (m === null) return;
    for (const k of Object.getOwnPropertyNames(m)) result.add(k);
    iterate(Object.getPrototypeOf(m));
  };
  iterate(prototype);
  return Array.from(result);
};

interface Entry<T> {
  key: string;
  value: T;
}

interface IController {
  name: string;
  versions: Array<string | typeof VERSION_NEUTRAL> | undefined;
  instance: object;
  constructor: Function;
  prototype: any;
  prefixes: string[];
  modulePrefix: string;
}
interface IOperator {
  parser: RoutePathMatcher;
  handler: (props: {
    params: Record<string, string>;
    acceptor: WebSocketAcceptor<any, any, any>;
  }) => Promise<any>;
}
interface IConfig {
  globalPrefix?: string;
  versioning?: {
    prefix: string;
    defaultVersion?: VersionValue;
  };
}

interface IControllerError {
  name: string;
  methods: IMethodError[];
}
interface IMethodError {
  name: string;
  messages: string[];
  source: string;
  line: number;
  column: number;
}
