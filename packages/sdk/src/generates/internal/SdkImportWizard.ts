import { ImportDictionary } from "./ImportDictionary";

export namespace SdkImportWizard {
  export const Fetcher = (encrypted: boolean) =>
    encrypted ? EncryptedFetcher : PlainFetcher;

  export const HttpError = (importer: ImportDictionary) =>
    importer.external({
      declaration: true,
      file: "@nestia/fetcher",
      type: "element",
      name: "HttpError",
    });

  export const IConnection = (importer: ImportDictionary) =>
    importer.external({
      declaration: true,
      file: "@nestia/fetcher",
      type: "element",
      name: "IConnection",
    });

  export const Primitive = (importer: ImportDictionary) =>
    importer.external({
      declaration: true,
      file: "typia",
      type: "element",
      name: "Primitive",
    });

  export const Resolved = (importer: ImportDictionary) =>
    importer.external({
      declaration: true,
      file: "typia",
      type: "element",
      name: "Resolved",
    });

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
    file: "@nestia/fetcher/lib/PlainFetcher",
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
