import { SocketKeywordCalculatorControllerBase } from "./SocketKeywordCalculatorControllerBase";

export class SocketKeywordCalculatorController extends SocketKeywordCalculatorControllerBase(
  "http_rich/options/socket_calculator/keyword/calculate",
) {}
