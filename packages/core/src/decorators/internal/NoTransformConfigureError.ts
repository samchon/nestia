/**
 * @internal
 */
export function NoTransformConfigureError(method: string): Error {
  return new Error(
    [
      `Error on nestia.core.${method}(): no transform has been configured.`,
      `Run "npx typia setup" command, or check if you're using non-standard TypeScript compiler like Babel or SWC.`,
      `Otherwise you're running "npx nestia sdk/swagger" or similar, run "npx tsc" command to find the reason why.`,
    ].join(" "),
  );
}
