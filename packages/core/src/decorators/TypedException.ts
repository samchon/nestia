import "reflect-metadata";

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
 * @param status Status number or pattern like "2XX", "3XX", "4XX", "5XX"
 * @param description Description about the exception
 * @returns Method decorator
 *
 * @author Jeongho Nam - https://github.com/samchon
 */
export function TypedException<T>(
    status: number | "2XX" | "3XX" | "4XX" | "5XX",
    description?: string | undefined,
): MethodDecorator;

/**
 * @internal
 */
export function TypedException<T>(
    status: number | "2XX" | "3XX" | "4XX" | "5XX",
    description?: string | undefined,
    type?: string | undefined,
): MethodDecorator {
    return function TypedException(
        target: Object | T,
        propertyKey: string | symbol,
        descriptor: TypedPropertyDescriptor<any>,
    ) {
        const array: IProps[] = (() => {
            const oldbie: IProps[] | undefined = Reflect.getMetadata(
                `nestia/TypedException`,
                (target as any)[propertyKey],
            );
            if (oldbie !== undefined) return oldbie;

            const newbie: IProps[] = [];
            Reflect.defineMetadata(
                `nestia/TypedException`,
                newbie,
                (target as any)[propertyKey],
            );
            return newbie;
        })();
        array.push({
            status,
            description,
            type: type!,
        });
        return descriptor;
    };
}

interface IProps {
    status: number | "2XX" | "3XX" | "4XX" | "5XX";
    description?: string | undefined;
    type: string;
}
