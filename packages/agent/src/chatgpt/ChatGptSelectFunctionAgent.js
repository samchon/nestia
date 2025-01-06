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
exports.ChatGptSelectFunctionAgent = void 0;
const __typia_transform__validateReport = __importStar(require("typia/lib/internal/_validateReport.js"));
const typia_1 = __importDefault(require("typia"));
const uuid_1 = require("uuid");
const NestiaChatAgentConstant_1 = require("../internal/NestiaChatAgentConstant");
const ChatGptHistoryDecoder_1 = require("./ChatGptHistoryDecoder");
var ChatGptSelectFunctionAgent;
(function (ChatGptSelectFunctionAgent) {
    ChatGptSelectFunctionAgent.execute = (props) => __awaiter(this, void 0, void 0, function* () {
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
            kind: "select",
            functions: [],
        };
        for (const e of events)
            if (e.type === "select") {
                collection.functions.push({
                    function: e.function,
                    reason: e.reason,
                });
                yield selectFunction({
                    application: props.application,
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
    const step = (props, candidates, retry, failures) => __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d;
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
                    content: SYSTEM_MESSAGE_OF_ROLE,
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
            parallel_tool_calls: false,
        }, props.service.options);
        if (props.completions !== undefined)
            props.completions.push(completion);
        //----
        // VALIDATION
        //----
        if (retry++ < ((_b = (_a = props.config) === null || _a === void 0 ? void 0 : _a.retry) !== null && _b !== void 0 ? _b : NestiaChatAgentConstant_1.NestiaChatAgentConstant.RETRY)) {
            const failures = [];
            for (const choice of completion.choices)
                for (const tc of (_c = choice.message.tool_calls) !== null && _c !== void 0 ? _c : []) {
                    if (tc.function.name !== "selectFunctions")
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
                    else if (tc.function.name === "selectFunctions") {
                        const collection = {
                            id: tc.id,
                            kind: "select",
                            functions: [],
                        };
                        for (const reference of input.functions) {
                            const func = yield selectFunction({
                                application: props.application,
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
            // ASSISTANT MESSAGE
            if (choice.message.role === "assistant" &&
                !!((_d = choice.message.content) === null || _d === void 0 ? void 0 : _d.length))
                prompts.push({
                    kind: "text",
                    role: "assistant",
                    text: choice.message.content,
                });
        }
        return prompts;
    });
    const selectFunction = (props) => __awaiter(this, void 0, void 0, function* () {
        const func = props.application.functions.find((func) => func.name === props.reference.name);
        if (func === undefined)
            return null;
        props.stack.push({
            function: func,
            reason: props.reference.reason,
        });
        yield props.dispatch({
            type: "select",
            function: func,
            reason: props.reference.reason,
        });
        return func;
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
})(ChatGptSelectFunctionAgent || (exports.ChatGptSelectFunctionAgent = ChatGptSelectFunctionAgent = {}));
const CONTAINER = {
    model: "chatgpt",
    options: {
        reference: false,
        strict: false,
        separate: null
    },
    functions: [
        {
            name: "selectFunctions",
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
            description: "Select proper API functions to call.\n\nIf you A.I. agent has found some proper API functions to call\nfrom the conversation with user, please select the API functions\njust by calling this function.\n\nWhen user wants to call a same function multiply, you A.I. agent must\nlist up it multiply in the `functions` property. Otherwise the user has\nrequested to call many different functions, you A.I. agent have to assign\nthem all into the `functions` property.\n\nAlso, if you A.I. agent can't speciify a specific function to call due to lack\nof specificity or homogeneity of candidate functions, just assign all of them\nby in the` functions` property` too. Instead, when you A.I. agent can specify\na specific function to call, the others would be eliminated."
        }
    ]
};
const SYSTEM_MESSAGE_OF_ROLE = [
    "You are a helpful assistant for selecting functions to call.",
    "",
    "Use the supplied tools to select some functions of `getApiFunctions()` returned",
    "",
    "If you can't find any proper function to select, just type your own message.",
].join("\n");
