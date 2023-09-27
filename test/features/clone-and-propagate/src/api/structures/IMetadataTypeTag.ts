export type IMetadataTypeTag = {
    target: ("string" | "number" | "bigint" | "array");
    name: string;
    kind: string;
    value: any;
    validate: string;
    exclusive: boolean | Array<string>;
}