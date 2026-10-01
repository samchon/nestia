import { IValidation } from "typia";

export type IRequestBodyValidator<T> =
  | IRequestBodyValidator.IAssert<T>
  | IRequestBodyValidator.IIs<T>
  | IRequestBodyValidator.IValidate<T>;
/**
 * The request body validator that the transform passes to `TypedBody`,
 * `EncryptedBody`, `PlainBody`, `WebSocketRoute.Header`, and
 * `McpRoute.Params`.
 *
 * The literal `type` field selects which typia function generated the
 * validator: `assert`, `is`, or `validate`. `validate_request_body` turns a
 * failure of any variant into a 400 response. Assert and validate success
 * supply their returned data to the decorated argument; is success keeps the
 * input.
 *
 * @evidence contracts/common.md#principled-implementation The union is discriminated by the literal `type`, so the runtime selects the assert, is, or validate path with one comparison and the compiler checks that each variant carries the function its tag names.
 * @evidence contracts/common.md#clear-and-simple-design Three variants, one per typia function family, with no shared base because each function has a different shape.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts It is a type and adds no runtime behavior; the runtime rejects an unknown `type` with an error instead of accepting it.
 * @evidence contracts/common.md#meaningful-documentation The comment names the decorators that receive the validator, the meaning of the discriminant, and the response a failure becomes.
 */
export namespace IRequestBodyValidator {
  /**
   * Validator generated from `typia.assert`.
   *
   * @evidence contracts/common.md#principled-implementation The variant tags a function returning validated data, which may be a clone, or throwing TypeGuardError. The shared runner retains successful data and converts the guard error to BadRequestException carrying the first failure's path, reason, expected type and value.
   * @evidence contracts/common.md#clear-and-simple-design A two-member record, the tag and the function.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It is a type and adds no runtime behavior.
   * @evidence contracts/common.md#meaningful-documentation The comment names the typia function the variant comes from; the failure response is stated on the union.
   */
  export interface IAssert<T> {
    type: "assert";
    /**
     * The typia assertion function generated for the requested type.
     *
     * @evidence contracts/common.md#principled-implementation The generated assertion returns the validated value, including a separate clone for clone modes, or throws TypeGuardError. Successful data becomes the decorated argument without requiring identity with the parsed input.
     * @evidence contracts/common.md#clear-and-simple-design One function member with the input the decorator has.
     * @evidence contracts/common.md#prohibited-implementation-shortcuts The function is generated from the type, and the runtime never edits its result.
     * @evidence contracts/common.md#meaningful-documentation The comment states that the function is generated for the requested type; its input is in the signature.
     */
    assert: (input: T) => T;
  }
  /**
   * Validator generated from `typia.is`.
   *
   * @evidence contracts/common.md#principled-implementation The variant tags a function of the parsed value that returns a boolean, because the value is already parsed and is returned as it is; a failing result becomes a `BadRequestException` with only the fixed message, because `typia.is` records no failure detail.
   * @evidence contracts/common.md#clear-and-simple-design A two-member record, the tag and the function.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It is a type and adds no runtime behavior.
   * @evidence contracts/common.md#meaningful-documentation The comment names the typia function the variant comes from.
   */
  export interface IIs<T> {
    type: "is";
    /**
     * The typia check function generated for the requested type.
     *
     * @evidence contracts/common.md#principled-implementation The transform generates the function for the type argument of the decorator, taking the parsed value and returning a boolean, because the value is already parsed and is returned as it is.
     * @evidence contracts/common.md#clear-and-simple-design One function member with the input the decorator has.
     * @evidence contracts/common.md#prohibited-implementation-shortcuts The function is generated from the type, and the runtime never edits its result.
     * @evidence contracts/common.md#meaningful-documentation The comment states that the function is generated for the requested type; its result is in the signature.
     */
    is: (input: T) => boolean;
  }
  /**
   * Validator generated from `typia.validate`.
   *
   * @evidence contracts/common.md#principled-implementation The callback returns IValidation; successful result.data becomes the decorated argument, including a clone, while failure becomes BadRequestException carrying every validation error.
   * @evidence contracts/common.md#clear-and-simple-design A two-member record, the tag and the function.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It is a type and adds no runtime behavior.
   * @evidence contracts/common.md#meaningful-documentation The comment names the typia function the variant comes from.
   */
  export interface IValidate<T> {
    type: "validate";
    /**
     * The typia validation function generated for the requested type.
     *
     * @evidence contracts/common.md#principled-implementation The transform generates the function for the type argument of the decorator, taking the parsed value and returning the validation result with every error.
     * @evidence contracts/common.md#clear-and-simple-design One function member with the input the decorator has.
     * @evidence contracts/common.md#prohibited-implementation-shortcuts The function is generated from the type, and the runtime never edits its result.
     * @evidence contracts/common.md#meaningful-documentation The comment states that the function is generated for the requested type; its result is in the signature.
     */
    validate: (input: T) => IValidation<T>;
  }
}
