import { IValidation } from "typia";

export type IRequestHeadersValidator<T> =
  | IRequestHeadersValidator.IAssert<T>
  | IRequestHeadersValidator.IIs<T>
  | IRequestHeadersValidator.IValidate<T>;
/**
 * The request headers validator that the transform passes to `TypedHeaders`.
 *
 * The literal `type` field selects which typia function generated the
 * validator: `assert`, `is`, or `validate`. `validate_request_headers` turns a
 * failure of any variant into a 400 response.
 *
 * @evidence contracts/common.md#principled-implementation The union is discriminated by the literal `type`, so the runtime selects the assert, is, or validate path with one comparison and the compiler checks that each variant carries the function its tag names.
 * @evidence contracts/common.md#clear-and-simple-design Three variants, one per typia function family, with no shared base because each function has a different shape.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts It is a type and adds no runtime behavior; the runtime rejects an unknown `type` with an error instead of accepting it.
 * @evidence contracts/common.md#meaningful-documentation The comment names the decorators that receive the validator, the meaning of the discriminant, and the response a failure becomes.
 * @evidenceExclude contracts/portability.md#os-neutral-implementation The validator consumes HTTP header records and returns decoded values independently of native filesystem or process spelling.
 */
export namespace IRequestHeadersValidator {
  /**
   * Validator generated from `typia.assert`.
   *
   * @evidence contracts/common.md#principled-implementation The variant tags a function of the header record of the request, whose values are strings, string arrays, or undefined that returns the decoded object or throws the `TypeGuardError` of typia; `validate_request_headers` catches the error and converts it to a `BadRequestException` carrying the path, reason, expected type, and value of the first failure.
   * @evidence contracts/common.md#clear-and-simple-design A two-member record, the tag and the function.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It is a type and adds no runtime behavior.
   * @evidence contracts/common.md#meaningful-documentation The comment names the typia function the variant comes from; the failure response is stated on the union.
   * @evidenceExclude contracts/portability.md#os-neutral-implementation The validator consumes HTTP header records and returns decoded values independently of native filesystem or process spelling.
   */
  export interface IAssert<T> {
    type: "assert";
    /**
     * The typia assertion function generated for the requested type.
     *
     * @evidence contracts/common.md#principled-implementation The transform generates the function for the type argument of the decorator, taking the header record of the request, whose values are strings, string arrays, or undefined and it returns the decoded object or throws the `TypeGuardError` of typia.
     * @evidence contracts/common.md#clear-and-simple-design One function member with the input the decorator has.
     * @evidence contracts/common.md#prohibited-implementation-shortcuts The function is generated from the type, and the runtime never edits its result.
     * @evidence contracts/common.md#meaningful-documentation The comment states that the function is generated for the requested type; its input is in the signature.
     * @evidenceExclude contracts/portability.md#os-neutral-implementation The validator consumes HTTP header records and returns decoded values independently of native filesystem or process spelling.
     */
    assert: (input: Record<string, string | string[] | undefined>) => T;
  }
  /**
   * Validator generated from `typia.is`.
   *
   * @evidence contracts/common.md#principled-implementation The variant tags a function of the header record of the request, whose values are strings, string arrays, or undefined that returns the decoded object or `null`; a failing result becomes a `BadRequestException` with only the fixed message, because `typia.is` records no failure detail.
   * @evidence contracts/common.md#clear-and-simple-design A two-member record, the tag and the function.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It is a type and adds no runtime behavior.
   * @evidence contracts/common.md#meaningful-documentation The comment names the typia function the variant comes from.
   * @evidenceExclude contracts/portability.md#os-neutral-implementation The validator consumes HTTP header records and returns decoded values independently of native filesystem or process spelling.
   */
  export interface IIs<T> {
    type: "is";
    /**
     * The typia check function generated for the requested type.
     *
     * @evidence contracts/common.md#principled-implementation The transform generates the function for the type argument of the decorator, taking the header record of the request, whose values are strings, string arrays, or undefined and returning the decoded object or `null`.
     * @evidence contracts/common.md#clear-and-simple-design One function member with the input the decorator has.
     * @evidence contracts/common.md#prohibited-implementation-shortcuts The function is generated from the type, and the runtime never edits its result.
     * @evidence contracts/common.md#meaningful-documentation The comment states that the function is generated for the requested type; its result is in the signature.
     * @evidenceExclude contracts/portability.md#os-neutral-implementation The validator consumes HTTP header records and returns decoded values independently of native filesystem or process spelling.
     */
    is: (input: Record<string, string | string[] | undefined>) => T | null;
  }
  /**
   * Validator generated from `typia.validate`.
   *
   * @evidence contracts/common.md#principled-implementation The variant tags a function of the header record of the request, whose values are strings, string arrays, or undefined that returns the `IValidation` of typia; a failed result becomes a `BadRequestException` carrying every error of the validation.
   * @evidence contracts/common.md#clear-and-simple-design A two-member record, the tag and the function.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It is a type and adds no runtime behavior.
   * @evidence contracts/common.md#meaningful-documentation The comment names the typia function the variant comes from.
   * @evidenceExclude contracts/portability.md#os-neutral-implementation The validator consumes HTTP header records and returns decoded values independently of native filesystem or process spelling.
   */
  export interface IValidate<T> {
    type: "validate";
    /**
     * The typia validation function generated for the requested type.
     *
     * @evidence contracts/common.md#principled-implementation The transform generates the function for the type argument of the decorator, taking the header record of the request, whose values are strings, string arrays, or undefined and returning the validation result with every error.
     * @evidence contracts/common.md#clear-and-simple-design One function member with the input the decorator has.
     * @evidence contracts/common.md#prohibited-implementation-shortcuts The function is generated from the type, and the runtime never edits its result.
     * @evidence contracts/common.md#meaningful-documentation The comment states that the function is generated for the requested type; its result is in the signature.
     * @evidenceExclude contracts/portability.md#os-neutral-implementation The validator consumes HTTP header records and returns decoded values independently of native filesystem or process spelling.
     */
    validate: (
      input: Record<string, string | string[] | undefined>,
    ) => IValidation<T>;
  }
}
