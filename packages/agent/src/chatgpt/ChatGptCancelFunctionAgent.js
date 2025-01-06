"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatGptCancelFunctionAgent = void 0;
const __typia_transform__validateReport = __importStar(require("typia/lib/internal/_validateReport.js"));
const typia_1 = __importDefault(require("typia"));
const uuid_1 = require("uuid");
const NestiaChatAgentConstant_1 = require("../internal/NestiaChatAgentConstant");
const ChatGptHistoryDecoder_1 = require("./ChatGptHistoryDecoder");
var ChatGptCancelFunctionAgent;
(function (ChatGptCancelFunctionAgent) {
    ChatGptCancelFunctionAgent.execute = (props) => __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        if (props.divide === undefined)
            return step(props, props.application.functions, 0);
        const stacks = props.divide.map(() => []);
        const events = [];
        const prompts = yield Promise.all(props.divide.map((candidates, i) => step(Object.assign(Object.assign({}, props), { stack: stacks[i], dispatch: (e) => __awaiter(this, void 0, void 0, function* () {
                events.push(e);
            }) }), candidates, 0)));
        // NO FUNCTION SELECTION, SO THAT ONLY TEXT LEFT
        if (stacks.every((s) => s.length === 0))
            return prompts[0];
        // ELITICISM
        else if (((_b = (_a = props.config) === null || _a === void 0 ? void 0 : _a.eliticism) !== null && _b !== void 0 ? _b : NestiaChatAgentConstant_1.NestiaChatAgentConstant.ELITICISM) === true)
            return step(props, stacks
                .map((row) => Array.from(row.values()).map((s) => s.function))
                .flat(), 0);
        // RE-COLLECT SELECT FUNCTION EVENTS
        const collection = {
            id: (0, uuid_1.v4)(),
            kind: "cancel",
            functions: [],
        };
        for (const e of events)
            if (e.type === "select") {
                collection.functions.push({
                    function: e.function,
                    reason: e.reason,
                });
                yield ChatGptCancelFunctionAgent.cancelFunction({
                    stack: props.stack,
                    dispatch: props.dispatch,
                    reference: {
                        name: e.function.name,
                        reason: e.reason,
                    },
                });
            }
        return [collection];
    });
    ChatGptCancelFunctionAgent.cancelFunction = (props) => __awaiter(this, void 0, void 0, function* () {
        const index = props.stack.findIndex((item) => item.function.name === props.reference.name);
        if (index === -1)
            return null;
        const item = props.stack[index];
        props.stack.splice(index, 1);
        yield props.dispatch({
            type: "cancel",
            function: item.function,
            reason: props.reference.reason,
        });
        return item.function;
    });
    const step = (props, candidates, retry, failures) => __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e, _f, _g;
        //----
        // EXECUTE CHATGPT API
        //----
        const completion = yield props.service.api.chat.completions.create({
            model: props.service.model,
            messages: [
                // CANDIDATE FUNCTIONS
                {
                    role: "assistant",
                    tool_calls: [
                        {
                            type: "function",
                            id: "getApiFunctions",
                            function: {
                                name: "getApiFunctions",
                                arguments: JSON.stringify({}),
                            },
                        },
                    ],
                },
                {
                    role: "tool",
                    tool_call_id: "getApiFunctions",
                    content: JSON.stringify(candidates.map((func) => ({
                        name: func.name,
                        description: func.description,
                    }))),
                },
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
                    content: (_d = (_c = (_b = (_a = props.config) === null || _a === void 0 ? void 0 : _a.systemPrompt) === null || _b === void 0 ? void 0 : _b.cancel) === null || _c === void 0 ? void 0 : _c.call(_b, props.histories)) !== null && _d !== void 0 ? _d : SYSTEM_PROMPT,
                },
                // TYPE CORRECTIONS
                ...emendMessages(failures !== null && failures !== void 0 ? failures : []),
            ],
            // STACK FUNCTIONS
            tools: CONTAINER.functions.map((func) => ({
                type: "function",
                function: {
                    name: func.name,
                    description: func.description,
                    parameters: func.parameters,
                },
            })),
            tool_choice: "auto",
            parallel_tool_calls: true,
        }, props.service.options);
        //----
        // VALIDATION
        //----
        if (retry++ < ((_f = (_e = props.config) === null || _e === void 0 ? void 0 : _e.retry) !== null && _f !== void 0 ? _f : NestiaChatAgentConstant_1.NestiaChatAgentConstant.RETRY)) {
            const failures = [];
            for (const choice of completion.choices)
                for (const tc of (_g = choice.message.tool_calls) !== null && _g !== void 0 ? _g : []) {
                    if (tc.function.name !== "cancelFunctions")
                        continue;
                    const input = JSON.parse(tc.function.arguments);
                    const validation = (() => { const _io0 = input => Array.isArray(input.functions) && input.functions.every(elem => "object" === typeof elem && null !== elem && _io1(elem)); const _io1 = input => "string" === typeof input.reason && "string" === typeof input.name; const _vo0 = (input, _path, _exceptionable = true) => [(Array.isArray(input.functions) || _report(_exceptionable, {
                            path: _path + ".functions",
                            expected: "Array<___IChatFunctionReference>",
                            value: input.functions
                        })) && input.functions.map((elem, _index2) => ("object" === typeof elem && null !== elem || _report(_exceptionable, {
                            path: _path + ".functions[" + _index2 + "]",
                            expected: "___IChatFunctionReference",
                            value: elem
                        })) && _vo1(elem, _path + ".functions[" + _index2 + "]", true && _exceptionable) || _report(_exceptionable, {
                            path: _path + ".functions[" + _index2 + "]",
                            expected: "___IChatFunctionReference",
                            value: elem
                        })).every(flag => flag) || _report(_exceptionable, {
                            path: _path + ".functions",
                            expected: "Array<___IChatFunctionReference>",
                            value: input.functions
                        })].every(flag => flag); const _vo1 = (input, _path, _exceptionable = true) => ["string" === typeof input.reason || _report(_exceptionable, {
                            path: _path + ".reason",
                            expected: "string",
                            value: input.reason
                        }), "string" === typeof input.name || _report(_exceptionable, {
                            path: _path + ".name",
                            expected: "string",
                            value: input.name
                        })].every(flag => flag); const __is = input => "object" === typeof input && null !== input && _io0(input); let errors; let _report; return input => {
                        if (false === __is(input)) {
                            errors = [];
                            _report = __typia_transform__validateReport._validateReport(errors);
                            ((input, _path, _exceptionable = true) => ("object" === typeof input && null !== input || _report(true, {
                                path: _path + "",
                                expected: "__IChatFunctionReference.IProps",
                                value: input
                            })) && _vo0(input, _path + "", true) || _report(true, {
                                path: _path + "",
                                expected: "__IChatFunctionReference.IProps",
                                value: input
                            }))(input, "$input", true);
                            const success = 0 === errors.length;
                            return success ? {
                                success,
                                data: input
                            } : {
                                success,
                                errors,
                                data: input
                            };
                        }
                        return {
                            success: true,
                            data: input
                        };
                    }; })()(input);
                    if (validation.success === false)
                        failures.push({
                            id: tc.id,
                            name: tc.function.name,
                            validation,
                        });
                }
            if (failures.length > 0)
                return step(props, candidates, retry, failures);
        }
        //----
        // PROCESS COMPLETION
        //----
        const prompts = [];
        for (const choice of completion.choices) {
            // TOOL CALLING HANDLER
            if (choice.message.tool_calls)
                for (const tc of choice.message.tool_calls) {
                    if (tc.type !== "function")
                        continue;
                    const input = JSON.parse(tc.function.arguments);
                    if ((() => { const _io0 = input => Array.isArray(input.functions) && input.functions.every(elem => "object" === typeof elem && null !== elem && _io1(elem)); const _io1 = input => "string" === typeof input.reason && "string" === typeof input.name; return input => "object" === typeof input && null !== input && _io0(input); })()(input) === false)
                        continue;
                    else if (tc.function.name === "cancelFunctions") {
                        const collection = {
                            id: tc.id,
                            kind: "cancel",
                            functions: [],
                        };
                        for (const reference of input.functions) {
                            const func = yield ChatGptCancelFunctionAgent.cancelFunction({
                                stack: props.stack,
                                dispatch: props.dispatch,
                                reference,
                            });
                            if (func !== null)
                                collection.functions.push({
                                    function: func,
                                    reason: reference.reason,
                                });
                        }
                        if (collection.functions.length !== 0)
                            prompts.push(collection);
                    }
                }
        }
        return prompts;
    });
    const emendMessages = (failures) => failures
        .map((f) => [
        {
            role: "assistant",
            tool_calls: [
                {
                    type: "function",
                    id: f.id,
                    function: {
                        name: f.name,
                        arguments: JSON.stringify(f.validation.data),
                    },
                },
            ],
        },
        {
            role: "tool",
            content: JSON.stringify(f.validation.errors),
            tool_call_id: f.id,
        },
        {
            role: "system",
            content: [
                "You A.I. assistant has composed wrong typed arguments.",
                "",
                "Correct it at the next function calling.",
            ].join("\n"),
        },
    ])
        .flat();
})(ChatGptCancelFunctionAgent || (exports.ChatGptCancelFunctionAgent = ChatGptCancelFunctionAgent = {}));
const CONTAINER = {
    model: "chatgpt",
    options: {
        reference: false,
        strict: false,
        separate: null
    },
    functions: [
        {
            name: "cancelFunctions",
            parameters: {
                type: "object",
                properties: {
                    functions: {
                        title: "List of target functions",
                        description: "List of target functions.",
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                reason: {
                                    title: "The reason of the function selection",
                                    description: "The reason of the function selection.\n\nJust write the reason why you've determined to select this function.",
                                    type: "string"
                                },
                                name: {
                                    title: "Name of the target function to call",
                                    description: "Name of the target function to call.",
                                    type: "string"
                                }
                            },
                            required: [
                                "reason",
                                "name"
                            ]
                        }
                    }
                },
                required: [
                    "functions"
                ],
                additionalProperties: false,
                $defs: {}
            },
            description: "Cancel a function from the candidate list to call.\n\nIf you A.I. agent has understood that the user wants to cancel\nsome candidate functions to call from the conversation, please cancel\nthem through this function.\n\nAlso, when you A.I. find a function that has been selected by the candidate\npooling, cancel the function by calling this function. For reference, the\ncandidate pooling means that user wants only one function to call, but you A.I.\nagent selects multiple candidate functions because the A.I. agent can't specify\nonly one thing due to lack of specificity or homogeneity of candidate functions.\n\nAdditionally, if you A.I. agent wants to cancel same function multiply, you can\ndo it by assigning the same function name multiply in the `functions` property."
        }
    ]
};
const SYSTEM_PROMPT = [
    "You are a helpful assistant for selecting functions to call.",
    "",
    "Use the supplied tools to select some functions of `getApiFunctions()` returned",
    "",
    "If you can't find any proper function to select, just type your own message.",
].join("\n");
