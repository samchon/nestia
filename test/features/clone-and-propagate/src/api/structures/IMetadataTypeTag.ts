export type IMetadataTypeTag = {
  target: "string" | "number" | "bigint" | "boolean" | "array";
  name: string;
  kind: string;
  exclusive: boolean | string[];
  value?: any | undefined;
  validate?: undefined | string;
};
