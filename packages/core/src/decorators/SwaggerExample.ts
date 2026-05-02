/**
 * Attach example values to Swagger documents.
 *
 * `SwaggerExample` is a namespace of decorators that attach example values
 * to controller methods (request/response bodies, parameters), so that
 * `@nestia/sdk`'s Swagger generator can populate the `example` / `examples`
 * fields of the generated OpenAPI document.
 *
 * The decorators only affect Swagger document generation. They do not change
 * runtime behavior, validation, or SDK function signatures.
 *
 * @example
 *
 * ```typescript
 * import core from "@nestia/core";
 * import { Controller } from "@nestjs/common";
 * import typia from "typia";
 *
 * @Controller("bbs/articles")
 * export class BbsArticlesController {
 *   // Single response example.
 *   @core.SwaggerExample.Response(typia.random<IBbsArticle>())
 *   @core.TypedRoute.Post()
 *   public async create(
 *     // Multiple named parameter examples plus a default one.
 *     @core.SwaggerExample.Parameter(typia.random<IBbsArticle.ICreate>())
 *     @core.SwaggerExample.Parameter("x", typia.random<IBbsArticle.ICreate>())
 *     @core.SwaggerExample.Parameter("y", typia.random<IBbsArticle.ICreate>())
 *     @core.TypedBody()
 *     input: IBbsArticle.ICreate,
 *   ): Promise<IBbsArticle> {
 *     // ...
 *   }
 * }
 * ```
 *
 * @author Jeongho Nam - https://github.com/samchon
 */
export namespace SwaggerExample {
  /**
   * Attach an example value to the response body of a controller method.
   *
   * Two forms are supported:
   *
   * - {@link Response | `Response(value)`}: registers `value` as the single
   *   default `example`.
   * - {@link Response | `Response(key, value)`}: registers `value` under
   *   `examples[key]`. May be applied multiple times to attach several
   *   named examples.
   *
   * Both forms can coexist on the same method — the default `example` and
   * any number of named `examples` will all surface in the generated
   * Swagger document.
   *
   * @template T Type of the example value (typically the route's response DTO).
   */
  export function Response<T>(value: T): MethodDecorator;
  export function Response<T>(key: string, value: T): MethodDecorator;
  export function Response(...args: any[]): MethodDecorator {
    return function SwaggerExampleResponse(
      _target: Object,
      _propertyKey: string | symbol,
      descriptor: TypedPropertyDescriptor<any>,
    ): TypedPropertyDescriptor<any> {
      emplaceValue(emplaceOfResponse(descriptor))(args);
      return descriptor;
    };
  }

  /**
   * Attach an example value to a request parameter (body, path, query, etc.)
   * of a controller method.
   *
   * Two forms are supported:
   *
   * - {@link Parameter | `Parameter(value)`}: registers `value` as the single
   *   default `example` for that parameter.
   * - {@link Parameter | `Parameter(key, value)`}: registers `value` under
   *   `examples[key]`. May be applied multiple times to attach several
   *   named examples to the same parameter.
   *
   * Apply alongside the actual parameter decorator
   * (`@TypedBody()`, `@TypedParam()`, `@TypedQuery()`, etc.); decorator
   * order does not matter.
   *
   * @template T Type of the example value (typically the parameter's DTO).
   */
  export function Parameter<T>(value: T): ParameterDecorator;
  export function Parameter<T>(key: string, value: T): ParameterDecorator;
  export function Parameter(...args: any[]): ParameterDecorator {
    return function SwaggerExampleParameter(
      target: Object,
      propertyKey: string | symbol | undefined,
      index: number,
    ): void {
      emplaceValue(emplaceOfParameter(target, propertyKey ?? "", index))(args);
    };
  }

  /**
   * Internal storage shape for `SwaggerExample` metadata.
   *
   * Reflects the OpenAPI spec's two example fields: a single default
   * `example`, and/or a named map `examples`. `index` is used internally
   * to associate parameter examples with the right parameter position.
   */
  export interface IData<T> {
    examples?: Record<string, T>;
    example?: T;
    index?: number;
  }
}

const emplaceValue =
  <T>(data: SwaggerExample.IData<T>) =>
  (args: any[]) => {
    if (args.length === 1) data.example = args[0];
    else {
      const key: string = args[0];
      const value: T = args[1];
      data.examples ??= {};
      data.examples[key] = value;
    }
  };

const emplaceOfResponse = <T>(
  descriptor: TypedPropertyDescriptor<any>,
): SwaggerExample.IData<T> => {
  const oldbie: SwaggerExample.IData<T> | undefined = Reflect.getMetadata(
    "nestia/SwaggerExample/Response",
    descriptor.value,
  );
  if (oldbie !== undefined) return oldbie;
  const newbie: SwaggerExample.IData<T> = {};
  Reflect.defineMetadata(
    "nestia/SwaggerExample/Response",
    newbie,
    descriptor.value,
  );
  return newbie;
};

const emplaceOfParameter = (
  target: Object,
  propertyKey: string | symbol,
  index: number,
): SwaggerExample.IData<any> => {
  const array: SwaggerExample.IData<any>[] = emplaceArrayOfParameters(
    target,
    propertyKey,
  );
  const oldibe: SwaggerExample.IData<any> | undefined = array.find(
    (e) => e.index === index,
  );
  if (oldibe !== undefined) return oldibe;

  const data: SwaggerExample.IData<any> = { index };
  array.push(data);
  return data;
};

const emplaceArrayOfParameters = (
  target: Object,
  propertyKey: string | symbol,
): SwaggerExample.IData<any>[] => {
  const array: SwaggerExample.IData<any>[] | undefined = Reflect.getMetadata(
    "nestia/SwaggerExample/Parameters",
    target,
    propertyKey,
  );
  if (array !== undefined) return array;
  const newbie: SwaggerExample.IData<any>[] = [];
  Reflect.defineMetadata(
    "nestia/SwaggerExample/Parameters",
    newbie,
    target,
    propertyKey,
  );
  return newbie;
};
