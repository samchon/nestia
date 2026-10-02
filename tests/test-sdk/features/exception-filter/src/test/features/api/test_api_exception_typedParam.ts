import api from "@api";

import { validate_exception_filter } from "../../internal/validate_exception_filter";

export const test_api_exception_typedParam = validate_exception_filter(400)(
  (connection) => api.functional.exception.typedParam(connection, "abcd"),
);
