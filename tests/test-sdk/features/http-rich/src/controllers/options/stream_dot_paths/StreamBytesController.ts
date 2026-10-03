import { Controller, Get, Header, StreamableFile } from "@nestjs/common";

@Controller("http_rich/options/stream_dot_paths/stream")
export class StreamBytesController {
  @Header("Content-Type", "image/png")
  @Get("image")
  public image(): StreamableFile {
    return new StreamableFile(Buffer.from([1, 2, 3, 4]));
  }
}
