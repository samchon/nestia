import api from "@api";

import { validate_exception_filter } from "../../internal/validate_exception_filter";

export const test_api_exception_typedManual = validate_exception_filter(422)(
  (connection) => api.functional.exception.typedManual(connection),
);
