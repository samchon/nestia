/** Authored optional wire-shape input, including mapped and recursive members. */
export interface ISdkBoundaryOptional {
  required: string;
  optional?: boolean;
  explicit?: string | undefined;
  undefinable: string | undefined;
  nullable?: string | null;
  nested: { inner?: number; requiredInner: boolean };
  partial: Partial<{ mapped: string }>;
  requiredMapped: Required<{ fixed?: string }>;
  generic: ISdkBoundaryOptionalBox<boolean>;
  classValue: SdkBoundaryOptionalClass;
  alias: SdkBoundaryOptionalAlias;
  intersection: { left?: string } & { right: string };
  union: { kind: "a"; a?: string } | { kind: "b"; b?: number };
  array: Array<{ item?: string }>;
  tuple: [string, boolean];
  recursive?: ISdkBoundaryOptional;
  readonly "quoted-key"?: string;
  42?: string;
}

export interface ISdkBoundaryOptionalBox<T> {
  value?: T;
}

export class SdkBoundaryOptionalClass {
  property?: string;
}

export type SdkBoundaryOptionalAlias = { aliased?: string };
