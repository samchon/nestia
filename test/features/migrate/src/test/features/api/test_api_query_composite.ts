import { MigrateFetcher } from "@nestia/fetcher/lib/MigrateFetcher";
import typia from "typia";

import { IQuery } from "@api/lib/structures/IQuery";

import { ITestProps } from "../../ITestProps";

export const test_api_query_nest = async (props: ITestProps): Promise<void> => {
  const query: IQuery = await MigrateFetcher.request({
    route: props.route("get", "/query/composite"),
    connection: props.connection,
    arguments: [typia.random<IQuery>()],
  });
  typia.assert(query);
};
