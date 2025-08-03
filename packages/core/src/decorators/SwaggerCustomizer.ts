import { OpenApi } from "@samchon/openapi";

/**
 * Swagger customization decorator.
 *
 * `SwaggerCustomizer` is a method decorator function which can used for
 * customizing the swagger data with `npx nestia swagger` command. Furthermore,
 * it is possible to add plugin properties starting with `x-` characters.
 *
 * In other words, this decorator function does not affect to the runtime,
 * but only for the swagger data customization.
 *
 * @param closure Callback function which can customize the swagger data
 * @returns Method decorator
 * @author Jeongho Nam - https://github.com/samchon
 */
export function SwaggerCustomizer(
  closure: (props: SwaggerCustomizer.IProps) => unknown,
): MethodDecorator {
  return function SwaggerCustomizer(
    target: Object,
    propertyKey: string | symbol,
    descriptor: TypedPropertyDescriptor<any>,
  ) {
    const array: Array<(props: SwaggerCustomizer.IProps) => unknown> = (() => {
      if (Reflect.hasMetadata("nestia/SwaggerCustomizer", target, propertyKey))
        return Reflect.getMetadata(
          "nestia/SwaggerCustomizer",
          target,
          propertyKey,
        );
      const array: Array<(props: SwaggerCustomizer.IProps) => unknown> = [];
      Reflect.defineMetadata(
        "nestia/SwaggerCustomizer",
        array,
        target,
        propertyKey,
      );
      return array;
    })();
    array.push(closure);
    return descriptor;
  };
}
export namespace SwaggerCustomizer {
  /**
   * Properties for the `SwaggerCustomizer` decorator.
   *
   * `SwaggerCustomizer.IProps` is a type for the `closure` parameter of the
   * `SwaggerCustomizer` decorator. It's a callback function which can customize
   * the swagger data.
   */
  export interface IProps {
    /**
     * Swagger data.
     */
    swagger: OpenApi.IDocument;

    /**
     * Method of the route.
     */
    method: string;

    /**
     * Path of the route.
     */
    path: string;

    /**
     * Route data.
     */
    route: OpenApi.IOperation;

    /**
     * Get neighbor endpoint data through the controller method.
     *
     * @param func Controller method to find the neighbor endpoint
     * @returns Neighbor endpoint data
     */
    at(func: Function): ISwaggerEndpoint | undefined;

    /**
     * Get neighbor route data.
     *
     * @param accessor Accessor for getting neighbor route data
     * @returns Neighbor route data
     */
    get(accessor: IAccessor): OpenApi.IOperation | undefined;
  }

  /**
   * Accessor for getting neighbor route data.
   */
  export interface IAccessor {
    /**
     * Path of the neighbor route.
     */
    path: string;

    /**
     * Method of the neighbor route.
     */
    method: string;
  }

  /**
   * Endpoint info of the route.
   */
  export interface ISwaggerEndpoint extends IAccessor {
    /**
     * Route data.
     */
    route: OpenApi.IOperation;
  }
}
