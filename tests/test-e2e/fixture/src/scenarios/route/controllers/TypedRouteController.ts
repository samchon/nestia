import core from "@nestia/core";
import {
  CallHandler,
  Controller,
  ExecutionContext,
  NestInterceptor,
  UseInterceptors,
} from "@nestjs/common";
import { Observable, of } from "rxjs";
import typia from "typia";

import { IBbsArticleRoute } from "../structures/IBbsArticleRoute";

const createArticle = (): IBbsArticleRoute => ({
  id: "00000000-0000-4000-8000-000000000000" as IBbsArticleRoute["id"],
  title: "Observable route article" as IBbsArticleRoute["title"],
  body: "Observable routes should expose their payload type to generated SDKs.",
  files: [],
  created_at: "2026-06-11T00:00:00.000Z" as IBbsArticleRoute["created_at"],
});

class SerializedCacheHitInterceptor implements NestInterceptor {
  public intercept(
    _context: ExecutionContext,
    _next: CallHandler,
  ): Observable<string> {
    return of(JSON.stringify(createArticle()));
  }
}

@Controller("route/route")
export class TypedRouteController {
  @core.TypedRoute.Get("random")
  public async random(): Promise<IBbsArticleRoute> {
    return {
      ...typia.random<IBbsArticleRoute>(),
      ...{
        dummy: 1,
      },
    };
  }

  @core.TypedRoute.Get("observable")
  public observable(): Observable<IBbsArticleRoute> {
    return of(createArticle());
  }

  @core.TypedRoute.Get("cached")
  @UseInterceptors(new SerializedCacheHitInterceptor())
  public cached(): IBbsArticleRoute {
    return createArticle();
  }
}
