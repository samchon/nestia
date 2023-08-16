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
export function TypedException(
    status: number,
    description?: string | undefined,
    type?: string | undefined,
): MethodDecorator {
    return function TypedException(
        target: Object,
        propertyKey: string | symbol,
        descriptor: TypedPropertyDescriptor<any>,
    ) {
        const array: IProps[] = (() => {
            const oldbie: IProps[] | undefined = Reflect.getMetadata(
                `swagger/TypedException`,
                (target as any)[propertyKey],
            );
            if (oldbie !== undefined) return oldbie;

            const newbie: IProps[] = [];
            Reflect.defineMetadata(
                `swagger/TypedException`,
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
    status: number;
    description?: string | undefined;
    type: string;
}
