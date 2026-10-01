/**
 * Defines the original optional declaration and mapping distinctions.
 *
 * @evidence contracts/common.md#principled-implementation Required and optional members, explicit undefined, nested and mapped types, generics, classes, aliases, intersection, union, arrays, tuples, recursion and key forms retain the original source contract.
 * @evidence contracts/common.md#clear-and-simple-design One authored object collects distinct optional syntax without duplicated controllers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts These source annotations establish independent clone and assignment expectations; generated output is not used to define them.
 * @evidence contracts/common.md#meaningful-documentation The comment describes this authored contract and its role in the exact-optional input.
 */
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

/**
 * Defines a generic optional member.
 *
 * @evidence contracts/common.md#principled-implementation The optional marker belongs to value while the generic argument remains boolean in IOptional.
 * @evidence contracts/common.md#clear-and-simple-design One property isolates generic substitution and omission.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts This original generic annotation is preserved without emitter-dependent expected types.
 * @evidence contracts/common.md#meaningful-documentation The comment describes this authored contract and its role in the exact-optional input.
 */
export interface IBox<T> {
  value?: T;
}

/**
 * Defines a class-shaped optional property.
 *
 * @evidence contracts/common.md#principled-implementation A class property retains the same optional string contract as an authored object member.
 * @evidence contracts/common.md#clear-and-simple-design One property distinguishes class declaration provenance from aliases and interfaces.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No method, constructor or fabricated runtime metadata changes the class contract.
 * @evidence contracts/common.md#meaningful-documentation The comment describes this authored contract and its role in the exact-optional input.
 */
export class OptionalClass {
  property?: string;
}

/**
 * Defines an aliased optional object member.
 *
 * @evidence contracts/common.md#principled-implementation The original object alias retains its optional string member through native extraction and cloning.
 * @evidence contracts/common.md#clear-and-simple-design One alias isolates the optional marker at an alias declaration.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The original source contract supplies the expectation rather than a captured clone fragment.
 * @evidence contracts/common.md#meaningful-documentation The comment describes this authored contract and its role in the exact-optional input.
 */
export type OptionalAlias = { aliased?: string };
