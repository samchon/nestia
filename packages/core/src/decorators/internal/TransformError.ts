/**
 * @internal
 */
export function TransformError(method: string): Error {
    return new Error(
        `Error on nestia.core.${method}(): no transform has been configured. Configure "tsconfig.json" file following [Guide Documents](https://github.com/samchon/nestia/wiki/Setup#tsconfigjson).`,
    );
}
