/**
 * > You must configure the generic argument `T`
 *
 * Exception decorator.
 *
 * `TypedException` is a decorator function describing HTTP exception and its type
 * which could be occured in the method.
 *
 * For reference, this decorator function does not affect to the method's behavior,
 * but only affects to the swagger documents generation. Also, it does not affect to
 * the SDK library generation yet, but will be used in the future.
 *
 * @param props Properties for the exception
 * @returns Method decorator
 * @author Jeongho Nam - https://github.com/samchon
 */
export function TypedException(props: TypedException.IProps<unknown>): never;

/**
 * > You must configure the generic argument `T`
 *
 * Exception decorator.
 *
 * `TypedException` is a decorator function describing HTTP exception and its type
 * which could be occured in the method.
 *
 * For reference, this decorator function does not affect to the method's behavior,
 * but only affects to the swagger documents generation. Also, it does not affect to
 * the SDK library generation yet, but will be used in the future.
 *
 * @param status Status number or pattern like "2XX", "3XX", "4XX", "5XX"
 * @param description Description about the exception
 * @returns Method decorator
 *
 * @deprecated Use {@link TypedException.IProps} typed function instead.
 *             This typed function is deprecated and will be removed in the next major update.
 * @author Jeongho Nam - https://github.com/samchon
 */
export function TypedException(
  status: number | "2XX" | "3XX" | "4XX" | "5XX",
  description?: string | undefined,
): never;

/**
 * Exception decorator.
 *
 * `TypedException` is a decorator function describing HTTP exception and its type
 * which could be occured in the method.
 *
 * For reference, this decorator function does not affect to the method's behavior,
 * but only affects to the swagger documents generation. Also, it does not affect to
 * the SDK library generation yet, but will be used in the future.
 *
 * @template T Type of the exception
 * @param props Properties for the exception
 * @returns Method decorator
 *
 * @author Jeongho Nam - https://github.com/samchon
 */
export function TypedException<T>(
  props: TypedException.IProps<T>,
): MethodDecorator;

/**
 * Exception decorator.
 *
 * `TypedException` is a decorator function describing HTTP exception and its type
 * which could be occured in the method.
 *
 * For reference, this decorator function does not affect to the method's behavior,
 * but only affects to the swagger documents generation. Also, it does not affect to
 * the SDK library generation yet, but will be used in the future.
 *
 * @template T Type of the exception
 * @param status Status number or pattern like "2XX", "3XX", "4XX", "5XX"
 * @param description Description about the exception
 * @returns Method decorator
 *
 * @deprecated Use {@link TypedException.IProps} typed function instead.
 *             This typed function is deprecated and will be removed in the next major update.
 * @author Jeongho Nam - https://github.com/samchon
 */
export function TypedException<T>(
  status: number | "2XX" | "3XX" | "4XX" | "5XX",
  description?: string | undefined,
): MethodDecorator;

/**
 * @internal
 */
export function TypedException<T>(...args: any[]): MethodDecorator {
  const props: TypedException.IProps<T> =
    typeof args[0] === "object"
      ? args[0]
      : { status: args[0], description: args[1] };
  return function TypedException(
    target: Object | T,
    propertyKey: string | symbol,
    descriptor: TypedPropertyDescriptor<any>,
  ) {
    const array: TypedException.IProps<any>[] = (() => {
      const oldbie: TypedException.IProps<any>[] | undefined =
        Reflect.getMetadata(
          "nestia/TypedException",
          (target as any)[propertyKey],
        );
      if (oldbie !== undefined) return oldbie;

      const newbie: TypedException.IProps<any>[] = [];
      Reflect.defineMetadata(
        "nestia/TypedException",
        newbie,
        (target as any)[propertyKey],
      );
      return newbie;
    })();
    array.push(props);
    return descriptor;
  };
}
export namespace TypedException {
  export interface IProps<T> {
    status: number | "2XX" | "3XX" | "4XX" | "5XX";
    description?: string | undefined;
    example?: T;
    examples?: Record<string, T>;
  }
}
