import {
  TypedFormData,
  TypedHeaders,
  TypedQuery,
  doNotThrowTransformError,
} from "@nestia/core";
import { Controller, Get, Post } from "@nestjs/common";
import Multer from "multer";

/** Observes the public missing-transform guard without reading private state. */
const requireActiveGuard = (): void => {
  try {
    TypedHeaders<Record<string, unknown>>();
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("no transform has been configured")
    )
      return;
    throw error;
  }
  throw new Error("The shared missing-transform guard was not active.");
};

/** Bounds public fallback permission to one synchronous composition callback. */
const withFallbackGuard = <T>(compose: () => T): T => {
  requireActiveGuard();
  doNotThrowTransformError(false);
  try {
    return compose();
  } finally {
    doNotThrowTransformError(true);
    requireActiveGuard();
  }
};

const failureControl = new Error("Authored guard callback failure");
let failureObserved = false;
try {
  withFallbackGuard(() => {
    throw failureControl;
  });
} catch (error) {
  if (error !== failureControl) throw error;
  failureObserved = true;
}
if (!failureObserved)
  throw new Error("The guard callback failure was swallowed.");
requireActiveGuard();

/**
 * Composes actual public fallback decorators without generated validators.
 *
 * Calls outside decorator positions retain the manual factory protocol. The
 * public missing-transform guard is restored before other controllers load.
 */
const composeFallbackDecorators = () => {
  return withFallbackGuard(() => {
    return {
      headers: TypedHeaders<Record<string, unknown>>(),
      query: TypedQuery<Record<string, unknown>>(),
      urlencoded: TypedQuery.Body<Record<string, unknown>>(),
      multipart: TypedFormData.Body(() => Multer()),
    };
  });
};

const fallback = composeFallbackDecorators();

/**
 * Connects manual core parameter decorators to the common HTTP adapter.
 *
 * @evidence contracts/common.md#principled-implementation Four public absent-validator factories select the actual fallback decoders. requireActiveGuard observes the documented missing-transform exception before composition; withFallbackGuard permits one synchronous callback and restores the active guard in finally. An authored callback failure verifies exception identity and restoration, and composeFallbackDecorators supplies the four real immutable parameter decorators.
 * @evidence contracts/common.md#clear-and-simple-design Private helpers separately own public guard observation, its bounded permission interval and the four-factory composition. Four stateless route methods expose decoded inputs while the common backend owns transports.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Only the package's public guard setter changes state and every guard verdict comes from an actual public factory. No framework method, foreign global, loader or surrogate decoder is substituted; manual composition is not claimed to exercise the disabled compiler option.
 * @evidence contracts/common.md#meaningful-documentation Private helper comments identify absent validators and synchronous success/failure restoration; each method documents the raw or grouped values it exposes. The owning class acknowledges these private decisions because private declarations cannot host standalone Evidence annotations.
 */
@Controller("core_boundary/fallback")
export class CoreBoundaryFallbackController {
  @Get("headers")
  /**
   * Exposes the unmodified header record's shape and submitted name.
   *
   * @evidence contracts/common.md#principled-implementation The actual decoded header record supplies both values. The fixed optional x-name shape names the submitted control field without introducing a validator; it remains representable by the common SDK generator.
   * @evidence contracts/common.md#clear-and-simple-design One projection excludes unrelated transport headers.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No authored expected value replaces the incoming header.
   * @evidence contracts/common.md#meaningful-documentation The comment identifies the observed raw-header contract.
   */
  public headers(@fallback.headers headers: { "x-name"?: string }): {
    isArray: boolean;
    name: string | undefined;
  } {
    return { isArray: Array.isArray(headers), name: headers["x-name"] };
  }

  @Get("query")
  /**
   * Returns grouped raw query fields, including repeated keys.
   *
   * @evidence contracts/common.md#principled-implementation The public fallback decorator supplies the returned record; the fixed title/tags specimen names the exact repeated-field control and permits SDK reflection without changing the absent-validator path.
   * @evidence contracts/common.md#clear-and-simple-design This method returns its stateless input directly.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No local query parsing duplicates the operation under test.
   * @evidence contracts/common.md#meaningful-documentation The comment identifies grouping as the observed behavior.
   */
  public query(@fallback.query query: { title: string; tags: string[] }): {
    title: string;
    tags: string[];
  } {
    return query;
  }

  @Post("urlencoded")
  /**
   * Returns the actual urlencoded fallback decoder's grouped body.
   *
   * @evidence contracts/common.md#principled-implementation The public body decorator supplies the returned record and media check. The finite title/tags specimen matches the authored transport inputs and is reflected by the common generator without adding validation.
   * @evidence contracts/common.md#clear-and-simple-design One stateless echo exposes decoder output.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No parser or transport response is replaced.
   * @evidence contracts/common.md#meaningful-documentation The comment identifies the urlencoded boundary.
   */
  public urlencoded(
    @fallback.urlencoded body: { title: string; tags: string[] },
  ): { title: string; tags: string[] } {
    return body;
  }

  @Post("multipart")
  /**
   * Exposes grouped multipart fields and the actual uploaded File content.
   *
   * @evidence contracts/common.md#principled-implementation Actual fallback FormData decoding supplies fields and File, whose public text operation reads submitted bytes. The fixed title/tags/file shape reflects those exact submitted fields without changing fallback decoding or native File observation.
   * @evidence contracts/common.md#clear-and-simple-design One projection excludes adapter-specific upload representations.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No file content or field value is manufactured by the fixture.
   * @evidence contracts/common.md#meaningful-documentation The comment identifies repeated fields and native File observation.
   */
  public async multipart(
    @fallback.multipart body: { title: string; tags: string[]; file: File },
  ): Promise<{
    title: string;
    tags: string[];
    file: { name: string; text: string } | null;
  }> {
    const file = body.file;
    return {
      title: body.title,
      tags: body.tags,
      file:
        file instanceof File
          ? { name: file.name, text: await file.text() }
          : null,
    };
  }
}
