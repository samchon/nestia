export type IMetadataTypeTag = {
    target: ("string" | "number" | "bigint" | "boolean" | "array");
    name: string;
    kind: string;
    value: any;
    validate?: undefined | string;
    exclusive: boolean | Array<string>;
}