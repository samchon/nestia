import { MigrateFetcher } from "@nestia/fetcher/lib/MigrateFetcher";
import typia from "typia";

import { INestQuery } from "@api/lib/structures/INestQuery";
import { IQuery } from "@api/lib/structures/IQuery";

import { ITestProps } from "../../ITestProps";

export const test_api_query_nest = async (props: ITestProps): Promise<void> => {
  const query: IQuery = await MigrateFetcher.request({
    route: props.route("get", "/query/nest"),
    connection: props.connection,
    arguments: [typia.random<INestQuery>()],
  });
  typia.assert(query);
};
