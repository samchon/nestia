/** Original permission filter input preserves the thrown literal on the wire. */
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from "@nestjs/common";
import { HttpAdapterHost } from "@nestjs/core";

@Catch(HttpException)
export class SdkBoundaryPermissionFilter implements ExceptionFilter {
  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: HttpException, host: ArgumentsHost) {
    const { httpAdapter } = this.httpAdapterHost;
    const http = host.switchToHttp();
    httpAdapter.reply(
      http.getResponse(),
      exception.message,
      exception.getStatus(),
    );
  }
}
