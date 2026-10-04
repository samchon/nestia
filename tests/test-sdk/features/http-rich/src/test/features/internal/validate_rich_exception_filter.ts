import { HttpError } from "@nestia/fetcher";
import typia from "typia";

import api from "../../../api";
import { RichHttpExceptionFilter } from "../../../controllers/exception_filter/filters/HttpExceptionFilter";

/**
 * Requires the original error status and the authored filter message.
 *
 * The intentional post-success error makes a successful request fail this
 * negative oracle instead of being silently accepted by the catch branch.
 *
 * @evidence contracts/common.md#principled-implementation Actual awaited request failure must be a HttpError with both the independent requested status and the filter's handwritten message. A completed successful request deliberately fails this negative expectation.
 * @evidence contracts/common.md#clear-and-simple-design One curried helper accepts the status and request; the returned case owns one await and a conjunction of type, status and message checks, with diagnostic output only on mismatch.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The original request and exception are inspected without replacement, resolver hooks or retries. Type recognition uses the actual compiled typia predicate and expected status comes from the caller.
 * @evidence contracts/common.md#meaningful-documentation The comment explains the successful-request negative control; mismatch diagnostics retain the observed status/message and the original error assertion.
 */
export const validate_rich_exception_filter =
  (status: number) =>
  (task: (connection: api.IConnection) => Promise<unknown>) =>
  async (connection: api.IConnection): Promise<void> => {
    try {
      await task(connection);
      throw new Error("Failed to catch error.");
    } catch (exp) {
      const right: boolean =
        typia.is<HttpError>(exp) &&
        exp.status === status &&
        exp.message.includes(RichHttpExceptionFilter.MESSAGE);
      if (!right) {
        if (typia.is<HttpError>(exp)) console.log(exp.status, exp.message);
        throw new Error("Failed to filter exception out.");
      }
    }
  };
