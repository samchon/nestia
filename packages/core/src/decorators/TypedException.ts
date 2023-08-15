import "reflect-metadata";

export function TypedException(
    status: number,
    description?: string | undefined,
): never;

export function TypedException<T extends object>(
    status: number,
    description?: string | undefined,
): MethodDecorator;

/**
 * @internal
 */
export function TypedException<T extends object>(
    status: number,
    description?: string | undefined,
    type?: string | undefined,
): MethodDecorator {
    return function TypedException(
        target: Object,
        propertyKey: string | symbol,
        descriptor: TypedPropertyDescriptor<any>,
    ) {
        Reflect.defineMetadata(
            `swagger/TypedException`,
            {
                status,
                description,
                type,
            },
            (target as any)[propertyKey],
        );
        return descriptor;
    };
}
export namespace TypedException {
    export interface IProps {
        status: number;
        description?: string | undefined;
        /**
         * @internal
         */
        type: string;
    }
}
