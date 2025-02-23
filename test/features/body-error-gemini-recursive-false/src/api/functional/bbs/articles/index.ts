/**
 * @packageDocumentation
 * @module api.functional.bbs.articles
 * @nestia Generated by Nestia - https://github.com/samchon/nestia
 */
//================================================================
import type { IConnection } from "@nestia/fetcher";
import { PlainFetcher } from "@nestia/fetcher/lib/PlainFetcher";
import type { Resolved } from "typia";
import type { Format } from "typia/lib/tags/Format";

import type { IBbsArticle } from "../../../structures/IBbsArticle";

/**
 * @controller BbsArticlesController.update
 * @path POST /bbs/articles/:id
 * @nestia Generated by Nestia - https://github.com/samchon/nestia
 */
export async function update(
  connection: IConnection,
  id: string & Format<"uuid">,
  input: update.Input,
): Promise<void> {
  return PlainFetcher.fetch(
    {
      ...connection,
      headers: {
        ...connection.headers,
        "Content-Type": "application/json",
      },
    },
    {
      ...update.METADATA,
      template: update.METADATA.path,
      path: update.path(id),
    },
    input,
  );
}
export namespace update {
  export type Input = Resolved<IBbsArticle.IUpdate>;

  export const METADATA = {
    method: "POST",
    path: "/bbs/articles/:id",
    request: {
      type: "application/json",
      encrypted: false,
    },
    response: {
      type: "application/json",
      encrypted: false,
    },
    status: 201,
  } as const;

  export const path = (id: string & Format<"uuid">) =>
    `/bbs/articles/${encodeURIComponent(id?.toString() ?? "null")}`;
}
