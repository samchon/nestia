import typia from "typia";

import { IRequestBodyValidator } from "../options/IRequestBodyValidator";
import { IRequestQueryValidator } from "../options/IRequestQueryValidator";
import { IWebSocketRouteReflect } from "./internal/IWebSocketRouteReflect";
import { NoTransformConfigureError } from "./internal/NoTransformConfigureError";
import { validate_request_body } from "./internal/validate_request_body";
import { validate_request_query } from "./internal/validate_request_query";

/**
 * WebSocket route decorator.
 *
 * `@WebSocketRoute()` is a route decorator function for WebSocket routes.
 * If you want to define a WebSocket route with this `@WebSocketRoute` decorator,
 * please don't forget to call the {@link WebSocketAdaptor.upgrade} function
 * to the {@link INestApplication} instance.
 *
 * Also, `WebSocketRoute` is a module containing parameter decorator
 * functions of below for the `@WebSocketRoute` decorated method, at the same
 * time. Note that, every parameters must be decorated by one of the parameter
 * decorators in the `WebSocketRoute` module. One thing more important is,
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
 * WebSocket routes by configuring *paths*, besides `@WebSocketGateway()`
 * can't do it.
 *
 * Furthermore, if you build SDK (Software Development Kit) library through
 * `@nestia/sdk`, you can make safe WebSocket client taking advantages of
 * TypeScript type hints and checkings.
 *
 * @param path Path(s) of the WebSocket request
 * @returns Method decorator
 * @author Jeongho Nam - https://github.com/samchon
 */
export function WebSocketRoute(
  path?: undefined | string | string[],
): MethodDecorator {
  return function WebSocketRoute(
    _target: Object,
    _propertyKey: string | symbol,
    descriptor: TypedPropertyDescriptor<any>,
  ) {
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
export namespace WebSocketRoute {
  /**
   * Acceptor parameter decorator.
   *
   * `@WebSocketRoute.Acceptor()` is a parameter decorator function for the
   * `WebSocketAcceptor<Header, Provider, Listener>` (of `tgrid`) typed parameter.
   *
   * In the controller method decorated by `@WebSocketRoute()` and
   * `@WebSocketRoute.Acceptor()`, call {@link WebSocketAcceptor.accept} function
   * with `Provider` instance when you want to accept the WebSocket client
   * connection. Otherwise you want to reject the connection, call
   * {@link WebSocketAcceptor.rejcet} function instead.
   *
   * For reference, this `@WebSocketRoute.Acceptor()` parameter decorator is
   * essential for the method decorated by `@WebSocketRoute()` decorator.
   * If you forget it, it would be both compilation/runtime error.
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
   * can be substituted by `@WebSocketRoute.Acceptor()` decorated parameter
   * by calling the {@link WebSocketAcceptor.getDriver} function.
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
   * It's for WebSocket protocol, especially for TGrid's {@link WebSocketConnector}
   * and {@link WebSocketAcceptor}'s special header.
   *
   * Also, this `@WebSocketRoute.Header()` decorator is optional, and
   * can be substituted by `@WebSocketRoute.Acceptor()` decorated parameter
   * by accessting to the {@link WebSocketAcceptor.header} property.
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
  Object.assign(Header, typia.is);
  Object.assign(Header, typia.assert);
  Object.assign(Header, typia.validate);

  /**
   * URL parameter decorator.
   *
   * `@WebSocketRoute.Param()` is a parameter decorator function for the URL
   * parameter with type casting and assertion.
   *
   * It's almost same with the {@link TypedParam}, but
   * `@WebSocketRoute.Param()` is only for WebSocket protocol router function
   * decorated by {@link WebSocketRoute}.
   *
   * @param field URL parameter field name
   */
  export function Param<T extends boolean | bigint | number | string | null>(
    field: string,
    assert?: (value: string) => T,
  ): ParameterDecorator {
    if (assert === undefined)
      throw NoTransformConfigureError("WebSocketRoute.Param");
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
  Object.assign(Param, typia.http.parameter);

  /**
   * URL query decorator.
   *
   * `@WebSocketRoute.Query()` is a parameter decorator function for the URL
   * query string with type casting and assertion.
   *
   * It is almost same with {@link TypedQuery}, but
   * `@WebSocketRoute.Query()` is only for WebSocket protocol router function
   * decorated by {@link WebSocketRoute}.
   *
   * For reference, as same with {@link TypedQuery}, `@WebSocketRoute.Query()`
   * has same restriction for the target type `T`. If actual URL query
   * parameter values are different with their promised type `T`,
   * it would be runtime error.
   *
   * 1. Type `T` must be an object type
   * 2. Do not allow dynamic property
   * 3. Only `boolean`, `bigint`, `number`, `string` or their array types are allowed
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
  Object.assign(Query, typia.http.assertQuery);
  Object.assign(Query, typia.http.isQuery);
  Object.assign(Query, typia.http.validateQuery);

  /**
   * @internal
   */
  const emplace = (
    target: Object,
    propertyKey: string | symbol,
    value: IWebSocketRouteReflect.IArgument,
  ) => {
    const array: IWebSocketRouteReflect.IArgument[] | undefined =
      Reflect.getMetadata(
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
