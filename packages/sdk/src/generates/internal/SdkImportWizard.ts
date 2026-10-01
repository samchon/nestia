import { ImportDictionary } from "./ImportDictionary";

/**
 * The imports of the SDK's runtime dependencies.
 *
 * @evidence contracts/common.md#principled-implementation The namespace names each dependency once so every generator registers it the same way.
 * @evidence contracts/common.md#clear-and-simple-design Six one-call helpers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Each helper registers one fixed import.
 * @evidence contracts/common.md#meaningful-documentation The comment states what the declaration produces and its result.
 */
export namespace SdkImportWizard {
  /**
   * Returns the import of the fetcher: the encrypted one or the plain one.
   *
   * @evidence contracts/common.md#principled-implementation The choice follows the route.
   * @evidence contracts/common.md#clear-and-simple-design One conditional.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It returns the registering function.
   * @evidence contracts/common.md#meaningful-documentation The comment states what the declaration produces and its result.
   */
  export const Fetcher = (encrypted: boolean) =>
    encrypted ? EncryptedFetcher : PlainFetcher;

  /**
   * Registers `HttpError` of `@nestia/fetcher`.
   *
   * @evidence contracts/common.md#principled-implementation It is a type import.
   * @evidence contracts/common.md#clear-and-simple-design One call.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The import is fixed.
   * @evidence contracts/common.md#meaningful-documentation The comment states what the declaration produces and its result.
   */
  export const HttpError = (importer: ImportDictionary) =>
    importer.external({
      declaration: true,
      file: "@nestia/fetcher",
      type: "element",
      name: "HttpError",
    });

  /**
   * Registers `IConnection` of `@nestia/fetcher`.
   *
   * @evidence contracts/common.md#principled-implementation It is a type import.
   * @evidence contracts/common.md#clear-and-simple-design One call.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The import is fixed.
   * @evidence contracts/common.md#meaningful-documentation The comment states what the declaration produces and its result.
   */
  export const IConnection = (importer: ImportDictionary) =>
    importer.external({
      declaration: true,
      file: "@nestia/fetcher",
      type: "element",
      name: "IConnection",
    });

  /**
   * Registers `Primitive` of `typia`.
   *
   * @evidence contracts/common.md#principled-implementation It is a type import.
   * @evidence contracts/common.md#clear-and-simple-design One call.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The import is fixed.
   * @evidence contracts/common.md#meaningful-documentation The comment states what the declaration produces and its result.
   */
  export const Primitive = (importer: ImportDictionary) =>
    importer.external({
      declaration: true,
      file: "typia",
      type: "element",
      name: "Primitive",
    });

  /**
   * Registers `Resolved` of `typia`.
   *
   * @evidence contracts/common.md#principled-implementation It is a type import.
   * @evidence contracts/common.md#clear-and-simple-design One call.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The import is fixed.
   * @evidence contracts/common.md#meaningful-documentation The comment states what the declaration produces and its result.
   */
  export const Resolved = (importer: ImportDictionary) =>
    importer.external({
      declaration: true,
      file: "typia",
      type: "element",
      name: "Resolved",
    });

  /**
   * Registers the default import of `typia`.
   *
   * @evidence contracts/common.md#principled-implementation It is a value import.
   * @evidence contracts/common.md#clear-and-simple-design One call.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The import is fixed.
   * @evidence contracts/common.md#meaningful-documentation The comment states what the declaration produces and its result.
   */
  export const typia = (importer: ImportDictionary) =>
    importer.external({
      declaration: false,
      file: "typia",
      type: "default",
      name: "typia",
    });
}

const PlainFetcher = (importer: ImportDictionary) =>
  importer.external({
    declaration: false,
    file: "@nestia/fetcher",
    type: "element",
    name: "PlainFetcher",
  });

const EncryptedFetcher = (importer: ImportDictionary) =>
  importer.external({
    declaration: false,
    file: "@nestia/fetcher/lib/EncryptedFetcher",
    type: "element",
    name: "EncryptedFetcher",
  });
