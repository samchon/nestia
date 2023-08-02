import { Controller, Head } from "@nestjs/common";

import core from "@nestia/core";

import { IBbsArticle } from "../../api/structures/IBbsArticle";

@Controller("method")
export class MethodController {
    @Head("body")
    public body(@core.TypedBody() input: IBbsArticle.IStore): void {
        input;
    }
}
