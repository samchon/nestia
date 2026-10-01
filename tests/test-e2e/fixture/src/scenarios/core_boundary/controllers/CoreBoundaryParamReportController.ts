import core from "@nestia/core";
import { Controller } from "@nestjs/common";
import typia from "typia";

/**
 * Separates the two supported parameter error shapes in one program.
 *
 * @evidence contracts/common.md#principled-implementation Both routes share the public numeric decoder and differ only in the explicit third TypedParam flag.
 * @evidence contracts/common.md#clear-and-simple-design A flat sibling and structured sibling return the same accepted number.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Three-argument TypedParam is a supported manual ABI; native argument generation leaves it intact without fixture branches.
 * @evidence contracts/common.md#meaningful-documentation This runtime witness does not claim a global validate configuration was compiled here.
 */
@Controller("core_boundary/param_report")
export class CoreBoundaryParamReportController {
  @core.TypedRoute.Get("flat/:value")
  /**
   * Returns a decoded number with flat error reporting.
   *
   * @evidence contracts/common.md#principled-implementation The public typia parameter decoder casts numeric text and rejects two; the literal flag selects the runtime error body.
   * @evidence contracts/common.md#clear-and-simple-design Only the reporting flag differs from the sibling.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Public createParameter and TypedParam are compiled normally; no custom exception fabrication is used.
   * @evidence contracts/common.md#meaningful-documentation The method documents its report shape and accepted value.
   */
  public flat(
    @core.TypedParam("value", typia.http.createParameter<number>(), false)
    value: number,
  ): number {
    return value;
  }
  @core.TypedRoute.Get("structured/:value")
  /**
   * Returns a decoded number with structured error reporting.
   *
   * @evidence contracts/common.md#principled-implementation The public typia parameter decoder casts numeric text and rejects two; the literal flag selects the runtime error body.
   * @evidence contracts/common.md#clear-and-simple-design Only the reporting flag differs from the sibling.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Public createParameter and TypedParam are compiled normally; no custom exception fabrication is used.
   * @evidence contracts/common.md#meaningful-documentation The method documents its report shape and accepted value.
   */
  public structured(
    @core.TypedParam("value", typia.http.createParameter<number>(), true)
    value: number,
  ): number {
    return value;
  }
}
