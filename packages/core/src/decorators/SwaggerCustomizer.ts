import { ISwagger } from "../structures/ISwagger";
import { ISwaggerRoute } from "../structures/ISwaggerRoute";

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
    Reflect.defineMetadata(
      "nestia/SwaggerCustomizer",
      closure,
      target,
      propertyKey,
    );
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
    swagger: ISwagger;

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
    route: ISwaggerRoute;

    /**
     * Get neighbor route data.
     *
     * @param accessor Accessor for getting neighbor route data
     * @returns Neighbor route data
     */
    get(accessor: IAccessor): ISwaggerRoute | undefined;
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
}
