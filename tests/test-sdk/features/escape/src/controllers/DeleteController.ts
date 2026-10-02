import { Controller, Delete } from "@nestjs/common";

@Controller("delete")
export class DeleteController {
  @Delete("erase")
  public async erase(): Promise<void> {}
}
