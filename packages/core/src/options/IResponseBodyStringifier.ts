import { IValidation } from "typia";

export type IResponseBodyStringifier<T> =
  | IResponseBodyStringifier.IStringify<T>
  | IResponseBodyStringifier.IIs<T>
  | IResponseBodyStringifier.IAssert<T>
  | IResponseBodyStringifier.IValidate<T>
  | IResponseBodyStringifier.IValidateLog<T>;
/**
 * The serializer that the transform passes to `TypedRoute` and `EncryptedRoute`
 * for the JSON text of the response body.
 *
 * The literal `type` field selects which typia function generated it:
 * `stringify` (no validation), `is`, `assert`, `validate`, or `validate.log`.
 * `get_path_and_stringify` turns a failing validation into a 500 response,
 * except `validate.log`, which logs the failure and answers with
 * `JSON.stringify` of the data.
 *
 * @evidence contracts/common.md#principled-implementation The union is discriminated by the literal `type`, so the runtime selects the serializer with one comparison; the five variants are the typia stringify families, of which four validate the data and one does not.
 * @evidence contracts/common.md#clear-and-simple-design Five variants, one per typia function family, with no shared base because each function has a different shape.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts It is a type and adds no runtime behavior; the runtime rejects an unknown `type` with an error instead of accepting it.
 * @evidence contracts/common.md#meaningful-documentation The comment names the decorators that receive the serializer and the response each variant produces on a failed validation.
 * @evidenceExclude contracts/portability.md#os-neutral-implementation The variants describe JSON serialization and validation callbacks without native file or process representations.
 */
export namespace IResponseBodyStringifier {
  /**
   * Serializer generated from `typia.json.stringify`, without validation.
   *
   * @evidence contracts/common.md#principled-implementation The variant tags a function that serializes the data as it is, so a value of the wrong type is serialized as far as its shape allows without this variant performing validation.
   * @evidence contracts/common.md#clear-and-simple-design A two-member record, the tag and the function.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It is a type and adds no runtime behavior.
   * @evidence contracts/common.md#meaningful-documentation The comment names the typia function the variant comes from.
   * @evidenceExclude contracts/portability.md#os-neutral-implementation The variants describe JSON serialization and validation callbacks without native file or process representations.
   */
  export interface IStringify<T> {
    type: "stringify";
    /**
     * The generated function of the variant, taking the response data.
     *
     * @evidence contracts/common.md#principled-implementation The transform generates the function for the return type of the route method, and the runtime uses the result as the response body as it is.
     * @evidence contracts/common.md#clear-and-simple-design One function member.
     * @evidence contracts/common.md#prohibited-implementation-shortcuts The function is generated from the type, and the runtime never edits its result.
     * @evidence contracts/common.md#meaningful-documentation The comment states that the function is generated for the return type; its result is in the signature.
     * @evidenceExclude contracts/portability.md#os-neutral-implementation The variants describe JSON serialization and validation callbacks without native file or process representations.
     */
    stringify: (input: T) => string;
  }
  /**
   * Serializer generated from `typia.json.isStringify`.
   *
   * @evidence contracts/common.md#principled-implementation The variant tags a function that returns the serialized text, or `null` when the data is not of the type; `null` becomes a 500 `InternalServerErrorException` with a fixed message.
   * @evidence contracts/common.md#clear-and-simple-design A two-member record, the tag and the function.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It is a type and adds no runtime behavior.
   * @evidence contracts/common.md#meaningful-documentation The comment names the typia function the variant comes from.
   * @evidenceExclude contracts/portability.md#os-neutral-implementation The variants describe JSON serialization and validation callbacks without native file or process representations.
   */
  export interface IIs<T> {
    type: "is";
    /**
     * The generated function of the variant, taking the response data.
     *
     * @evidence contracts/common.md#principled-implementation The transform generates the function for the return type of the route method, and it returns the serialized text or `null`.
     * @evidence contracts/common.md#clear-and-simple-design One function member.
     * @evidence contracts/common.md#prohibited-implementation-shortcuts The function is generated from the type, and the runtime never edits its result.
     * @evidence contracts/common.md#meaningful-documentation The comment states that the function is generated for the return type; its result is in the signature.
     * @evidenceExclude contracts/portability.md#os-neutral-implementation The variants describe JSON serialization and validation callbacks without native file or process representations.
     */
    is: (input: T) => string | null;
  }
  /**
   * Serializer generated from `typia.json.assertStringify`.
   *
   * @evidence contracts/common.md#principled-implementation The variant tags a function that returns the serialized text or throws the `TypeGuardError` of typia, which becomes a 500 `InternalServerErrorException` with the path, reason, expected type, and value.
   * @evidence contracts/common.md#clear-and-simple-design A two-member record, the tag and the function.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It is a type and adds no runtime behavior.
   * @evidence contracts/common.md#meaningful-documentation The comment names the typia function the variant comes from.
   * @evidenceExclude contracts/portability.md#os-neutral-implementation The variants describe JSON serialization and validation callbacks without native file or process representations.
   */
  export interface IAssert<T> {
    type: "assert";
    /**
     * The generated function of the variant, taking the response data.
     *
     * @evidence contracts/common.md#principled-implementation The transform generates the function for the return type of the route method, and it returns the serialized text or throws.
     * @evidence contracts/common.md#clear-and-simple-design One function member.
     * @evidence contracts/common.md#prohibited-implementation-shortcuts The function is generated from the type, and the runtime never edits its result.
     * @evidence contracts/common.md#meaningful-documentation The comment states that the function is generated for the return type; its result is in the signature.
     * @evidenceExclude contracts/portability.md#os-neutral-implementation The variants describe JSON serialization and validation callbacks without native file or process representations.
     */
    assert: (input: T) => string;
  }
  /**
   * Serializer generated from `typia.json.validateStringify`.
   *
   * @evidence contracts/common.md#principled-implementation The variant tags a function that returns the `IValidation` of the text; a failure becomes a 500 `InternalServerErrorException` carrying every error.
   * @evidence contracts/common.md#clear-and-simple-design A two-member record, the tag and the function.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It is a type and adds no runtime behavior.
   * @evidence contracts/common.md#meaningful-documentation The comment names the typia function the variant comes from.
   * @evidenceExclude contracts/portability.md#os-neutral-implementation The variants describe JSON serialization and validation callbacks without native file or process representations.
   */
  export interface IValidate<T> {
    type: "validate";
    /**
     * The generated function of the variant, taking the response data.
     *
     * @evidence contracts/common.md#principled-implementation The transform generates the function for the return type of the route method, and it returns the validation result.
     * @evidence contracts/common.md#clear-and-simple-design One function member.
     * @evidence contracts/common.md#prohibited-implementation-shortcuts The function is generated from the type, and the runtime never edits its result.
     * @evidence contracts/common.md#meaningful-documentation The comment states that the function is generated for the return type; its result is in the signature.
     * @evidenceExclude contracts/portability.md#os-neutral-implementation The variants describe JSON serialization and validation callbacks without native file or process representations.
     */
    validate: (input: T) => IValidation<string>;
  }
  /**
   * Serializer generated from `typia.json.validateStringify`, for the
   * `validate.log` mode.
   *
   * @evidence contracts/common.md#principled-implementation The variant tags the same function shape as `validate`, but a failure is passed to the logger registered with `TypedRoute.setValidateErrorLogger` and the response is `JSON.stringify` of the data, so a validation failure never changes the status.
   * @evidence contracts/common.md#clear-and-simple-design A two-member record, the tag and the function.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It is a type and adds no runtime behavior.
   * @evidence contracts/common.md#meaningful-documentation The comment names the typia function the variant comes from.
   * @evidenceExclude contracts/portability.md#os-neutral-implementation The variants describe JSON serialization and validation callbacks without native file or process representations.
   */
  export interface IValidateLog<T> {
    type: "validate.log";
    /**
     * The generated function of the variant, taking the response data.
     *
     * @evidence contracts/common.md#principled-implementation The transform generates the function for the return type of the route method, and it returns the validation result.
     * @evidence contracts/common.md#clear-and-simple-design One function member.
     * @evidence contracts/common.md#prohibited-implementation-shortcuts The function is generated from the type, and the runtime never edits its result.
     * @evidence contracts/common.md#meaningful-documentation The comment states that the function is generated for the return type; its result is in the signature.
     * @evidenceExclude contracts/portability.md#os-neutral-implementation The variants describe JSON serialization and validation callbacks without native file or process representations.
     */
    validate: (input: T) => IValidation<string>;
  }
}
