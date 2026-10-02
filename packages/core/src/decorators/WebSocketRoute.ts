import { IRequestBodyValidator } from "../options/IRequestBodyValidator";
import { IRequestQueryValidator } from "../options/IRequestQueryValidator";
import { NoTransformConfigurationError } from "./NoTransformConfigurationError";
import { IWebSocketRouteReflect } from "./internal/IWebSocketRouteReflect";
import { validate_request_body } from "./internal/validate_request_body";
import { validate_request_query } from "./internal/validate_request_query";

/**
 * WebSocket route decorator.
 *
 * `@WebSocketRoute()` is a route decorator function for WebSocket routes. If
 * you want to define a WebSocket route with this `@WebSocketRoute` decorator,
 * please don't forget to call the {@link WebSocketAdaptor.upgrade} function to
 * the {@link INestApplication} instance.
 *
 * Also, `WebSocketRoute` is a module containing parameter decorator functions
 * of below for the `@WebSocketRoute` decorated method, at the same time. Note
 * that, every parameters must be decorated by one of the parameter decorators
 * in the `WebSocketRoute` module. One thing more important is,
 * {@link WebSocketRoute.Acceptor} decorated parameter must be defined in the
 * method. If not, it would be both compilation/runtime error.
 *
 * - {@link WebSocketRoute.Acceptor}
 * - {@link WebSocketRoute.Driver}
 * - {@link WebSocketRoute.Header}
 * - {@link WebSocketRoute.Param}
 * - {@link WebSocketRoute.Query}
 *
 * For reference, key difference between `@WebSocketGateway()` of NestJS and
 * `@WebSocketRoute()` of Nestia is, `@WebSocketRoute()` can make multiple
 * WebSocket routes by configuring _paths_, besides `@WebSocketGateway()` can't
 * do it.
 *
 * Furthermore, if you build SDK (Software Development Kit) library through
 * `@nestia/sdk`, you can make safe WebSocket client taking advantages of
 * TypeScript type hints and checks.
 *
 * @author Jeongho Nam - https://github.com/samchon
 * @param path Path(s) of the WebSocket request
 * @returns Method decorator
 * @evidence contracts/common.md#principled-implementation The decorator records the route paths as metadata on the method, with an empty list for no path, and the adapter reads that metadata to build the route table.
 * @evidence contracts/common.md#clear-and-simple-design One decorator function that writes one metadata object.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts It uses the reflect metadata API and does not touch the server.
 * @evidence contracts/common.md#meaningful-documentation The comment documents the path forms and the required parameters.
 * @evidenceExclude contracts/portability.md#os-neutral-implementation The route and parameter metadata describe WebSocket handshakes and HTTP URL fields; native files and processes are not represented.
 */
export function WebSocketRoute(
  path?: undefined | string | string[],
): MethodDecorator {
  return function WebSocketRoute(
    _target: Object,
    _propertyKey: string | symbol,
    descriptor: TypedPropertyDescriptor<any>,
  ): TypedPropertyDescriptor<any> {
    Reflect.defineMetadata(
      "nestia/WebSocketRoute",
      {
        paths: path === undefined ? [] : Array.isArray(path) ? path : [path],
      } satisfies IWebSocketRouteReflect,
      descriptor.value,
    );
    return descriptor;
  };
}
/**
 * Parameter decorators of {@link WebSocketRoute}: `Acceptor`, `Driver`,
 * `Header`, `Param`, and `Query`.
 *
 * @evidence contracts/common.md#principled-implementation Each decorator appends category and position metadata. Header registration stores the shared checker whose resolver preserves successful callback data for the decorated argument without replacing the acceptor header; legacy error-only callbacks retain raw input. Param and query keep their own decoder contracts, and every rejected handshake retains its original error handling.
 * @evidence contracts/common.md#clear-and-simple-design Five decorators sharing one `emplace` helper for the metadata list.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The validators are generated from the types; without the transform the raw values are passed only when the configuration guard is off.
 * @evidence contracts/common.md#meaningful-documentation Each decorator documents its meaning.
 * @evidenceExclude contracts/portability.md#os-neutral-implementation The route and parameter metadata describe WebSocket handshakes and HTTP URL fields; native files and processes are not represented.
 */
export namespace WebSocketRoute {
  /**
   * Acceptor parameter decorator.
   *
   * `@WebSocketRoute.Acceptor()` is a parameter decorator function for the
   * `WebSocketAcceptor<Header, Provider, Listener>` (of `tgrid`) typed
   * parameter.
   *
   * In the controller method decorated by `@WebSocketRoute()` and
   * `@WebSocketRoute.Acceptor()`, call {@link WebSocketAcceptor.accept} function
   * with `Provider` instance when you want to accept the WebSocket client
   * connection. Otherwise you want to reject the connection, call
   * {@link WebSocketAcceptor.rejcet} function instead.
   *
   * For reference, this `@WebSocketRoute.Acceptor()` parameter decorator is
   * essential for the method decorated by `@WebSocketRoute()` decorator. If you
   * forget it, it would be both compilation/runtime error.
   */
  export function Acceptor(): ParameterDecorator {
    return function WebSocketAcceptor(
      target: Object,
      propertyKey: string | symbol | undefined,
      parameterIndex: number,
    ) {
      emplace(target, propertyKey ?? "", {
        category: "acceptor",
        index: parameterIndex,
      });
    };
  }

  /**
   * Driver parameter decorator.
   *
   * `@WebSocketRoute.Driver()` is a parameter decorator function for the
   * `Driver<Listener>` (of `tgrid`) typed parameter.
   *
   * With the `@WebSocketRoute.Driver()` decorated parameter, you can call
   * function of `Listener` typed instance provided by remote WebSocket client
   * by calling the `Driver<Listener>` instance.
   *
   * For reference, this `@WebSocketRoute.Driver()` decorator is optional, and
   * can be substituted by `@WebSocketRoute.Acceptor()` decorated parameter by
   * calling the {@link WebSocketAcceptor.getDriver} function.
   */
  export function Driver(): ParameterDecorator {
    return function WebSocketDriver(
      target: Object,
      propertyKey: string | symbol | undefined,
      parameterIndex: number,
    ) {
      emplace(target, propertyKey ?? "", {
        category: "driver",
        index: parameterIndex,
      });
    };
  }

  /**
   * Header decorator.
   *
   * `@WebSocketRoute.Header()` is a parameter decorator function for the
   * WebSocket header with type casting and assertion.
   *
   * For reference, `@WebSocketRoute.Header()` is different with HTTP headers.
   * It's for WebSocket protocol, especially for TGrid's
   * {@link WebSocketConnector} and {@link WebSocketAcceptor}'s special header.
   *
   * Also, this `@WebSocketRoute.Header()` decorator is optional, and can be
   * substituted by `@WebSocketRoute.Acceptor()` decorated parameter by
   * accessing the {@link WebSocketAcceptor.header} property. Clone validators
   * supply a separate decorated argument; the acceptor keeps its original
   * header.
   */
  export function Header<T>(
    validator?: IRequestBodyValidator<T>,
  ): ParameterDecorator {
    const validate = validate_request_body("WebSocketRoute.Header")(validator);
    return function WebSocketHeader(
      target: Object,
      propertyKey: string | symbol | undefined,
      parameterIndex: number,
    ) {
      emplace(target, propertyKey ?? "", {
        category: "header",
        index: parameterIndex,
        validate,
      });
    };
  }

  /**
   * URL parameter decorator.
   *
   * `@WebSocketRoute.Param()` is a parameter decorator function for the URL
   * parameter with type casting and assertion.
   *
   * It's almost same with the {@link TypedParam}, but `@WebSocketRoute.Param()`
   * is only for WebSocket protocol router function decorated by
   * {@link WebSocketRoute}.
   *
   * @param field URL parameter field name
   */
  export function Param<T extends boolean | bigint | number | string | null>(
    field: string,
    assert?: (value: string) => T,
  ): ParameterDecorator {
    if (assert === undefined) {
      NoTransformConfigurationError("WebSocketRoute.Param");
      assert = (value) => value as T;
    }
    return function WebSocketParam(
      target: Object,
      propertyKey: string | symbol | undefined,
      parameterIndex: number,
    ) {
      emplace(target, propertyKey ?? "", {
        category: "param",
        index: parameterIndex,
        field,
        assert,
      });
    };
  }

  /**
   * URL query decorator.
   *
   * `@WebSocketRoute.Query()` is a parameter decorator function for the URL
   * query string with type casting and assertion.
   *
   * It is almost same with {@link TypedQuery}, but `@WebSocketRoute.Query()` is
   * only for WebSocket protocol router function decorated by
   * {@link WebSocketRoute}.
   *
   * For reference, as same with {@link TypedQuery}, `@WebSocketRoute.Query()`
   * has same restriction for the target type `T`. If actual URL query parameter
   * values are different with their promised type `T`, it would be runtime
   * error.
   *
   * 1. Type `T` must be an object type
   * 2. Do not allow dynamic property
   * 3. Only `boolean`, `bigint`, `number`, `string` or their array types are
   *    allowed
   * 4. By the way, union type never be not allowed
   */
  export function Query<T extends object>(
    validator?: IRequestQueryValidator<T>,
  ): ParameterDecorator {
    const validate = validate_request_query("WebSocketRoute.Query")(validator);
    return function WebSocketQuery(
      target: Object,
      propertyKey: string | symbol | undefined,
      parameterIndex: number,
    ) {
      emplace(target, propertyKey ?? "", {
        category: "query",
        index: parameterIndex,
        validate,
      });
    };
  }

  /** @internal */
  const emplace = (
    target: Object,
    propertyKey: string | symbol,
    value: IWebSocketRouteReflect.IArgument,
  ) => {
    const array: IWebSocketRouteReflect.IArgument[] | undefined =
      Reflect.getOwnMetadata(
        "nestia/WebSocketRoute/Parameters",
        target,
        propertyKey,
      );
    if (array !== undefined) array.push(value);
    else
      Reflect.defineMetadata(
        "nestia/WebSocketRoute/Parameters",
        [value],
        target,
        propertyKey,
      );
  };
}
