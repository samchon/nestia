import core from "@nestia/core";
import {
  Controller,
  Get,
  InternalServerErrorException,
  UnprocessableEntityException,
  UseFilters,
} from "@nestjs/common";
import type { tags } from "typia";

import { CoreBoundaryHttpExceptionFilter } from "../filters/CoreBoundaryHttpExceptionFilter";
import {
  CoreBoundaryArticleStore,
  CoreBoundaryAttachment,
} from "../structures/CoreBoundaryExceptionInput";

/**
 * Connects the five original local-filter failure sources to HTTP.
 *
 * @evidence contracts/common.md#principled-implementation Body, query and UUID validators plus typed and ordinary thrown exceptions reach the same method-local HttpException filter.
 * @evidence contracts/common.md#clear-and-simple-design Five original paths and a health path share a stateless controller.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Only the five marked methods install the filter; peer routes and global error priority remain unchanged.
 * @evidence contracts/common.md#meaningful-documentation Methods distinguish validation, typed route conversion and ordinary Nest errors.
 */
@Controller("core_boundary/filter")
export class CoreBoundaryExceptionFilterController {
  @UseFilters(CoreBoundaryHttpExceptionFilter)
  @core.TypedRoute.Post("typedBody")
  /**
   * Accepts an article or rejects an empty object.
   *
   * @evidence contracts/common.md#principled-implementation The original article store contract owns validation before the handler.
   * @evidence contracts/common.md#clear-and-simple-design One stateless handler preserves the submitted value or throws its declared HTTP exception.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Public core and Nest decorators retain their normal error handling.
   * @evidence contracts/common.md#meaningful-documentation The method documents its accepted input or intentional error.
   */
  public typedBody(
    @core.TypedBody() input: CoreBoundaryArticleStore,
  ): CoreBoundaryArticleStore {
    return input;
  }
  @UseFilters(CoreBoundaryHttpExceptionFilter)
  @core.TypedRoute.Get("typedManual")
  /**
   * Throws the original explicit 422 error.
   *
   * @evidence contracts/common.md#principled-implementation UnprocessableEntityException independently supplies status422.
   * @evidence contracts/common.md#clear-and-simple-design One stateless handler preserves the submitted value or throws its declared HTTP exception.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Public core and Nest decorators retain their normal error handling.
   * @evidence contracts/common.md#meaningful-documentation The method documents its accepted input or intentional error.
   */
  public typedManual(): void {
    throw new UnprocessableEntityException("Unprocessable");
  }
  @UseFilters(CoreBoundaryHttpExceptionFilter)
  @core.TypedRoute.Get(":id/typedParam")
  /**
   * Validates the original UUID path.
   *
   * @evidence contracts/common.md#principled-implementation The UUID format accepts a real UUID and rejects abcd.
   * @evidence contracts/common.md#clear-and-simple-design One stateless handler preserves the submitted value or throws its declared HTTP exception.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Public core and Nest decorators retain their normal error handling.
   * @evidence contracts/common.md#meaningful-documentation The method documents its accepted input or intentional error.
   */
  public typedParam(
    @core.TypedParam("id") id: string & tags.Format<"uuid">,
  ): string {
    return id;
  }
  @UseFilters(CoreBoundaryHttpExceptionFilter)
  @core.TypedRoute.Get("typedQuery")
  /**
   * Decodes the original attachment query.
   *
   * @evidence contracts/common.md#principled-implementation Required attachment fields reject an empty query.
   * @evidence contracts/common.md#clear-and-simple-design One stateless handler preserves the submitted value or throws its declared HTTP exception.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Public core and Nest decorators retain their normal error handling.
   * @evidence contracts/common.md#meaningful-documentation The method documents its accepted input or intentional error.
   */
  public typedQuery(
    @core.TypedQuery() input: CoreBoundaryAttachment,
  ): CoreBoundaryAttachment {
    return input;
  }
  @UseFilters(CoreBoundaryHttpExceptionFilter)
  @Get("internal")
  /**
   * Throws the original ordinary Nest 500 error.
   *
   * @evidence contracts/common.md#principled-implementation The ordinary Get route reaches Nest exception filtering without TypedRoute conversion.
   * @evidence contracts/common.md#clear-and-simple-design One stateless handler preserves the submitted value or throws its declared HTTP exception.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Public core and Nest decorators retain their normal error handling.
   * @evidence contracts/common.md#meaningful-documentation The method documents its accepted input or intentional error.
   */
  public internal(): void {
    throw new InternalServerErrorException("Intended internal server error.");
  }
  @core.TypedRoute.Get("health")
  /**
   * Observes recovery outside the local filters.
   *
   * @evidence contracts/common.md#principled-implementation A literal successful response proves a prior rejection did not poison the shared app.
   * @evidence contracts/common.md#clear-and-simple-design One stateless health result is independent of exception registry state.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts This method installs no filter and changes no error priority.
   * @evidence contracts/common.md#meaningful-documentation The literal identifies the recovery control.
   */
  public health(): { healthy: true } {
    return { healthy: true };
  }
}
