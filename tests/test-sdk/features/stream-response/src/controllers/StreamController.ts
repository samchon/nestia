import { Controller, Get, Header, StreamableFile } from "@nestjs/common";

@Controller("stream")
export class StreamController {
  @Header("Content-Type", "image/png")
  @Get("image")
  public image(): StreamableFile {
    return new StreamableFile(Buffer.from([1, 2, 3, 4]));
  }
}
