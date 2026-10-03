import { Controller, Delete } from "@nestjs/common";

@Controller("http_rich/escape/delete")
export class EscapeDeleteController {
  @Delete("erase")
  public async erase(): Promise<void> {}
}
