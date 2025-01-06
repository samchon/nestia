"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatGptDescribeFunctionAgent = void 0;
const ChatGptHistoryDecoder_1 = require("./ChatGptHistoryDecoder");
var ChatGptDescribeFunctionAgent;
(function (ChatGptDescribeFunctionAgent) {
    ChatGptDescribeFunctionAgent.execute = (props) => __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d;
        if (props.histories.length === 0)
            return [];
        const completion = yield props.service.api.chat.completions.create({
            model: props.service.model,
            messages: [
                // PREVIOUS FUNCTION CALLING HISTORIES
                ...props.histories.map(ChatGptHistoryDecoder_1.ChatGptHistoryDecoder.decode).flat(),
                // SYTEM PROMPT
                {
                    role: "assistant",
                    content: (_d = (_c = (_b = (_a = props.config) === null || _a === void 0 ? void 0 : _a.systemPrompt) === null || _b === void 0 ? void 0 : _b.describe) === null || _c === void 0 ? void 0 : _c.call(_b, props.histories)) !== null && _d !== void 0 ? _d : SYSTEM_PROMPT,
                },
            ],
        }, props.service.options);
        return completion.choices
            .map((choice) => {
            var _a;
            return choice.message.role === "assistant" && !!((_a = choice.message.content) === null || _a === void 0 ? void 0 : _a.length)
                ? choice.message.content
                : null;
        })
            .filter((str) => str !== null)
            .map((content) => ({
            kind: "describe",
            executions: props.histories,
            text: content,
        }));
    });
})(ChatGptDescribeFunctionAgent || (exports.ChatGptDescribeFunctionAgent = ChatGptDescribeFunctionAgent = {}));
const SYSTEM_PROMPT = [
    "You are a helpful assistant describing return values of function calls.",
    "",
    "Above messages are the list of function call histories.",
    "When decribing the return values, please do not too much shortly",
    "summarize them. Instead, provide detailed descriptions as much as.",
    "",
    "Also, its content format must be markdown. If required, utilize the",
    "mermaid syntax for drawing some diagrams. When image contents are,",
    "just put them through the markdown image syntax.",
].join("\n");
