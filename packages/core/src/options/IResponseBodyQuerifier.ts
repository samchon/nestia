import { IValidation } from "typia";

/**
 * The serializer that the transform passes to `TypedQuery.Get`,
 * `TypedQuery.Post`, `TypedQuery.Put`, `TypedQuery.Patch`, and
 * `TypedQuery.Delete` for the urlencoded form of the response body.
 *
 * The literal `type` field selects which typia function generated it:
 * `stringify` (no validation), `is`, `assert`, `validate`, or `validate.log`.
 * `get_path_and_querify` turns a failing validation into a 500 response, except
 * `validate.log`, which logs the failure and answers with the plain conversion
 * of the data into `URLSearchParams`.
 *
 * @evidence contracts/common.md#principled-implementation The union is discriminated by the literal `type`, so the runtime selects the serializer with one comparison; the five variants are the typia stringify families, of which four validate the data and one does not.
 * @evidence contracts/common.md#clear-and-simple-design Five variants, one per typia function family, with no shared base because each function has a different shape.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts It is a type and adds no runtime behavior; the runtime rejects an unknown `type` with an error instead of accepting it.
 * @evidence contracts/common.md#meaningful-documentation The comment names the decorators that receive the serializer and the response each variant produces on a failed validation.
 */
export type IResponseBodyQuerifier<T> =
  | IResponseBodyquerifier.IStringify<T>
  | IResponseBodyquerifier.IIs<T>
  | IResponseBodyquerifier.IAssert<T>
  | IResponseBodyquerifier.IValidate<T>
  | IResponseBodyquerifier.IValidateLog<T>;
/**
 * The variant records of {@link IResponseBodyQuerifier}.
 *
 * The lowercase q is the spelling of the exported namespace name, which
 * existing code may reference.
 *
 * @evidence contracts/common.md#principled-implementation The namespace declares the five variant records that the union of the same name combines, so the union and its variants are one public family.
 * @evidence contracts/common.md#clear-and-simple-design Five records with no runtime members.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts It contains types only; the spelling is kept because renaming an exported identifier is a breaking change.
 * @evidence contracts/common.md#meaningful-documentation The comment states what the namespace holds and why its name has a lowercase q.
 */
export namespace IResponseBodyquerifier {
  /**
   * Serializer generated from `typia.json.stringify`, without validation.
   *
   * @evidence contracts/common.md#principled-implementation The variant tags a function that serializes the data as it is, so a value of the wrong type is serialized as far as its shape allows and never rejected.
   * @evidence contracts/common.md#clear-and-simple-design A two-member record, the tag and the function.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It is a type and adds no runtime behavior.
   * @evidence contracts/common.md#meaningful-documentation The comment names the typia function the variant comes from.
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
     */
    stringify: (input: T) => URLSearchParams;
  }
  /**
   * Serializer generated from `typia.json.isStringify`.
   *
   * @evidence contracts/common.md#principled-implementation The variant tags a function that returns the serialized text, or `null` when the data is not of the type; `null` becomes a 500 `InternalServerErrorException` with a fixed message.
   * @evidence contracts/common.md#clear-and-simple-design A two-member record, the tag and the function.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It is a type and adds no runtime behavior.
   * @evidence contracts/common.md#meaningful-documentation The comment names the typia function the variant comes from.
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
     */
    is: (input: T) => URLSearchParams | null;
  }
  /**
   * Serializer generated from `typia.json.assertStringify`.
   *
   * @evidence contracts/common.md#principled-implementation The variant tags a function that returns the serialized text or throws the `TypeGuardError` of typia, which becomes a 500 `InternalServerErrorException` with the path, reason, expected type, and value.
   * @evidence contracts/common.md#clear-and-simple-design A two-member record, the tag and the function.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It is a type and adds no runtime behavior.
   * @evidence contracts/common.md#meaningful-documentation The comment names the typia function the variant comes from.
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
     */
    assert: (input: T) => URLSearchParams;
  }
  /**
   * Serializer generated from `typia.json.validateStringify`.
   *
   * @evidence contracts/common.md#principled-implementation The variant tags a function that returns the `IValidation` of the text; a failure becomes a 500 `InternalServerErrorException` carrying every error.
   * @evidence contracts/common.md#clear-and-simple-design A two-member record, the tag and the function.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It is a type and adds no runtime behavior.
   * @evidence contracts/common.md#meaningful-documentation The comment names the typia function the variant comes from.
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
     */
    validate: (input: T) => IValidation<URLSearchParams>;
  }
  /**
   * Serializer generated from `typia.json.validateStringify`, for the
   * `validate.log` mode.
   *
   * @evidence contracts/common.md#principled-implementation The variant tags the same function shape as `validate`, but a failure is passed to the logger registered with `TypedRoute.setValidateErrorLogger` and the response is the plain conversion of the data into `URLSearchParams`, so a validation failure never changes the status.
   * @evidence contracts/common.md#clear-and-simple-design A two-member record, the tag and the function.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It is a type and adds no runtime behavior.
   * @evidence contracts/common.md#meaningful-documentation The comment names the typia function the variant comes from.
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
     */
    validate: (input: T) => IValidation<URLSearchParams>;
  }
}
