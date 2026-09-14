export interface IOptional {
  required: string;
  optional?: boolean;
  explicit?: string | undefined;
  undefinable: string | undefined;
  nullable?: string | null;
  nested: { inner?: number; requiredInner: boolean };
  partial: Partial<{ mapped: string }>;
  requiredMapped: Required<{ fixed?: string }>;
  generic: IBox<boolean>;
  classValue: OptionalClass;
  alias: OptionalAlias;
  intersection: { left?: string } & { right: string };
  union: { kind: "a"; a?: string } | { kind: "b"; b?: number };
  array: Array<{ item?: string }>;
  tuple: [string, boolean];
  recursive?: IOptional;
  readonly "quoted-key"?: string;
  42?: string;
}

export interface IBox<T> {
  value?: T;
}

export class OptionalClass {
  property?: string;
}

export type OptionalAlias = { aliased?: string };
