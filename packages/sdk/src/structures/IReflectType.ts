/**
 * A reflected type: its name and, for a generic, its type arguments.
 *
 * @evidence contracts/common.md#principled-implementation The name is the text the transform recorded and the arguments make the type recursive.
 * @evidence contracts/common.md#clear-and-simple-design A flat record with no behavior.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts It is a type and adds no runtime behavior.
 * @evidence contracts/common.md#meaningful-documentation The comment states what the type describes; its members are named for their meaning.
 * @evidenceExclude contracts/portability.md#os-neutral-implementation IReflectType describes protocol or type metadata; any embedded import/source record preserves the identity supplied by its owner. This declaration defines no native path conversion or process boundary.
 */
export interface IReflectType {
  name: string;
  typeArguments?: IReflectType[];
}
