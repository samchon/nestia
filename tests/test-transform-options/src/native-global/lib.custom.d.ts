/**
 * A user-authored global that borrows a runtime native's name, in a file whose
 * name borrows a default library's shape.
 *
 * Both halves matter. `Blob` is a name typia gives runtime-native identity, and
 * `lib.*.d.ts` is the pattern the metadata analysis falls back to when no host
 * tells it which files the program actually treats as default libraries.
 * Nothing here is a runtime authority, so this `Blob` must be validated
 * structurally.
 */
interface Blob {
  customField: string;
}
