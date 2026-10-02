import { IComparable } from "tstl";

import { IOperationMetadata } from "../structures/IOperationMetadata";

/**
 * An error or warning of the reflection: the file, the class, the function, the
 * origin, and the contents.
 *
 * @evidence contracts/common.md#principled-implementation The members locate a problem down to the part of a function, and the namespace's key orders errors by that location so a report groups them.
 * @evidence contracts/common.md#clear-and-simple-design A record and one key class in its namespace.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts It is a type and adds no runtime behavior. The key class only compares fields.
 * @evidence contracts/common.md#meaningful-documentation The comment states what the record locates.
 * @evidence contracts/portability.md#os-neutral-implementation file carries the original native source identity for diagnostics; class, function and from identify declarations rather than filesystem components.
 */
export interface IReflectOperationError {
  file: string;
  class: string;
  function: string | null;
  from: string | null;
  contents: Array<string | IOperationMetadata.IError>;
}
export namespace IReflectOperationError {
  /**
   * An ordering key of an error: file, then class, then function, then origin.
   *
   * @evidence contracts/common.md#principled-implementation The key implements the strict weak order over the four fields that tstl's tree map requires, with an absent value ordered as the empty string.
   * @evidence contracts/common.md#clear-and-simple-design One class with one method.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It compares fields and holds no state beyond the error.
   * @evidence contracts/common.md#meaningful-documentation The comment states the order.
   * @evidence contracts/portability.md#os-neutral-implementation The key retains supplied source file spelling and declaration identifiers. Ordering is lexical for diagnostic grouping without asserting filesystem case or symlink equivalence.
   */
  export class Key implements Pick<IComparable<Key>, "less"> {
    public constructor(public readonly error: IReflectOperationError) {}

    /**
     * Returns whether this key orders before the other.
     *
     * @evidence contracts/common.md#principled-implementation The fields are compared in order and the first that differs decides, which is a lexicographic order.
     * @evidence contracts/common.md#clear-and-simple-design One method of chained comparisons.
     * @evidence contracts/common.md#prohibited-implementation-shortcuts It compares only the four location fields.
     * @evidence contracts/common.md#meaningful-documentation The comment states the result.
     * @evidence contracts/portability.md#os-neutral-implementation Comparison orders source identity strings and declaration fields lexically; it neither canonicalizes native paths nor treats ordering as filesystem equivalence.
     */
    public less(obj: Key): boolean {
      if (this.error.file !== obj.error.file)
        return this.error.file < obj.error.file;
      else if (this.error.class !== obj.error.class)
        return this.error.class < obj.error.class;
      else if (this.error.function !== obj.error.function)
        return (this.error.function ?? "") < (obj.error.function ?? "");
      return (this.error.from ?? "") < (obj.error.from ?? "");
    }
  }
}
