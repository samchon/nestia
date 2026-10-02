import { NoTransformConfigurationError } from "./NoTransformConfigurationError";

/**
 * Chooses whether a decorator called without the compile-time transform throws.
 *
 * The initial configuration throws with instructions to build with `ttsc`.
 * Calling this setter with `false`, including its omitted-argument default,
 * silences the error. Passing `true` restores throwing for subsequent decorator
 * construction. Decorators already constructed keep their selected callbacks.
 *
 * @evidence contracts/common.md#principled-implementation The function sets the one flag that `NoTransformConfigurationError` reads, so the choice is made once for the process.
 * @evidence contracts/common.md#clear-and-simple-design One setter with a boolean parameter.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts It changes an exported flag of this package and nothing foreign.
 * @evidence contracts/common.md#meaningful-documentation The comment states the default and the effect of the flag.
 * @evidenceExclude contracts/portability.md#os-neutral-implementation This setter changes an in-memory validation configuration flag and performs no filesystem or process operation.
 */
export const doNotThrowTransformError = (value: boolean = false) => {
  NoTransformConfigurationError.throws = value;
};
