/**
 * Superclass for the authored domain conversion.
 *
 * @evidence contracts/common.md#principled-implementation Constructor identity and the explicit inheritance chain determine converter specificity.
 * @evidence contracts/common.md#clear-and-simple-design An empty error subclass owns identity without additional state.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No product operation tests this class name; ExceptionManager uses its prototype chain.
 * @evidence contracts/common.md#meaningful-documentation The description identifies this constructor's place in the original order.
 */
export class CoreBoundaryDomainError extends Error {}

/**
 * Unrelated error interleaved between domain registrations.
 *
 * @evidence contracts/common.md#principled-implementation Constructor identity and the explicit inheritance chain determine converter specificity.
 * @evidence contracts/common.md#clear-and-simple-design An empty error subclass owns identity without additional state.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No product operation tests this class name; ExceptionManager uses its prototype chain.
 * @evidence contracts/common.md#meaningful-documentation The description identifies this constructor's place in the original order.
 */
export class CoreBoundaryOtherError extends Error {}

/**
 * Domain subclass with its own 404 conversion.
 *
 * @evidence contracts/common.md#principled-implementation Constructor identity and the explicit inheritance chain determine converter specificity.
 * @evidence contracts/common.md#clear-and-simple-design An empty error subclass owns identity without additional state.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No product operation tests this class name; ExceptionManager uses its prototype chain.
 * @evidence contracts/common.md#meaningful-documentation The description identifies this constructor's place in the original order.
 */
export class CoreBoundaryNotFoundError extends CoreBoundaryDomainError {}

/**
 * Deepest subclass with its own 410 conversion.
 *
 * @evidence contracts/common.md#principled-implementation Constructor identity and the explicit inheritance chain determine converter specificity.
 * @evidence contracts/common.md#clear-and-simple-design An empty error subclass owns identity without additional state.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No product operation tests this class name; ExceptionManager uses its prototype chain.
 * @evidence contracts/common.md#meaningful-documentation The description identifies this constructor's place in the original order.
 */
export class CoreBoundaryGoneError extends CoreBoundaryNotFoundError {}
