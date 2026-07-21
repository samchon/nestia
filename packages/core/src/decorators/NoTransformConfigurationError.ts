/** @internal */
export function NoTransformConfigurationError(method: string) {
  if (NoTransformConfigurationError.throws === true)
    throw new Error(
      [
        `Error on nestia.core.${method}(): no transform has been configured.`,
        `Build the project with "ttsc" (not stock "tsc"); the Go-backed @nestia/core transform attaches automatically through ttsc plugin auto-discovery.`,
        `If "ttsc" is missing, install the toolchain manually: npm i -D ttsc typescript.`,
        `If you're using a non-standard TypeScript compiler like Babel or SWC, the @nestia/core transformer is not available.`,
        `If you're running "npx nestia sdk/swagger" or similar, run "npx ttsc --noEmit" to surface the underlying compilation error.`,
        `See https://nestia.io/docs/setup for the full setup; migration notes are at node_modules/@nestia/core/MIGRATION.md.`,
      ].join(" "),
    );
  return undefined as never;
}

/** @internal */
export namespace NoTransformConfigurationError {
  /**
   * Whether to throw an error or not.
   *
   * If you set this value to `false`, {@link NoTransformConfigurationError} will
   * not throw an error.
   *
   * Even if the transform did not run, the error will not be thrown and the
   * program will be continued. Instead, every validation and assertion will be
   * skipped and the value will be returned as it is. Furthermore, unexpected
   * behaviors may occur.
   *
   * Therefore, it is not recommended to set this value to `false` in production
   * environment. Configure this value to be `false` only when you're debugging
   * or testing.
   *
   * By the way, if you hope the `false` value to be set, you have to do it
   * before the first. If you configure the `false` value after the
   * `@nestia/core` decorator functions are composed, the value will not be
   * applied and the error will be thrown.
   */
  export let throws = true;
}
