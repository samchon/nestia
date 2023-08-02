import { Controller, Head, Header, Options } from "@nestjs/common";

@Controller("method")
export class MethodController {
    @Header("something", "interseting")
    @Head("head")
    public head(): void {}

    @Options("options")
    public options(): void {}
}
