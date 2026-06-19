import { HttpError } from "@nestia/fetcher";
import typia from "typia";

import api from "@api";

import { HttpExceptionFilter } from "../../filters/HttpExceptionFilter";

export const validate_exception_filter =
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
        exp.message.includes(HttpExceptionFilter.MESSAGE);
      if (!right) {
        if (typia.is<HttpError>(exp)) console.log(exp.status, exp.message);
        throw new Error("Failed to filter exception out.");
      }
    }
  };
