/**
 * Internal request validation callable with an optional successful-value
 * resolver.
 *
 * The callable preserves the legacy error-or-null metadata contract. Factory
 * validators also expose `resolve` so consumers can retain clone results
 * without treating a valid Error, null or undefined value as a failure.
 *
 * @evidence contracts/common.md#principled-implementation Resolver input is untrusted unknown and only successful data is T. Existing public descriptor callbacks retain their input:T signature; the private adapter casts once at that compatibility boundary and relies on the callback's validation decision, without asserting input validity beforehand. Assert returns and validation.data are retained; is and legacy null success retain accepted input. Errors preserve 400 details and non-guard throws, and explicit tags permit successful Error/null/undefined.
 * @evidence contracts/common.md#clear-and-simple-design One callable interface and namespace separate compatibility from successful data. The private factory installs both operations on one newly created function; descriptor adapters own their existing error translation, and the shared resolver chooses the supported protocol without request-result caching or double validation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The private constructor composes an owned function and resolver without modifying foreign callbacks or public descriptors. Unknown descriptor tags reject; legacy error-only callbacks remain supported without an invented replacement value or data sentinel.
 * @evidence contracts/common.md#meaningful-documentation This type explains optional resolution and tagged values; private factory/resolver native comments explain construction, single-call behavior and legacy fallback. The owning type reviews those internal operations rather than exposing them to obtain standalone documentation hosts.
 */
export interface IRequestBodyValidation<T> {
  (input: T): Error | null;

  /**
   * Resolves validation once, retaining its successful value when supported.
   *
   * @evidence contracts/common.md#principled-implementation The optional operation returns a discriminated result so successful Error, null or undefined data cannot be confused with validation failure; absence identifies legacy error-only callbacks.
   * @evidence contracts/common.md#clear-and-simple-design One optional function supplements the existing callable without changing its failure protocol.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The member records a real factory-owned capability rather than requiring it on legacy callbacks or using raw-data sentinels.
   * @evidence contracts/common.md#meaningful-documentation The comment states single validation and successful-value retention; the owning interface explains compatibility.
   */
  resolve?: (input: unknown) => IRequestBodyValidation.IResult<T>;
}

export namespace IRequestBodyValidation {
  /**
   * Successful data or a validation error, distinguished independently of data.
   *
   * @evidence contracts/common.md#principled-implementation The success literal distinguishes a valid Error, null or undefined from a rejected value; failure alone carries the error consumers throw.
   * @evidence contracts/common.md#clear-and-simple-design A two-variant union gives consumers one exhaustive success check.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The result uses no data sentinel or consumer-specific exception.
   * @evidence contracts/common.md#meaningful-documentation The description states the distinction that the union preserves.
   */
  export type IResult<T> =
    | { success: true; data: T }
    | { success: false; error: Error };

  /**
   * A factory-owned checker whose resolver is always present.
   *
   * @evidence contracts/common.md#principled-implementation Factory callers can resolve successful data directly because construction installs the resolver together with the legacy callable.
   * @evidence contracts/common.md#clear-and-simple-design This interface strengthens only the optional member of the compatibility interface.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The required member describes the actual factory result rather than asserting a resolver exists on foreign legacy callbacks.
   * @evidence contracts/common.md#meaningful-documentation The comment identifies which owner guarantees resolver availability.
   */
  export interface IResolved<T> extends IRequestBodyValidation<T> {
    /**
     * Resolves validation and retains successful data.
     *
     * @evidence contracts/common.md#principled-implementation Factory construction installs this operation with its callable, making successful callback data available without running validation twice.
     * @evidence contracts/common.md#clear-and-simple-design The required function strengthens only the compatibility interface's optional resolver.
     * @evidence contracts/common.md#prohibited-implementation-shortcuts The mandatory resolver applies only to the owned factory result, never to an arbitrary legacy callback.
     * @evidence contracts/common.md#meaningful-documentation The description identifies the operation's result and the owning interface states its construction guarantee.
     */
    resolve: (input: unknown) => IResult<T>;
  }
}
