import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from "@nestjs/common";

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  public static MESSAGE = "Customized error message.";

  catch(exception: HttpException, host: ArgumentsHost) {
    const http = host.switchToHttp();
    http
      .getResponse()
      .status(exception.getStatus())
      .json(HttpExceptionFilter.MESSAGE);
  }
}
