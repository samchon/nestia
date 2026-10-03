import {
  TypedBody,
  TypedException,
  TypedParam,
  TypedRoute,
} from "@nestia/core";
import { BadRequestException, Controller } from "@nestjs/common";
import typia, { TypeGuardError } from "typia";

import { ExceptionIBbsArticle } from "../../structures/exception/ExceptionIBbsArticle";
import { ExceptionIExceptional } from "../../structures/exception/ExceptionIExceptional";
import { ExceptionIInternalServerError } from "../../structures/exception/ExceptionIInternalServerError";
import { ExceptionINotFound } from "../../structures/exception/ExceptionINotFound";
import { ExceptionIUnprocessibleEntity } from "../../structures/exception/ExceptionIUnprocessibleEntity";

@Controller("http_rich/exception")
export class RichExceptionController {
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
  @TypedException<ExceptionINotFound>(404, "unable to find the matched section")
  @TypedException<ExceptionIUnprocessibleEntity>(428)
  @TypedException<ExceptionIInternalServerError>("5XX", "internal server error")
  public async typed(
    @TypedParam("section") section: string,
    @TypedBody() input: ExceptionIBbsArticle.IStore,
  ): Promise<ExceptionIBbsArticle> {
    section;
    input;
    return typia.random<ExceptionIBbsArticle>();
  }

  @TypedRoute.Get(":section/union")
  @TypedException<
    | ExceptionIExceptional.Something
    | ExceptionIExceptional.Nothing
    | ExceptionIExceptional.Everything
  >(428, "unable to process the request")
  public async union(
    @TypedParam("section") section: string,
  ): Promise<
    ExceptionIBbsArticle | ExceptionINotFound | ExceptionIUnprocessibleEntity
  > {
    section;
    return typia.random<
      ExceptionIBbsArticle | ExceptionINotFound | ExceptionIUnprocessibleEntity
    >();
  }

  @TypedRoute.Get("nestjs-bad-request")
  @TypedException<BadRequestException>({
    status: 400,
    description: "invalid parameter provided",
  })
  public async nestjs_bad_request(): Promise<string> {
    return "ok";
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
    @TypedBody() input: ExceptionIBbsArticle.IStore,
  ): Promise<ExceptionIBbsArticle> {
    section;
    input;
    return typia.random<ExceptionIBbsArticle>();
  }

  /**
   * @throws 400 invalid request
   * @throws 404 unable to find the matched section
   * @throw 428 unable to process the request
   * @throw 5XX internal server error
   */
  @TypedRoute.Post(":section/composite")
  @TypedException<TypeGuardError>(400, "invalid request")
  @TypedException<ExceptionINotFound>(404)
  @TypedException<ExceptionIUnprocessibleEntity>(428)
  @TypedException<ExceptionIInternalServerError>("5XX")
  public async composite(
    @TypedParam("section") section: string,
    @TypedBody() input: ExceptionIBbsArticle.IStore,
  ): Promise<ExceptionIBbsArticle> {
    section;
    input;
    return typia.random<ExceptionIBbsArticle>();
  }
}
