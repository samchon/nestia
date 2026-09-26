import typia, { IValidation } from "typia";

import api from "@api";

export const test_api_param_error_message = async (
  connection: api.IConnection,
): Promise<void> => {
  try {
    await api.functional.param.number(connection, "two" as any);
  } catch (exp) {
    const message: string = (exp as Error).message;
    typia.assertEquals<
      {
        message: string;
        reason: string;
      } & IValidation.IError
    >(JSON.parse(message));
  }
};
