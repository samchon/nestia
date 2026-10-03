import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from "@nestjs/common";

@Catch(HttpException)
export class RichHttpExceptionFilter implements ExceptionFilter {
  public static MESSAGE = "Customized error message.";

  catch(exception: HttpException, host: ArgumentsHost) {
    const http = host.switchToHttp();
    http
      .getResponse()
      .status(exception.getStatus())
      .json(RichHttpExceptionFilter.MESSAGE);
  }
}
