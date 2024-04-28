import { IRequestBodyValidator } from "../options/IRequestBodyValidator";
import { IRequestQueryValidator } from "../options/IRequestQueryValidator";
import { IWebSocketRouteReflect } from "./internal/IWebSocketRouteReflect";
import { NoTransformConfigureError } from "./internal/NoTransformConfigureError";
import { validate_request_body } from "./internal/validate_request_body";
import { validate_request_query } from "./internal/validate_request_query";

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
  export function Query(
    validator?: IRequestQueryValidator<any>,
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
