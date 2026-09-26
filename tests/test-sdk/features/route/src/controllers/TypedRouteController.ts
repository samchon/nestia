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

import { IBbsArticle } from "@api/lib/structures/IBbsArticle";

const createArticle = (): IBbsArticle => ({
  id: "00000000-0000-4000-8000-000000000000" as IBbsArticle["id"],
  title: "Observable route article" as IBbsArticle["title"],
  body: "Observable routes should expose their payload type to generated SDKs.",
  files: [],
  created_at: "2026-06-11T00:00:00.000Z" as IBbsArticle["created_at"],
});

class SerializedCacheHitInterceptor implements NestInterceptor {
  public intercept(
    _context: ExecutionContext,
    _next: CallHandler,
  ): Observable<string> {
    return of(JSON.stringify(createArticle()));
  }
}

@Controller("route")
export class TypedRouteController {
  @core.TypedRoute.Get("random")
  public async random(): Promise<IBbsArticle> {
    return {
      ...typia.random<IBbsArticle>(),
      ...{
        dummy: 1,
      },
    };
  }

  @core.TypedRoute.Get("observable")
  public observable(): Observable<IBbsArticle> {
    return of(createArticle());
  }

  @core.TypedRoute.Get("cached")
  @UseInterceptors(new SerializedCacheHitInterceptor())
  public cached(): IBbsArticle {
    return createArticle();
  }
}
