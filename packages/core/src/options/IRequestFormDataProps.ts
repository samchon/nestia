import { IValidation } from "typia";

export interface IRequestFormDataProps<T> {
  files: Array<IRequestFormDataProps.IFile>;
  validator:
    | IRequestFormDataProps.IAssert<T>
    | IRequestFormDataProps.IIs<T>
    | IRequestFormDataProps.IValidate<T>;
}
/**
 * Properties that the transform passes to `TypedFormData.Body`: the file fields
 * and the validator.
 *
 * `files` names the file fields of the type with their limits, and `validator`
 * validates the `FormData` made from the fields and the uploaded files.
 *
 * @evidence contracts/common.md#principled-implementation The record carries what the multipart handling needs: which fields are files, with how many each may hold, and how to validate the assembled form.
 * @evidence contracts/common.md#clear-and-simple-design A two-member record whose nested types describe the variants and the file entries.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts It is a type and adds no runtime behavior.
 * @evidence contracts/common.md#meaningful-documentation The comment names the two members and the decorator that receives them.
 * @evidenceExclude contracts/portability.md#os-neutral-implementation FormData validators and file-field names describe multipart protocol data; no member is a native storage path or handle.
 */
export namespace IRequestFormDataProps {
  /**
   * Validator generated from `typia.assert`.
   *
   * @evidence contracts/common.md#principled-implementation The variant tags a function of `FormData` that returns the decoded object or throws the `TypeGuardError` of typia, which becomes a `BadRequestException` with the path, reason, expected type, and value.
   * @evidence contracts/common.md#clear-and-simple-design A two-member record, the tag and the function.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It is a type and adds no runtime behavior.
   * @evidence contracts/common.md#meaningful-documentation The comment names the typia function the variant comes from.
   * @evidenceExclude contracts/portability.md#os-neutral-implementation FormData validators and file-field names describe multipart protocol data; no member is a native storage path or handle.
   */
  export interface IAssert<T> {
    type: "assert";
    /**
     * The typia assertion function generated for the requested type.
     *
     * @evidence contracts/common.md#principled-implementation The transform generates the function for the type argument, taking the form and returning the decoded object or throwing.
     * @evidence contracts/common.md#clear-and-simple-design One function member.
     * @evidence contracts/common.md#prohibited-implementation-shortcuts The function is generated from the type, and the runtime never edits its result.
     * @evidence contracts/common.md#meaningful-documentation The comment states that the function is generated for the requested type.
     * @evidenceExclude contracts/portability.md#os-neutral-implementation FormData validators and file-field names describe multipart protocol data; no member is a native storage path or handle.
     */
    assert: (input: FormData) => T;
  }
  /**
   * Validator generated from `typia.is`.
   *
   * @evidence contracts/common.md#principled-implementation The variant tags a function of `FormData` that returns the decoded object or `null`; `null` becomes a `BadRequestException` with only the fixed message.
   * @evidence contracts/common.md#clear-and-simple-design A two-member record, the tag and the function.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It is a type and adds no runtime behavior.
   * @evidence contracts/common.md#meaningful-documentation The comment names the typia function the variant comes from.
   * @evidenceExclude contracts/portability.md#os-neutral-implementation FormData validators and file-field names describe multipart protocol data; no member is a native storage path or handle.
   */
  export interface IIs<T> {
    type: "is";
    /**
     * The typia check function generated for the requested type.
     *
     * @evidence contracts/common.md#principled-implementation The transform generates the function for the type argument, taking the form and returning the decoded object or `null`.
     * @evidence contracts/common.md#clear-and-simple-design One function member.
     * @evidence contracts/common.md#prohibited-implementation-shortcuts The function is generated from the type, and the runtime never edits its result.
     * @evidence contracts/common.md#meaningful-documentation The comment states that the function is generated for the requested type.
     * @evidenceExclude contracts/portability.md#os-neutral-implementation FormData validators and file-field names describe multipart protocol data; no member is a native storage path or handle.
     */
    is: (input: FormData) => T | null;
  }
  /**
   * Validator generated from `typia.validate`.
   *
   * @evidence contracts/common.md#principled-implementation The variant tags a function of `FormData` that returns the `IValidation` of typia; a failure becomes a `BadRequestException` carrying every error.
   * @evidence contracts/common.md#clear-and-simple-design A two-member record, the tag and the function.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It is a type and adds no runtime behavior.
   * @evidence contracts/common.md#meaningful-documentation The comment names the typia function the variant comes from.
   * @evidenceExclude contracts/portability.md#os-neutral-implementation FormData validators and file-field names describe multipart protocol data; no member is a native storage path or handle.
   */
  export interface IValidate<T> {
    type: "validate";
    /**
     * The typia validation function generated for the requested type.
     *
     * @evidence contracts/common.md#principled-implementation The transform generates the function for the type argument, taking the form and returning the validation result.
     * @evidence contracts/common.md#clear-and-simple-design One function member.
     * @evidence contracts/common.md#prohibited-implementation-shortcuts The function is generated from the type, and the runtime never edits its result.
     * @evidence contracts/common.md#meaningful-documentation The comment states that the function is generated for the requested type.
     * @evidenceExclude contracts/portability.md#os-neutral-implementation FormData validators and file-field names describe multipart protocol data; no member is a native storage path or handle.
     */
    validate: (input: FormData) => IValidation<T>;
  }
  /**
   * A file field of a multipart form: its name and the number of files it may
   * hold, or `null` for no limit.
   *
   * A limit of 1 makes the multer field accept one file; any other value leaves
   * the field unlimited.
   *
   * @evidence contracts/common.md#principled-implementation A limit of 1 makes the multer field accept one file and any other value leaves the field unlimited, which is how the runtime configures `multer.fields`.
   * @evidence contracts/common.md#clear-and-simple-design A two-field record with no behavior.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The values come from the type through the transform, not from a fixture.
   * @evidence contracts/common.md#meaningful-documentation The comment states the meaning of the name and of the limit.
   * @evidenceExclude contracts/portability.md#os-neutral-implementation FormData validators and file-field names describe multipart protocol data; no member is a native storage path or handle.
   */
  export interface IFile {
    name: string;
    limit: number | null;
  }
}
