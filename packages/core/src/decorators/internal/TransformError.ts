/**
 * @internal
 */
export function TransformError(method: string): Error {
    return new Error(
        `Error on nestia.core.${method}(): no transform has been configured. Run "npx typia setup" command.`,
    );
}
