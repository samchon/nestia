import { MigrateFetcher } from "@nestia/fetcher/lib/MigrateFetcher";
import typia from "typia";

import { ITestProps } from "../../ITestProps";

export const test_api_query_individual = async (
  props: ITestProps,
): Promise<void> => {
  const id: string = await MigrateFetcher.request({
    route: props.route("get", "/query/individual"),
    connection: props.connection,
    arguments: [typia.random<{ id: string }>()],
  });
  typia.assert(id);
};
