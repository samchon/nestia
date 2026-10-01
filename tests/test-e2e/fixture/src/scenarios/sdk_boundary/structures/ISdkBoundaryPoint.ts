/**
 * Describes the two numeric fields echoed by the asynchronous boundary routes.
 *
 * @evidence contracts/common.md#principled-implementation Both coordinate properties are numbers; the native serializer and cloned DTO preserve their field names and supplied values on JSON wire.
 * @evidence contracts/common.md#clear-and-simple-design One named interface supplies the payload identity used by direct, defaulted and compound aliases.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The representation is the authored response contract; it carries no generated metadata or values chosen by a transformer.
 * @evidence contracts/common.md#meaningful-documentation Each field documents its relationship to the submitted value, and the alias comments explain awaiting, defaults and readonly view semantics.
 */
export interface ISdkBoundaryPoint {
  /** First numeric coordinate, preserved as supplied by the caller. */
  x: number;

  /** Second numeric coordinate, preserved as supplied by the caller. */
  y: number;
}

/**
 * Names a library Promise payload with the point as its default.
 *
 * @evidence contracts/common.md#principled-implementation Promise<T> follows TypeScript asynchronous payload semantics; substituting the authored default ISdkBoundaryPoint yields the same payload as an explicit argument.
 * @evidence contracts/common.md#clear-and-simple-design A single generic alias carries the default without another wrapper shape.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The alias uses the actual global library Promise rather than a same-spelled user type or a synthetic metadata definition.
 * @evidence contracts/common.md#meaningful-documentation The comment states both the asynchronous meaning and the default argument.
 */
export type SdkBoundaryAsync<T = ISdkBoundaryPoint> = Promise<T>;

/**
 * Chains the asynchronous alias without changing its payload.
 *
 * @evidence contracts/common.md#principled-implementation Substituting T into SdkBoundaryAsync<T> preserves the Promise<T> meaning and therefore its awaited value.
 * @evidence contracts/common.md#clear-and-simple-design One alias reference is enough to expose chained substitution to the actual checker.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The type is an ordinary TypeScript alias; it introduces no runtime hook or custom unwrapping rule.
 * @evidence contracts/common.md#meaningful-documentation The comment explains that chaining preserves the payload rather than adding a Promise body.
 */
export type SdkBoundaryChained<T> = SdkBoundaryAsync<T>;

/**
 * Names an asynchronous readonly array payload.
 *
 * @evidence contracts/common.md#principled-implementation Promise<readonly T[]> awaits to a readonly array view of T values; readonly constrains the type's writes while JSON transport retains its element values.
 * @evidence contracts/common.md#clear-and-simple-design One generic alias expresses both the wrapper and compound payload syntax.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The alias uses TypeScript's actual readonly array form instead of an invalid readonly modifier on a generic Array reference.
 * @evidence contracts/common.md#meaningful-documentation The comment distinguishes readonly type semantics from the transported element values.
 */
export type SdkBoundaryReadonly<T> = Promise<readonly T[]>;
