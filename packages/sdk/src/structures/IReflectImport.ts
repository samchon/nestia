/**
 * An import of a source file: its file, its namespace import, its default
 * import, its named elements, and their aliases.
 *
 * @evidence contracts/common.md#principled-implementation The record is one import declaration in a form that can be merged by file.
 * @evidence contracts/common.md#clear-and-simple-design A flat record with no behavior.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts It is a type and adds no runtime behavior.
 * @evidence contracts/common.md#meaningful-documentation The comment states what the type describes; its members are named for their meaning.
 */
export interface IReflectImport {
  file: string;
  asterisk: string | null;
  default: string | null;
  elements: string[];
  /** Maps a local named binding to the name exported by its source module. */
  elementAliases?: Record<string, string>;
}
