import { ImportDictionary } from "../../utils/ImportDictionary";

export namespace SdkImportWizard {
    export const Fetcher = (encrypted: boolean) =>
        encrypted ? EncryptedFetcher : PlainFetcher;

    export const HttpError = (importer: ImportDictionary) =>
        importer.external({
            type: true,
            library: "@nestia/fetcher",
            instance: "HttpError",
        });

    export const IConnection = (importer: ImportDictionary) =>
        importer.external({
            type: true,
            library: "@nestia/fetcher",
            instance: "IConnection",
        });

    export const Primitive = (importer: ImportDictionary) =>
        importer.external({
            type: true,
            library: "@nestia/fetcher",
            instance: "Primitive",
        });

    export const Resolved = (importer: ImportDictionary) =>
        importer.external({
            type: true,
            library: "@nestia/fetcher",
            instance: "Resolved",
        });

    export const typia = (importer: ImportDictionary) =>
        importer.external({
            type: false,
            library: "typia",
            instance: null,
        });
}

const PlainFetcher = (importer: ImportDictionary) =>
    importer.external({
        type: false,
        library: "@nestia/fetcher/lib/PlainFetcher",
        instance: "PlainFetcher",
    });

const EncryptedFetcher = (importer: ImportDictionary) =>
    importer.external({
        type: false,
        library: "@nestia/fetcher/lib/EncryptedFetcher",
        instance: "EncryptedFetcher",
    });
