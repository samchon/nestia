/**
 * A class constructor: anything that can be called with `new` to build an
 * instance of `T`.
 *
 * @evidence contracts/common.md#principled-implementation The construct signature with rest arguments is the standard TypeScript spelling of a class type.
 * @evidence contracts/common.md#clear-and-simple-design One construct signature.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts It is a type and adds no runtime behavior.
 * @evidence contracts/common.md#meaningful-documentation The comment states what the type stands for.
 */
export type Creator<T extends object> = {
  new (...args: any[]): T;
};
