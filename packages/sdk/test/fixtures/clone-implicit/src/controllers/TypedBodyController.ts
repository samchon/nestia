import core from "@nestia/core";
import { Controller, Request } from "@nestjs/common";
import { tags } from "typia";
import { v4 } from "uuid";

@Controller("body")
export class TypedBodyControlleer {
  /**
   * Store an article.
   *
   * @author Samchon
   * @param request Request object from express. Must be disappeared in SDK
   * @param input Content to store
   * @returns Newly archived article
   * @warning This is an fake API
   */
  @core.TypedRoute.Post()
  public async store(
    @Request() request: any,
    @core.TypedBody()
    input: {
      title: string;
      body: string;
    },
  ) {
    request;
    return {
      ...input,
      id: v4(),
    };
  }

  @core.TypedRoute.Put(":id")
  public async update(
    @core.TypedParam("id") id: string & tags.Format<"uuid">,
    @core.TypedBody()
    input: {
      title: string;
      body: string;
    },
  ) {
    id;
    input;
  }
}
