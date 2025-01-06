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
exports.ChatGptExecuteFunctionAgent = void 0;
const openapi_1 = require("@samchon/openapi");
const NestiaChatAgentConstant_1 = require("../internal/NestiaChatAgentConstant");
const ChatGptHistoryDecoder_1 = require("./ChatGptHistoryDecoder");
var ChatGptExecuteFunctionAgent;
(function (ChatGptExecuteFunctionAgent) {
    ChatGptExecuteFunctionAgent.execute = (props) => __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e, _f;
        //----
        // EXECUTE CHATGPT API
        //----
        const completion = yield props.service.api.chat.completions.create({
            model: props.service.model,
            messages: [
                // PREVIOUS HISTORIES
                ...props.histories.map(ChatGptHistoryDecoder_1.ChatGptHistoryDecoder.decode).flat(),
                // USER INPUT
                {
                    role: "user",
                    content: props.content,
                },
                // SYTEM PROMPT
                {
                    role: "system",
                    content: (_d = (_c = (_b = (_a = props.config) === null || _a === void 0 ? void 0 : _a.systemPrompt) === null || _b === void 0 ? void 0 : _b.execute) === null || _c === void 0 ? void 0 : _c.call(_b, props.histories)) !== null && _d !== void 0 ? _d : SYSTEM_PROMPT,
                },
            ],
            // STACKED FUNCTIONS
            tools: props.functions.map((func) => ({
                type: "function",
                function: {
                    name: func.name,
                    description: func.description,
                    parameters: func.parameters,
                },
            })),
            tool_choice: "auto",
            parallel_tool_calls: false,
        }, props.service.options);
        //----
        // PROCESS COMPLETION
        //----
        const closures = [];
        for (const choice of completion.choices) {
            for (const tc of (_e = choice.message.tool_calls) !== null && _e !== void 0 ? _e : []) {
                if (tc.type === "function") {
                    const func = props.functions.find((func) => func.name === tc.function.name);
                    if (func === undefined)
                        continue;
                    closures.push(() => propagate(props, {
                        id: tc.id,
                        function: func,
                        input: JSON.parse(tc.function.arguments),
                    }, 0));
                }
            }
            if (choice.message.role === "assistant" &&
                !!((_f = choice.message.content) === null || _f === void 0 ? void 0 : _f.length))
                closures.push(() => __awaiter(this, void 0, void 0, function* () {
                    return ({
                        kind: "text",
                        role: "assistant",
                        text: choice.message.content,
                    });
                }));
        }
        return Promise.all(closures.map((fn) => fn()));
    });
    const propagate = (props, call, retry) => __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c;
        try {
            yield props.dispatch({
                type: "call",
                function: call.function,
                arguments: call.input,
            });
            const response = yield openapi_1.HttpLlm.propagate({
                connection: props.connection,
                application: props.application,
                function: call.function,
                input: call.input,
            });
            const success = ((response.status === 400 ||
                response.status === 404 ||
                response.status === 422) &&
                retry++ < ((_b = (_a = props.config) === null || _a === void 0 ? void 0 : _a.retry) !== null && _b !== void 0 ? _b : NestiaChatAgentConstant_1.NestiaChatAgentConstant.RETRY) &&
                typeof response.body) === false;
            const result = (_c = (success === false
                ? yield correct(props, call, retry, response.body)
                : null)) !== null && _c !== void 0 ? _c : {
                kind: "execute",
                role: "assistant",
                function: call.function,
                id: call.id,
                arguments: call.input,
                response: response,
            };
            if (success === true)
                yield props.dispatch({
                    type: "complete",
                    function: call.function,
                    arguments: result.arguments,
                    response: result.response,
                });
            return result;
        }
        catch (error) {
            return {
                kind: "execute",
                role: "assistant",
                function: call.function,
                id: call.id,
                arguments: call.input,
                response: {
                    status: 500,
                    headers: {},
                    body: error instanceof Error
                        ? Object.assign(Object.assign({}, error), { name: error.name, message: error.message }) : error,
                },
            };
        }
    });
    const correct = (props, call, retry, error) => __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        //----
        // EXECUTE CHATGPT API
        //----
        const completion = yield props.service.api.chat.completions.create({
            model: props.service.model,
            messages: [
                // PREVIOUS HISTORIES
                ...props.histories.map(ChatGptHistoryDecoder_1.ChatGptHistoryDecoder.decode).flat(),
                // USER INPUT
                {
                    role: "user",
                    content: props.content,
                },
                // TYPE CORRECTION
                {
                    role: "system",
                    content: (_d = (_c = (_b = (_a = props.config) === null || _a === void 0 ? void 0 : _a.systemPrompt) === null || _b === void 0 ? void 0 : _b.execute) === null || _c === void 0 ? void 0 : _c.call(_b, props.histories)) !== null && _d !== void 0 ? _d : SYSTEM_PROMPT,
                },
                {
                    role: "assistant",
                    tool_calls: [
                        {
                            type: "function",
                            id: call.id,
                            function: {
                                name: call.function.name,
                                arguments: JSON.stringify(call.input),
                            },
                        },
                    ],
                },
                {
                    role: "tool",
                    content: typeof error === "string" ? error : JSON.stringify(error),
                    tool_call_id: call.id,
                },
                {
                    role: "system",
                    content: [
                        "You A.I. assistant has composed wrong arguments.",
                        "",
                        "Correct it at the next function calling.",
                    ].join("\n"),
                },
            ],
            // STACK FUNCTIONS
            tools: [
                {
                    type: "function",
                    function: {
                        name: call.function.name,
                        description: call.function.description,
                        parameters: (call.function.separated
                            ? ((_f = (_e = call.function.separated) === null || _e === void 0 ? void 0 : _e.llm) !== null && _f !== void 0 ? _f : {
                                $defs: {},
                                type: "object",
                                properties: {},
                                additionalProperties: false,
                                required: [],
                            })
                            : call.function.parameters),
                    },
                },
            ],
            tool_choice: "auto",
            parallel_tool_calls: false,
        }, props.service.options);
        //----
        // PROCESS COMPLETION
        //----
        const toolCall = ((_h = (_g = completion.choices[0]) === null || _g === void 0 ? void 0 : _g.message.tool_calls) !== null && _h !== void 0 ? _h : []).find((tc) => tc.type === "function" && tc.function.name === call.function.name);
        if (toolCall === undefined)
            return null;
        return propagate(props, {
            id: toolCall.id,
            function: call.function,
            input: JSON.parse(toolCall.function.arguments),
        }, retry);
    });
})(ChatGptExecuteFunctionAgent || (exports.ChatGptExecuteFunctionAgent = ChatGptExecuteFunctionAgent = {}));
const SYSTEM_PROMPT = [
    "You are a helpful assistant for tool calling.",
    "",
    "Use the supplied tools to assist the user.",
    "",
    "If previous messsages are not enough to compose the arguments,",
    "you can ask the user to write more information. By the way, when asking",
    "the user to write more informations, make the text concise and clear.",
].join("\n");
