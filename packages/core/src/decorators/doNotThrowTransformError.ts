import { NoTransformConfigurationError } from "./NoTransformConfigurationError";

/**
 * Chooses whether a decorator called without the compile-time transform throws.
 *
 * By default it throws with instructions to build with `ttsc`. Passing `true`
 * silences the error, and the decorators then run as pass-throughs.
 *
 * @evidence contracts/common.md#principled-implementation The function sets the one flag that `NoTransformConfigurationError` reads, so the choice is made once for the process.
 * @evidence contracts/common.md#clear-and-simple-design One setter with a boolean parameter.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts It changes an exported flag of this package and nothing foreign.
 * @evidence contracts/common.md#meaningful-documentation The comment states the default and the effect of the flag.
 */
export const doNotThrowTransformError = (value: boolean = false) => {
  NoTransformConfigurationError.throws = value;
};
