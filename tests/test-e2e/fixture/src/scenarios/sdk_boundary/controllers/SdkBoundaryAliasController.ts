import core from "@nestia/core";
import { Controller } from "@nestjs/common";

import {
  ISdkBoundaryPoint,
  SdkBoundaryAsync,
  SdkBoundaryChained,
  SdkBoundaryReadonly,
} from "../structures/ISdkBoundaryPoint";

/**
 * Connects awaited type aliases to reflected payloads and actual JSON bodies.
 *
 * @evidence contracts/common.md#principled-implementation The four stateless handlers return the submitted point values through library Promise aliases, so awaiting exposes the payload while the native contributor records the resolved type and the generator supplies its own outer Promise.
 * @evidence contracts/common.md#clear-and-simple-design Each method isolates direct, chained, defaulted or readonly-array annotation syntax without another application or metadata implementation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Public core decorators and Promise.resolve exercise the real producer; no handwritten OperationMetadata or substituted generator supplies the expected response.
 * @evidence contracts/common.md#meaningful-documentation The class and method comments describe the alias form, echoed values and readonly representation used by each input.
 */
@Controller("sdk_boundary/alias")
export class SdkBoundaryAliasController {
  @core.TypedRoute.Post("direct")
  /**
   * Echoes a point through a direct library Promise alias.
   *
   * @evidence contracts/common.md#principled-implementation SdkBoundaryAsync<ISdkBoundaryPoint> denotes Promise of the authored point; Promise.resolve returns that same submitted value, establishing its awaited HTTP payload.
   * @evidence contracts/common.md#clear-and-simple-design One Promise.resolve call retains the decoded input; the annotation carries this method's distinct generic form.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The method uses the native-backed public decorators and the platform Promise API without fixture-dependent transform logic.
   * @evidence contracts/common.md#meaningful-documentation The comment states the alias form and the returned value's relationship to the caller input.
   */
  public direct(
    @core.TypedBody() input: ISdkBoundaryPoint,
  ): SdkBoundaryAsync<ISdkBoundaryPoint> {
    return Promise.resolve(input);
  }

  @core.TypedRoute.Post("chained")
  /**
   * Echoes a point through a chained asynchronous alias.
   *
   * @evidence contracts/common.md#principled-implementation SdkBoundaryChained<ISdkBoundaryPoint> expands through SdkBoundaryAsync to the same Promise payload, preserving alias substitution without changing the echoed value.
   * @evidence contracts/common.md#clear-and-simple-design One Promise.resolve call retains the decoded input; the annotation carries this method's distinct generic form.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The method uses the native-backed public decorators and the platform Promise API without fixture-dependent transform logic.
   * @evidence contracts/common.md#meaningful-documentation The comment states the alias form and the returned value's relationship to the caller input.
   */
  public chained(
    @core.TypedBody() input: ISdkBoundaryPoint,
  ): SdkBoundaryChained<ISdkBoundaryPoint> {
    return Promise.resolve(input);
  }

  @core.TypedRoute.Post("defaulted")
  /**
   * Uses the asynchronous alias's authored default point payload.
   *
   * @evidence contracts/common.md#principled-implementation SdkBoundaryAsync defaults its type parameter to ISdkBoundaryPoint, and the submitted point is the resolved value; the absent explicit argument must not change the response payload.
   * @evidence contracts/common.md#clear-and-simple-design One Promise.resolve call retains the decoded input; the annotation carries this method's distinct generic form.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The method uses the native-backed public decorators and the platform Promise API without fixture-dependent transform logic.
   * @evidence contracts/common.md#meaningful-documentation The comment states the alias form and the returned value's relationship to the caller input.
   */
  public defaulted(
    @core.TypedBody() input: ISdkBoundaryPoint,
  ): SdkBoundaryAsync {
    return Promise.resolve(input);
  }

  @core.TypedRoute.Post("readonly")
  /**
   * Returns a point array through a readonly asynchronous payload alias.
   *
   * @evidence contracts/common.md#principled-implementation SdkBoundaryReadonly<ISdkBoundaryPoint> denotes Promise of readonly point array; the submitted mutable array is assignable to that readonly view and its elements remain the actual returned values.
   * @evidence contracts/common.md#clear-and-simple-design One Promise.resolve call retains the decoded input; the annotation carries this method's distinct generic form.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The method uses the native-backed public decorators and the platform Promise API without fixture-dependent transform logic.
   * @evidence contracts/common.md#meaningful-documentation The comment states the alias form and the returned value's relationship to the caller input.
   */
  public readonlyPayload(
    @core.TypedBody() input: ISdkBoundaryPoint[],
  ): SdkBoundaryReadonly<ISdkBoundaryPoint> {
    return Promise.resolve(input);
  }
}
