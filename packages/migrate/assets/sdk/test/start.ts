import api from "@ORGANIZATION/PROJECT-api";
import { IBbsArticleComment } from "@ORGANIZATION/PROJECT-api/lib/structures/bbs/IBbsArticleComment";
import typia from "typia";
import type { Format } from "typia/lib/tags/Format";

import { TestGlobal } from "./TestGlobal";

const main = async () => {
  const connection: api.IConnection = {
    ...TestGlobal.connection(),
    simulate: true,
  };
  const output: IBbsArticleComment =
    await api.functional.bbs.articles.comments.create(
      connection,
      typia.random<string & Format<"uuid">>(),
      typia.random<IBbsArticleComment.ICreate>(),
    );
  typia.assert(output);
};
main().catch((exp) => {
  console.log(exp);
  process.exit(-1);
});
