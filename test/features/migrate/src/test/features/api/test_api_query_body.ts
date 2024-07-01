import { MigrateFetcher } from "@nestia/fetcher/lib/MigrateFetcher";
import typia from "typia";

import { IQuery } from "@api/lib/structures/IQuery";

import { ITestProps } from "../../ITestProps";

export const test_api_query_body = async (props: ITestProps): Promise<void> => {
  const query: URLSearchParams = await MigrateFetcher.request({
    route: props.route("post", "/query/body"),
    connection: props.connection,
    arguments: [typia.random<IQuery>()],
  });
  typia.assert(query);
};
