import typia from "typia";

import api from "../../../../api";
import { IDateDefined } from "../../../../features/date/api/structures/IDateDefined";

export const test_api_date = async (
  connection: api.IConnection,
): Promise<void> => {
  const date: typia.Primitive<IDateDefined> =
    await api.functional.date.date.get(connection);
  typia.assertEquals(date);
};
