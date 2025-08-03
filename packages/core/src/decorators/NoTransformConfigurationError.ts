export function NoTransformConfigurationError(method: string) {
  if (NoTransformConfigurationError.throws === true)
    throw new Error(
      [
        `Error on nestia.core.${method}(): no transform has been configured.`,
        `Run "npx typia setup" command, or check if you're using non-standard TypeScript compiler like Babel or SWC.`,
        `Otherwise you're running "npx nestia sdk/swagger" or similar, run "npx tsc" command to find the reason why.`,
      ].join(" "),
    );
  return undefined as never;
}
export namespace NoTransformConfigurationError {
  /**
   * Whether to throw an error or not.
   *
   * If you set this value to `false`, {@link NoTransformConfigurationError} will
   * not throw an error.
   *
   * Even if you've not configured the plugin transformer of `tsconfig.json`
   * file, the error will not be thrown and the program will be continued.
   * Instead, every validations and assertions will be skipped and the value
   * will be returned as it is. Furthermore, unexpected behaviors may occur.
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
