import {
  TypedBody,
  TypedException,
  TypedParam,
  TypedRoute,
} from "@nestia/core";
import { Controller } from "@nestjs/common";
import typia, { TypeGuardError } from "typia";

import { IBbsArticle } from "@api/lib/structures/IBbsArticle";
import { IExceptional } from "@api/lib/structures/IExceptional";
import { IInternalServerError } from "@api/lib/structures/IInternalServerError";
import { INotFound } from "@api/lib/structures/INotFound";
import { IUnprocessibleEntity } from "@api/lib/structures/IUnprocessibleEntity";

@Controller("exception")
export class ExceptionController {
  @TypedRoute.Post(":section/typed")
  @TypedException<TypeGuardError>({
    status: 400,
    description: "invalid request",
    example: {
      name: "BadRequestException",
      method: "TypedBody",
      path: "$input.title",
      expected: "string",
      value: 123,
      message: "invalid type",
    },
    examples: {
      title: {
        summary: "title",
        description: "Wrong type of the title",
        value: {
          name: "BadRequestException",
          method: "TypedBody",
          path: "$input.title",
          expected: "string",
          value: 123,
          message: "invalid type",
        },
      },
      content: {
        summary: "content",
        description: "content of the article",
        value: {
          name: "BadRequestException",
          method: "TypedBody",
          path: "$input.title",
          expected: "string",
          value: 123,
          message: "invalid type",
        },
      },
    },
  })
  @TypedException<INotFound>(404, "unable to find the matched section")
  @TypedException<IUnprocessibleEntity>(428)
  @TypedException<IInternalServerError>("5XX", "internal server error")
  public async typed(
    @TypedParam("section") section: string,
    @TypedBody() input: IBbsArticle.IStore,
  ): Promise<IBbsArticle> {
    section;
    input;
    return typia.random<IBbsArticle>();
  }

  @TypedRoute.Get(":section/union")
  @TypedException<
    IExceptional.Something | IExceptional.Nothing | IExceptional.Everything
  >(428, "unable to process the request")
  public async union(
    @TypedParam("section") section: string,
  ): Promise<IBbsArticle | INotFound | IUnprocessibleEntity> {
    section;
    return typia.random<IBbsArticle | INotFound | IUnprocessibleEntity>();
  }

  /**
   * @throws 400 invalid request
   * @throws 404 unable to find the matched section
   * @throw 428 unable to process the request
   * @throw 5XX internal server error
   */
  @TypedRoute.Post(":section/tags")
  public async tags(
    @TypedParam("section") section: string,
    @TypedBody() input: IBbsArticle.IStore,
  ): Promise<IBbsArticle> {
    section;
    input;
    return typia.random<IBbsArticle>();
  }

  /**
   * @throws 400 invalid request
   * @throws 404 unable to find the matched section
   * @throw 428 unable to process the request
   * @throw 5XX internal server error
   */
  @TypedRoute.Post(":section/composite")
  @TypedException<TypeGuardError>(400, "invalid request")
  @TypedException<INotFound>(404)
  @TypedException<IUnprocessibleEntity>(428)
  @TypedException<IInternalServerError>("5XX")
  public async composite(
    @TypedParam("section") section: string,
    @TypedBody() input: IBbsArticle.IStore,
  ): Promise<IBbsArticle> {
    section;
    input;
    return typia.random<IBbsArticle>();
  }
}
