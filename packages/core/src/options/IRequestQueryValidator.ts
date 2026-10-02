import { IValidation } from "typia";

export type IRequestQueryValidator<T> =
  | IRequestQueryValidator.IAssert<T>
  | IRequestQueryValidator.IIs<T>
  | IRequestQueryValidator.IValidate<T>;
/**
 * The request query validator that the transform passes to `TypedQuery`,
 * `TypedQuery.Body`, and `WebSocketRoute.Query`.
 *
 * The literal `type` field selects which typia function generated the
 * validator: `assert`, `is`, or `validate`. `validate_request_query` turns a
 * failure of any variant into a 400 response.
 *
 * @evidence contracts/common.md#principled-implementation The union is discriminated by the literal `type`, so the runtime selects the assert, is, or validate path with one comparison and the compiler checks that each variant carries the function its tag names.
 * @evidence contracts/common.md#clear-and-simple-design Three variants, one per typia function family, with no shared base because each function has a different shape.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts It is a type and adds no runtime behavior; the runtime rejects an unknown `type` with an error instead of accepting it.
 * @evidence contracts/common.md#meaningful-documentation The comment names the decorators that receive the validator, the meaning of the discriminant, and the response a failure becomes.
 * @evidenceExclude contracts/portability.md#os-neutral-implementation The validator consumes URLSearchParams and describes query data rather than native paths or process arguments.
 */
export namespace IRequestQueryValidator {
  /**
   * Validator generated from `typia.assert`.
   *
   * @evidence contracts/common.md#principled-implementation The variant tags a function of the `URLSearchParams` of the query string or of an urlencoded body that returns the decoded object or throws the `TypeGuardError` of typia; `validate_request_query` catches the error and converts it to a `BadRequestException` carrying the path, reason, expected type, and value of the first failure, and a message-only one when a required property is missing.
   * @evidence contracts/common.md#clear-and-simple-design A two-member record, the tag and the function.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It is a type and adds no runtime behavior.
   * @evidence contracts/common.md#meaningful-documentation The comment names the typia function the variant comes from; the failure response is stated on the union.
   * @evidenceExclude contracts/portability.md#os-neutral-implementation The validator consumes URLSearchParams and describes query data rather than native paths or process arguments.
   */
  export interface IAssert<T> {
    type: "assert";
    /**
     * The typia assertion function generated for the requested type.
     *
     * @evidence contracts/common.md#principled-implementation The transform generates the function for the type argument of the decorator, taking the `URLSearchParams` of the query string or of an urlencoded body and it returns the decoded object or throws the `TypeGuardError` of typia.
     * @evidence contracts/common.md#clear-and-simple-design One function member with the input the decorator has.
     * @evidence contracts/common.md#prohibited-implementation-shortcuts The function is generated from the type, and the runtime never edits its result.
     * @evidence contracts/common.md#meaningful-documentation The comment states that the function is generated for the requested type; its input is in the signature.
     * @evidenceExclude contracts/portability.md#os-neutral-implementation The validator consumes URLSearchParams and describes query data rather than native paths or process arguments.
     */
    assert: (input: URLSearchParams) => T;
  }
  /**
   * Validator generated from `typia.is`.
   *
   * @evidence contracts/common.md#principled-implementation The variant tags a function of the `URLSearchParams` of the query string or of an urlencoded body that returns the decoded object or `null`; a failing result becomes a `BadRequestException` with only the fixed message, because `typia.is` records no failure detail.
   * @evidence contracts/common.md#clear-and-simple-design A two-member record, the tag and the function.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It is a type and adds no runtime behavior.
   * @evidence contracts/common.md#meaningful-documentation The comment names the typia function the variant comes from.
   * @evidenceExclude contracts/portability.md#os-neutral-implementation The validator consumes URLSearchParams and describes query data rather than native paths or process arguments.
   */
  export interface IIs<T> {
    type: "is";
    /**
     * The typia check function generated for the requested type.
     *
     * @evidence contracts/common.md#principled-implementation The transform generates the function for the type argument of the decorator, taking the `URLSearchParams` of the query string or of an urlencoded body and returning the decoded object or `null`.
     * @evidence contracts/common.md#clear-and-simple-design One function member with the input the decorator has.
     * @evidence contracts/common.md#prohibited-implementation-shortcuts The function is generated from the type, and the runtime never edits its result.
     * @evidence contracts/common.md#meaningful-documentation The comment states that the function is generated for the requested type; its result is in the signature.
     * @evidenceExclude contracts/portability.md#os-neutral-implementation The validator consumes URLSearchParams and describes query data rather than native paths or process arguments.
     */
    is: (input: URLSearchParams) => T | null;
  }
  /**
   * Validator generated from `typia.validate`.
   *
   * @evidence contracts/common.md#principled-implementation The variant tags a function of the `URLSearchParams` of the query string or of an urlencoded body that returns the `IValidation` of typia; a failed result becomes a `BadRequestException` carrying every error of the validation.
   * @evidence contracts/common.md#clear-and-simple-design A two-member record, the tag and the function.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It is a type and adds no runtime behavior.
   * @evidence contracts/common.md#meaningful-documentation The comment names the typia function the variant comes from.
   * @evidenceExclude contracts/portability.md#os-neutral-implementation The validator consumes URLSearchParams and describes query data rather than native paths or process arguments.
   */
  export interface IValidate<T> {
    type: "validate";
    /**
     * The typia validation function generated for the requested type.
     *
     * @evidence contracts/common.md#principled-implementation The transform generates the function for the type argument of the decorator, taking the `URLSearchParams` of the query string or of an urlencoded body and returning the validation result with every error.
     * @evidence contracts/common.md#clear-and-simple-design One function member with the input the decorator has.
     * @evidence contracts/common.md#prohibited-implementation-shortcuts The function is generated from the type, and the runtime never edits its result.
     * @evidence contracts/common.md#meaningful-documentation The comment states that the function is generated for the requested type; its result is in the signature.
     * @evidenceExclude contracts/portability.md#os-neutral-implementation The validator consumes URLSearchParams and describes query data rather than native paths or process arguments.
     */
    validate: (input: URLSearchParams) => IValidation<T>;
  }
}
