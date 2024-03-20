export type IMetadataTypeTag = {
  target: "array" | "bigint" | "boolean" | "number" | "string";
  name: string;
  kind: string;
  exclusive: boolean | string[];
  value?: any | undefined;
  validate?: undefined | string;
  schema?: undefined | {};
};
