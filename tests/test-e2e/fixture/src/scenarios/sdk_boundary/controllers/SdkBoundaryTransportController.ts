import core from "@nestia/core";
import { Controller, Get, Head, Header, StreamableFile } from "@nestjs/common";
import type { tags } from "typia";

/**
 * Connects bodyless HEAD and binary response metadata to the shared host.
 *
 * @evidence contracts/common.md#principled-implementation Nest HEAD returns no payload after the public TypedParam decoder validates its UUID; the binary handler returns the authored four bytes through StreamableFile with image/png content type.
 * @evidence contracts/common.md#clear-and-simple-design Two stateless routes expose different transport shapes while reusing one controller prefix and the existing application.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The fixture configures supported decorators and StreamableFile instead of replacing fetch, validators or Nest internals. Fixed bytes are authored input for the binary response.
 * @evidence contracts/common.md#meaningful-documentation The method comments state the UUID/bodyless contract and the binary specimen; caller cases own stream reading and null-body fetch injection.
 */
@Controller("sdk_boundary/transport")
export class SdkBoundaryTransportController {
  @Head("head/:id")
  /**
   * Validates the UUID path parameter without producing a HEAD payload.
   *
   * @evidence contracts/common.md#principled-implementation TypedParam uses the authored string Format uuid contract; the void method intentionally returns no body, matching Nest HEAD semantics.
   * @evidence contracts/common.md#clear-and-simple-design The method consumes the decoded id without retaining request state or manufacturing a body.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Public parameter validation and Nest routing own acceptance and rejection; no local regular expression duplicates the UUID rule.
   * @evidence contracts/common.md#meaningful-documentation The comment identifies the accepted input and the empty response contract.
   */
  public head(@core.TypedParam("id") id: string & tags.Format<"uuid">): void {
    void id;
  }

  @Header("Content-Type", "image/png")
  @Get("image")
  /**
   * Serves four authored bytes as an image/png binary stream.
   *
   * @evidence contracts/common.md#principled-implementation StreamableFile wraps Buffer.from of the explicit byte sequence; the response content type tells the generator and fetcher to retain binary bytes rather than JSON decoding.
   * @evidence contracts/common.md#clear-and-simple-design One platform buffer and one supported Nest wrapper represent this fixed transport specimen.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The literal byte sequence is test input, not a production fixture discriminator or a replacement transport implementation.
   * @evidence contracts/common.md#meaningful-documentation The comment states the binary content type and the exact specimen; resource ownership of the HTTP response remains with Nest.
   */
  public image(): StreamableFile {
    return new StreamableFile(Buffer.from([1, 2, 3, 4]));
  }
}
