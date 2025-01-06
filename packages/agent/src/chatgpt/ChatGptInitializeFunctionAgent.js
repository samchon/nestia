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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatGptInitializeFunctionAgent = void 0;
const typia_1 = __importDefault(require("typia"));
const ChatGptHistoryDecoder_1 = require("./ChatGptHistoryDecoder");
var ChatGptInitializeFunctionAgent;
(function (ChatGptInitializeFunctionAgent) {
    ChatGptInitializeFunctionAgent.execute = (props) => __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e;
        //----
        // EXECUTE CHATGPT API
        //----
        const completion = yield props.service.api.chat.completions.create({
            model: props.service.model,
            messages: [
                {
                    // SYTEM PROMPT
                    role: "system",
                    content: (_d = (_c = (_b = (_a = props.config) === null || _a === void 0 ? void 0 : _a.systemPrompt) === null || _b === void 0 ? void 0 : _b.initial) === null || _c === void 0 ? void 0 : _c.call(_b, props.histories)) !== null && _d !== void 0 ? _d : SYSTEM_PROMPT,
                },
                // PREVIOUS HISTORIES
                ...props.histories.map(ChatGptHistoryDecoder_1.ChatGptHistoryDecoder.decode).flat(),
                // USER INPUT
                {
                    role: "user",
                    content: props.content,
                },
            ],
            // GETTER FUNCTION
            tools: [
                {
                    type: "function",
                    function: {
                        name: FUNCTION.name,
                        description: FUNCTION.description,
                        parameters: FUNCTION.parameters,
                    },
                },
            ],
            tool_choice: "auto",
            parallel_tool_calls: false,
        }, props.service.options);
        //----
        // PROCESS COMPLETION
        //----
        const prompts = [];
        for (const choice of completion.choices) {
            if (choice.message.role === "assistant" &&
                !!((_e = choice.message.content) === null || _e === void 0 ? void 0 : _e.length))
                prompts.push({
                    kind: "text",
                    role: "assistant",
                    text: choice.message.content,
                });
        }
        return {
            mounted: completion.choices.some((c) => {
                var _a;
                return !!((_a = c.message.tool_calls) === null || _a === void 0 ? void 0 : _a.some((tc) => tc.type === "function" && tc.function.name === FUNCTION.name));
            }),
            prompts,
        };
    });
})(ChatGptInitializeFunctionAgent || (exports.ChatGptInitializeFunctionAgent = ChatGptInitializeFunctionAgent = {}));
const FUNCTION = {
    model: "chatgpt",
    options: {
        reference: false,
        strict: false,
        separate: null
    },
    functions: [
        {
            name: "getApiFunctions",
            parameters: {
                type: "object",
                properties: {},
                required: [],
                additionalProperties: false,
                $defs: {
                    RecordstringIChatGptSchema: {
                        description: "Construct a type with a set of properties K of type T",
                        type: "object",
                        properties: {},
                        required: [],
                        additionalProperties: {
                            $ref: "#/$defs/IChatGptSchema"
                        }
                    },
                    IChatGptSchema: {
                        title: "Type schema info of the ChatGPT",
                        description: "Type schema info of the ChatGPT.\n\n`IChatGptSchema` is a type schema info of the ChatGPT function calling.\n\n`IChatGptSchema` basically follows the JSON schema definition of the OpenAPI v3.1\nspeciifcation; {@link OpenApiV3_1.IJsonSchema}.\n\nHowever, the `IChatGptSchema` does not follow the entire specification of\nthe OpenAPI v3.1. It has own specific restrictions and definitions. Here is the\nlist of how `IChatGptSchema` is different with the OpenAPI v3.1 JSON schema.\n\n- Decompose mixed type: {@link OpenApiV3_1.IJsonSchema.IMixed}\n- Resolve nullable property: {@link OpenApiV3_1.IJsonSchema.__ISignificant.nullable}\n- Tuple type is banned: {@link OpenApiV3_1.IJsonSchema.ITuple.prefixItems}\n- Constant type is banned: {@link OpenApiV3_1.IJsonSchema.IConstant}\n- Merge {@link OpenApiV3_1.IJsonSchema.IOneOf} to {@link IChatGptSchema.IAnOf}\n- Merge {@link OpenApiV3_1.IJsonSchema.IAllOf} to {@link IChatGptSchema.IObject}\n- Merge {@link OpenApiV3_1.IJsonSchema.IRecursiveReference} to {@link IChatGptSchema.IReference}\n- When {@link IChatGptSchema.IConfig.strict} mode\n  - Every object properties must be required\n  - Do not allow {@link IChatGptSchema.IObject.additionalProperties}\n\nIf compare with the {@link OpenApi.IJsonSchema}, the emended JSON schema specification,\n\n- {@link IChatGptSchema.IAnyOf} instead of the {@link OpenApi.IJsonSchema.IOneOf}\n- {@link IChatGptSchema.IParameters.$defs} instead of the {@link OpenApi.IJsonSchema.IComponents.schemas}\n- {@link IChatGptSchema.IString.enum} instead of the {@link OpenApi.IJsonSchema.IConstant}\n- {@link IChatGptSchema.additionalProperties} is fixed to `false`\n- No tuple type {@link OpenApi.IJsonSchema.ITuple} support\n- When {@link IChatGptSchema.IConfig.strict} mode\n  - Every object properties must be required\n  - Do not allow {@link IChatGptSchema.IObject.additionalProperties}\n\nFor reference, if you've composed the `IChatGptSchema` type with the\n{@link IChatGptSchema.IConfig.reference} `false` option (default is `false`),\nonly the recursived named types would be archived into the\n{@link IChatGptSchema.IParameters.$defs}, and the others would be ecaped from the\n{@link IChatGptSchema.IReference} type.\n\nAlso, ChatGPT has banned below constraint properties. Instead, I'll will\nfill the {@link IChatGptSchema.__IAttribute.description} property with\nthe comment text like `\"@format uuid\"`.\n\n- {@link OpenApi.IJsonSchema.INumber.minimum}\n- {@link OpenApi.IJsonSchema.INumber.maximum}\n- {@link OpenApi.IJsonSchema.INumber.multipleOf}\n- {@link OpenApi.IJsonSchema.IString.minLength}\n- {@link OpenApi.IJsonSchema.IString.maxLength}\n- {@link OpenApi.IJsonSchema.IString.format}\n- {@link OpenApi.IJsonSchema.IString.pattern}\n- {@link OpenApi.IJsonSchema.IString.contentMediaType}\n- {@link OpenApi.IJsonSchema.IString.default}\n- {@link OpenApi.IJsonSchema.IArray.minItems}\n- {@link OpenApi.IJsonSchema.IArray.maxItems}\n- {@link OpenApi.IJsonSchema.IArray.unique}",
                        anyOf: [
                            {
                                $ref: "#/$defs/IChatGptSchema.IObject"
                            },
                            {
                                type: "object",
                                properties: {
                                    "enum": {
                                        title: "Enumeration values",
                                        description: "Enumeration values.",
                                        type: "array",
                                        items: {
                                            type: "boolean"
                                        }
                                    },
                                    type: {
                                        title: "Discriminator value of the type",
                                        type: "string",
                                        "enum": [
                                            "boolean"
                                        ]
                                    },
                                    title: {
                                        title: "Title of the schema",
                                        description: "Title of the schema.",
                                        type: "string"
                                    },
                                    description: {
                                        title: "Detailed description of the schema",
                                        description: "Detailed description of the schema.",
                                        type: "string"
                                    },
                                    deprecated: {
                                        title: "Whether the type is deprecated or not",
                                        description: "Whether the type is deprecated or not.",
                                        type: "boolean"
                                    },
                                    example: {
                                        title: "Example value",
                                        description: "Example value."
                                    },
                                    examples: {
                                        description: "Construct a type with a set of properties K of type T",
                                        type: "object",
                                        properties: {},
                                        required: [],
                                        additionalProperties: {}
                                    }
                                },
                                required: [
                                    "type"
                                ],
                                description: "Boolean type info.\n\n------------------------------\n\nDescription of the current {@link IChatGptSchema.IBoolean} type:\n\n> Boolean type info.\n\n------------------------------\n\nDescription of the parent {@link IChatGptSchema} type:\n\n> Type schema info of the ChatGPT.\n> \n> `IChatGptSchema` is a type schema info of the ChatGPT function calling.\n> \n> `IChatGptSchema` basically follows the JSON schema definition of the OpenAPI v3.1\n> speciifcation; {@link OpenApiV3_1.IJsonSchema}.\n> \n> However, the `IChatGptSchema` does not follow the entire specification of\n> the OpenAPI v3.1. It has own specific restrictions and definitions. Here is the\n> list of how `IChatGptSchema` is different with the OpenAPI v3.1 JSON schema.\n> \n> - Decompose mixed type: {@link OpenApiV3_1.IJsonSchema.IMixed}\n> - Resolve nullable property: {@link OpenApiV3_1.IJsonSchema.__ISignificant.nullable}\n> - Tuple type is banned: {@link OpenApiV3_1.IJsonSchema.ITuple.prefixItems}\n> - Constant type is banned: {@link OpenApiV3_1.IJsonSchema.IConstant}\n> - Merge {@link OpenApiV3_1.IJsonSchema.IOneOf} to {@link IChatGptSchema.IAnOf}\n> - Merge {@link OpenApiV3_1.IJsonSchema.IAllOf} to {@link IChatGptSchema.IObject}\n> - Merge {@link OpenApiV3_1.IJsonSchema.IRecursiveReference} to {@link IChatGptSchema.IReference}\n> - When {@link IChatGptSchema.IConfig.strict} mode\n>   - Every object properties must be required\n>   - Do not allow {@link IChatGptSchema.IObject.additionalProperties}\n> \n> If compare with the {@link OpenApi.IJsonSchema}, the emended JSON schema specification,\n> \n> - {@link IChatGptSchema.IAnyOf} instead of the {@link OpenApi.IJsonSchema.IOneOf}\n> - {@link IChatGptSchema.IParameters.$defs} instead of the {@link OpenApi.IJsonSchema.IComponents.schemas}\n> - {@link IChatGptSchema.IString.enum} instead of the {@link OpenApi.IJsonSchema.IConstant}\n> - {@link IChatGptSchema.additionalProperties} is fixed to `false`\n> - No tuple type {@link OpenApi.IJsonSchema.ITuple} support\n> - When {@link IChatGptSchema.IConfig.strict} mode\n>   - Every object properties must be required\n>   - Do not allow {@link IChatGptSchema.IObject.additionalProperties}\n> \n> For reference, if you've composed the `IChatGptSchema` type with the\n> {@link IChatGptSchema.IConfig.reference} `false` option (default is `false`),\n> only the recursived named types would be archived into the\n> {@link IChatGptSchema.IParameters.$defs}, and the others would be ecaped from the\n> {@link IChatGptSchema.IReference} type.\n> \n> Also, ChatGPT has banned below constraint properties. Instead, I'll will\n> fill the {@link IChatGptSchema.__IAttribute.description} property with\n> the comment text like `\"@format uuid\"`.\n> \n> - {@link OpenApi.IJsonSchema.INumber.minimum}\n> - {@link OpenApi.IJsonSchema.INumber.maximum}\n> - {@link OpenApi.IJsonSchema.INumber.multipleOf}\n> - {@link OpenApi.IJsonSchema.IString.minLength}\n> - {@link OpenApi.IJsonSchema.IString.maxLength}\n> - {@link OpenApi.IJsonSchema.IString.format}\n> - {@link OpenApi.IJsonSchema.IString.pattern}\n> - {@link OpenApi.IJsonSchema.IString.contentMediaType}\n> - {@link OpenApi.IJsonSchema.IString.default}\n> - {@link OpenApi.IJsonSchema.IArray.minItems}\n> - {@link OpenApi.IJsonSchema.IArray.maxItems}\n> - {@link OpenApi.IJsonSchema.IArray.unique}"
                            },
                            {
                                type: "object",
                                properties: {
                                    "enum": {
                                        title: "Enumeration values",
                                        description: "Enumeration values.",
                                        type: "array",
                                        items: {
                                            type: "number"
                                        }
                                    },
                                    type: {
                                        title: "Discriminator value of the type",
                                        type: "string",
                                        "enum": [
                                            "integer"
                                        ]
                                    },
                                    title: {
                                        title: "Title of the schema",
                                        description: "Title of the schema.",
                                        type: "string"
                                    },
                                    description: {
                                        title: "Detailed description of the schema",
                                        description: "Detailed description of the schema.",
                                        type: "string"
                                    },
                                    deprecated: {
                                        title: "Whether the type is deprecated or not",
                                        description: "Whether the type is deprecated or not.",
                                        type: "boolean"
                                    },
                                    example: {
                                        title: "Example value",
                                        description: "Example value."
                                    },
                                    examples: {
                                        description: "Construct a type with a set of properties K of type T",
                                        type: "object",
                                        properties: {},
                                        required: [],
                                        additionalProperties: {}
                                    }
                                },
                                required: [
                                    "type"
                                ],
                                description: "Integer type info.\n\n------------------------------\n\nDescription of the current {@link IChatGptSchema.IInteger} type:\n\n> Integer type info.\n\n------------------------------\n\nDescription of the parent {@link IChatGptSchema} type:\n\n> Type schema info of the ChatGPT.\n> \n> `IChatGptSchema` is a type schema info of the ChatGPT function calling.\n> \n> `IChatGptSchema` basically follows the JSON schema definition of the OpenAPI v3.1\n> speciifcation; {@link OpenApiV3_1.IJsonSchema}.\n> \n> However, the `IChatGptSchema` does not follow the entire specification of\n> the OpenAPI v3.1. It has own specific restrictions and definitions. Here is the\n> list of how `IChatGptSchema` is different with the OpenAPI v3.1 JSON schema.\n> \n> - Decompose mixed type: {@link OpenApiV3_1.IJsonSchema.IMixed}\n> - Resolve nullable property: {@link OpenApiV3_1.IJsonSchema.__ISignificant.nullable}\n> - Tuple type is banned: {@link OpenApiV3_1.IJsonSchema.ITuple.prefixItems}\n> - Constant type is banned: {@link OpenApiV3_1.IJsonSchema.IConstant}\n> - Merge {@link OpenApiV3_1.IJsonSchema.IOneOf} to {@link IChatGptSchema.IAnOf}\n> - Merge {@link OpenApiV3_1.IJsonSchema.IAllOf} to {@link IChatGptSchema.IObject}\n> - Merge {@link OpenApiV3_1.IJsonSchema.IRecursiveReference} to {@link IChatGptSchema.IReference}\n> - When {@link IChatGptSchema.IConfig.strict} mode\n>   - Every object properties must be required\n>   - Do not allow {@link IChatGptSchema.IObject.additionalProperties}\n> \n> If compare with the {@link OpenApi.IJsonSchema}, the emended JSON schema specification,\n> \n> - {@link IChatGptSchema.IAnyOf} instead of the {@link OpenApi.IJsonSchema.IOneOf}\n> - {@link IChatGptSchema.IParameters.$defs} instead of the {@link OpenApi.IJsonSchema.IComponents.schemas}\n> - {@link IChatGptSchema.IString.enum} instead of the {@link OpenApi.IJsonSchema.IConstant}\n> - {@link IChatGptSchema.additionalProperties} is fixed to `false`\n> - No tuple type {@link OpenApi.IJsonSchema.ITuple} support\n> - When {@link IChatGptSchema.IConfig.strict} mode\n>   - Every object properties must be required\n>   - Do not allow {@link IChatGptSchema.IObject.additionalProperties}\n> \n> For reference, if you've composed the `IChatGptSchema` type with the\n> {@link IChatGptSchema.IConfig.reference} `false` option (default is `false`),\n> only the recursived named types would be archived into the\n> {@link IChatGptSchema.IParameters.$defs}, and the others would be ecaped from the\n> {@link IChatGptSchema.IReference} type.\n> \n> Also, ChatGPT has banned below constraint properties. Instead, I'll will\n> fill the {@link IChatGptSchema.__IAttribute.description} property with\n> the comment text like `\"@format uuid\"`.\n> \n> - {@link OpenApi.IJsonSchema.INumber.minimum}\n> - {@link OpenApi.IJsonSchema.INumber.maximum}\n> - {@link OpenApi.IJsonSchema.INumber.multipleOf}\n> - {@link OpenApi.IJsonSchema.IString.minLength}\n> - {@link OpenApi.IJsonSchema.IString.maxLength}\n> - {@link OpenApi.IJsonSchema.IString.format}\n> - {@link OpenApi.IJsonSchema.IString.pattern}\n> - {@link OpenApi.IJsonSchema.IString.contentMediaType}\n> - {@link OpenApi.IJsonSchema.IString.default}\n> - {@link OpenApi.IJsonSchema.IArray.minItems}\n> - {@link OpenApi.IJsonSchema.IArray.maxItems}\n> - {@link OpenApi.IJsonSchema.IArray.unique}"
                            },
                            {
                                type: "object",
                                properties: {
                                    "enum": {
                                        title: "Enumeration values",
                                        description: "Enumeration values.",
                                        type: "array",
                                        items: {
                                            type: "number"
                                        }
                                    },
                                    type: {
                                        title: "Discriminator value of the type",
                                        type: "string",
                                        "enum": [
                                            "number"
                                        ]
                                    },
                                    title: {
                                        title: "Title of the schema",
                                        description: "Title of the schema.",
                                        type: "string"
                                    },
                                    description: {
                                        title: "Detailed description of the schema",
                                        description: "Detailed description of the schema.",
                                        type: "string"
                                    },
                                    deprecated: {
                                        title: "Whether the type is deprecated or not",
                                        description: "Whether the type is deprecated or not.",
                                        type: "boolean"
                                    },
                                    example: {
                                        title: "Example value",
                                        description: "Example value."
                                    },
                                    examples: {
                                        description: "Construct a type with a set of properties K of type T",
                                        type: "object",
                                        properties: {},
                                        required: [],
                                        additionalProperties: {}
                                    }
                                },
                                required: [
                                    "type"
                                ],
                                description: "Number (double) type info.\n\n------------------------------\n\nDescription of the current {@link IChatGptSchema.INumber} type:\n\n> Number (double) type info.\n\n------------------------------\n\nDescription of the parent {@link IChatGptSchema} type:\n\n> Type schema info of the ChatGPT.\n> \n> `IChatGptSchema` is a type schema info of the ChatGPT function calling.\n> \n> `IChatGptSchema` basically follows the JSON schema definition of the OpenAPI v3.1\n> speciifcation; {@link OpenApiV3_1.IJsonSchema}.\n> \n> However, the `IChatGptSchema` does not follow the entire specification of\n> the OpenAPI v3.1. It has own specific restrictions and definitions. Here is the\n> list of how `IChatGptSchema` is different with the OpenAPI v3.1 JSON schema.\n> \n> - Decompose mixed type: {@link OpenApiV3_1.IJsonSchema.IMixed}\n> - Resolve nullable property: {@link OpenApiV3_1.IJsonSchema.__ISignificant.nullable}\n> - Tuple type is banned: {@link OpenApiV3_1.IJsonSchema.ITuple.prefixItems}\n> - Constant type is banned: {@link OpenApiV3_1.IJsonSchema.IConstant}\n> - Merge {@link OpenApiV3_1.IJsonSchema.IOneOf} to {@link IChatGptSchema.IAnOf}\n> - Merge {@link OpenApiV3_1.IJsonSchema.IAllOf} to {@link IChatGptSchema.IObject}\n> - Merge {@link OpenApiV3_1.IJsonSchema.IRecursiveReference} to {@link IChatGptSchema.IReference}\n> - When {@link IChatGptSchema.IConfig.strict} mode\n>   - Every object properties must be required\n>   - Do not allow {@link IChatGptSchema.IObject.additionalProperties}\n> \n> If compare with the {@link OpenApi.IJsonSchema}, the emended JSON schema specification,\n> \n> - {@link IChatGptSchema.IAnyOf} instead of the {@link OpenApi.IJsonSchema.IOneOf}\n> - {@link IChatGptSchema.IParameters.$defs} instead of the {@link OpenApi.IJsonSchema.IComponents.schemas}\n> - {@link IChatGptSchema.IString.enum} instead of the {@link OpenApi.IJsonSchema.IConstant}\n> - {@link IChatGptSchema.additionalProperties} is fixed to `false`\n> - No tuple type {@link OpenApi.IJsonSchema.ITuple} support\n> - When {@link IChatGptSchema.IConfig.strict} mode\n>   - Every object properties must be required\n>   - Do not allow {@link IChatGptSchema.IObject.additionalProperties}\n> \n> For reference, if you've composed the `IChatGptSchema` type with the\n> {@link IChatGptSchema.IConfig.reference} `false` option (default is `false`),\n> only the recursived named types would be archived into the\n> {@link IChatGptSchema.IParameters.$defs}, and the others would be ecaped from the\n> {@link IChatGptSchema.IReference} type.\n> \n> Also, ChatGPT has banned below constraint properties. Instead, I'll will\n> fill the {@link IChatGptSchema.__IAttribute.description} property with\n> the comment text like `\"@format uuid\"`.\n> \n> - {@link OpenApi.IJsonSchema.INumber.minimum}\n> - {@link OpenApi.IJsonSchema.INumber.maximum}\n> - {@link OpenApi.IJsonSchema.INumber.multipleOf}\n> - {@link OpenApi.IJsonSchema.IString.minLength}\n> - {@link OpenApi.IJsonSchema.IString.maxLength}\n> - {@link OpenApi.IJsonSchema.IString.format}\n> - {@link OpenApi.IJsonSchema.IString.pattern}\n> - {@link OpenApi.IJsonSchema.IString.contentMediaType}\n> - {@link OpenApi.IJsonSchema.IString.default}\n> - {@link OpenApi.IJsonSchema.IArray.minItems}\n> - {@link OpenApi.IJsonSchema.IArray.maxItems}\n> - {@link OpenApi.IJsonSchema.IArray.unique}"
                            },
                            {
                                type: "object",
                                properties: {
                                    "enum": {
                                        title: "Enumeration values",
                                        description: "Enumeration values.",
                                        type: "array",
                                        items: {
                                            type: "string"
                                        }
                                    },
                                    type: {
                                        title: "Discriminator value of the type",
                                        type: "string",
                                        "enum": [
                                            "string"
                                        ]
                                    },
                                    title: {
                                        title: "Title of the schema",
                                        description: "Title of the schema.",
                                        type: "string"
                                    },
                                    description: {
                                        title: "Detailed description of the schema",
                                        description: "Detailed description of the schema.",
                                        type: "string"
                                    },
                                    deprecated: {
                                        title: "Whether the type is deprecated or not",
                                        description: "Whether the type is deprecated or not.",
                                        type: "boolean"
                                    },
                                    example: {
                                        title: "Example value",
                                        description: "Example value."
                                    },
                                    examples: {
                                        description: "Construct a type with a set of properties K of type T",
                                        type: "object",
                                        properties: {},
                                        required: [],
                                        additionalProperties: {}
                                    }
                                },
                                required: [
                                    "type"
                                ],
                                description: "String type info.\n\n------------------------------\n\nDescription of the current {@link IChatGptSchema.IString} type:\n\n> String type info.\n\n------------------------------\n\nDescription of the parent {@link IChatGptSchema} type:\n\n> Type schema info of the ChatGPT.\n> \n> `IChatGptSchema` is a type schema info of the ChatGPT function calling.\n> \n> `IChatGptSchema` basically follows the JSON schema definition of the OpenAPI v3.1\n> speciifcation; {@link OpenApiV3_1.IJsonSchema}.\n> \n> However, the `IChatGptSchema` does not follow the entire specification of\n> the OpenAPI v3.1. It has own specific restrictions and definitions. Here is the\n> list of how `IChatGptSchema` is different with the OpenAPI v3.1 JSON schema.\n> \n> - Decompose mixed type: {@link OpenApiV3_1.IJsonSchema.IMixed}\n> - Resolve nullable property: {@link OpenApiV3_1.IJsonSchema.__ISignificant.nullable}\n> - Tuple type is banned: {@link OpenApiV3_1.IJsonSchema.ITuple.prefixItems}\n> - Constant type is banned: {@link OpenApiV3_1.IJsonSchema.IConstant}\n> - Merge {@link OpenApiV3_1.IJsonSchema.IOneOf} to {@link IChatGptSchema.IAnOf}\n> - Merge {@link OpenApiV3_1.IJsonSchema.IAllOf} to {@link IChatGptSchema.IObject}\n> - Merge {@link OpenApiV3_1.IJsonSchema.IRecursiveReference} to {@link IChatGptSchema.IReference}\n> - When {@link IChatGptSchema.IConfig.strict} mode\n>   - Every object properties must be required\n>   - Do not allow {@link IChatGptSchema.IObject.additionalProperties}\n> \n> If compare with the {@link OpenApi.IJsonSchema}, the emended JSON schema specification,\n> \n> - {@link IChatGptSchema.IAnyOf} instead of the {@link OpenApi.IJsonSchema.IOneOf}\n> - {@link IChatGptSchema.IParameters.$defs} instead of the {@link OpenApi.IJsonSchema.IComponents.schemas}\n> - {@link IChatGptSchema.IString.enum} instead of the {@link OpenApi.IJsonSchema.IConstant}\n> - {@link IChatGptSchema.additionalProperties} is fixed to `false`\n> - No tuple type {@link OpenApi.IJsonSchema.ITuple} support\n> - When {@link IChatGptSchema.IConfig.strict} mode\n>   - Every object properties must be required\n>   - Do not allow {@link IChatGptSchema.IObject.additionalProperties}\n> \n> For reference, if you've composed the `IChatGptSchema` type with the\n> {@link IChatGptSchema.IConfig.reference} `false` option (default is `false`),\n> only the recursived named types would be archived into the\n> {@link IChatGptSchema.IParameters.$defs}, and the others would be ecaped from the\n> {@link IChatGptSchema.IReference} type.\n> \n> Also, ChatGPT has banned below constraint properties. Instead, I'll will\n> fill the {@link IChatGptSchema.__IAttribute.description} property with\n> the comment text like `\"@format uuid\"`.\n> \n> - {@link OpenApi.IJsonSchema.INumber.minimum}\n> - {@link OpenApi.IJsonSchema.INumber.maximum}\n> - {@link OpenApi.IJsonSchema.INumber.multipleOf}\n> - {@link OpenApi.IJsonSchema.IString.minLength}\n> - {@link OpenApi.IJsonSchema.IString.maxLength}\n> - {@link OpenApi.IJsonSchema.IString.format}\n> - {@link OpenApi.IJsonSchema.IString.pattern}\n> - {@link OpenApi.IJsonSchema.IString.contentMediaType}\n> - {@link OpenApi.IJsonSchema.IString.default}\n> - {@link OpenApi.IJsonSchema.IArray.minItems}\n> - {@link OpenApi.IJsonSchema.IArray.maxItems}\n> - {@link OpenApi.IJsonSchema.IArray.unique}"
                            },
                            {
                                $ref: "#/$defs/IChatGptSchema.IArray"
                            },
                            {
                                type: "object",
                                properties: {
                                    $ref: {
                                        title: "Reference to the named schema",
                                        description: "Reference to the named schema.\n\nThe `ref` is a reference to the named schema. Format of the `$ref` is\nfollowing the JSON Pointer specification. In the OpenAPI, the `$ref`\nstarts with `#/$defs/` which means the type is stored in\nthe {@link IChatGptSchema.IParameters.$defs} object.\n\n- `#/$defs/SomeObject`\n- `#/$defs/AnotherObject`",
                                        type: "string"
                                    },
                                    title: {
                                        title: "Title of the schema",
                                        description: "Title of the schema.",
                                        type: "string"
                                    },
                                    description: {
                                        title: "Detailed description of the schema",
                                        description: "Detailed description of the schema.",
                                        type: "string"
                                    },
                                    deprecated: {
                                        title: "Whether the type is deprecated or not",
                                        description: "Whether the type is deprecated or not.",
                                        type: "boolean"
                                    },
                                    example: {
                                        title: "Example value",
                                        description: "Example value."
                                    },
                                    examples: {
                                        description: "Construct a type with a set of properties K of type T",
                                        type: "object",
                                        properties: {},
                                        required: [],
                                        additionalProperties: {}
                                    }
                                },
                                required: [
                                    "$ref"
                                ],
                                description: "Reference type directing named schema.\n\n------------------------------\n\nDescription of the current {@link IChatGptSchema.IReference} type:\n\n> Reference type directing named schema.\n\n------------------------------\n\nDescription of the parent {@link IChatGptSchema} type:\n\n> Type schema info of the ChatGPT.\n> \n> `IChatGptSchema` is a type schema info of the ChatGPT function calling.\n> \n> `IChatGptSchema` basically follows the JSON schema definition of the OpenAPI v3.1\n> speciifcation; {@link OpenApiV3_1.IJsonSchema}.\n> \n> However, the `IChatGptSchema` does not follow the entire specification of\n> the OpenAPI v3.1. It has own specific restrictions and definitions. Here is the\n> list of how `IChatGptSchema` is different with the OpenAPI v3.1 JSON schema.\n> \n> - Decompose mixed type: {@link OpenApiV3_1.IJsonSchema.IMixed}\n> - Resolve nullable property: {@link OpenApiV3_1.IJsonSchema.__ISignificant.nullable}\n> - Tuple type is banned: {@link OpenApiV3_1.IJsonSchema.ITuple.prefixItems}\n> - Constant type is banned: {@link OpenApiV3_1.IJsonSchema.IConstant}\n> - Merge {@link OpenApiV3_1.IJsonSchema.IOneOf} to {@link IChatGptSchema.IAnOf}\n> - Merge {@link OpenApiV3_1.IJsonSchema.IAllOf} to {@link IChatGptSchema.IObject}\n> - Merge {@link OpenApiV3_1.IJsonSchema.IRecursiveReference} to {@link IChatGptSchema.IReference}\n> - When {@link IChatGptSchema.IConfig.strict} mode\n>   - Every object properties must be required\n>   - Do not allow {@link IChatGptSchema.IObject.additionalProperties}\n> \n> If compare with the {@link OpenApi.IJsonSchema}, the emended JSON schema specification,\n> \n> - {@link IChatGptSchema.IAnyOf} instead of the {@link OpenApi.IJsonSchema.IOneOf}\n> - {@link IChatGptSchema.IParameters.$defs} instead of the {@link OpenApi.IJsonSchema.IComponents.schemas}\n> - {@link IChatGptSchema.IString.enum} instead of the {@link OpenApi.IJsonSchema.IConstant}\n> - {@link IChatGptSchema.additionalProperties} is fixed to `false`\n> - No tuple type {@link OpenApi.IJsonSchema.ITuple} support\n> - When {@link IChatGptSchema.IConfig.strict} mode\n>   - Every object properties must be required\n>   - Do not allow {@link IChatGptSchema.IObject.additionalProperties}\n> \n> For reference, if you've composed the `IChatGptSchema` type with the\n> {@link IChatGptSchema.IConfig.reference} `false` option (default is `false`),\n> only the recursived named types would be archived into the\n> {@link IChatGptSchema.IParameters.$defs}, and the others would be ecaped from the\n> {@link IChatGptSchema.IReference} type.\n> \n> Also, ChatGPT has banned below constraint properties. Instead, I'll will\n> fill the {@link IChatGptSchema.__IAttribute.description} property with\n> the comment text like `\"@format uuid\"`.\n> \n> - {@link OpenApi.IJsonSchema.INumber.minimum}\n> - {@link OpenApi.IJsonSchema.INumber.maximum}\n> - {@link OpenApi.IJsonSchema.INumber.multipleOf}\n> - {@link OpenApi.IJsonSchema.IString.minLength}\n> - {@link OpenApi.IJsonSchema.IString.maxLength}\n> - {@link OpenApi.IJsonSchema.IString.format}\n> - {@link OpenApi.IJsonSchema.IString.pattern}\n> - {@link OpenApi.IJsonSchema.IString.contentMediaType}\n> - {@link OpenApi.IJsonSchema.IString.default}\n> - {@link OpenApi.IJsonSchema.IArray.minItems}\n> - {@link OpenApi.IJsonSchema.IArray.maxItems}\n> - {@link OpenApi.IJsonSchema.IArray.unique}"
                            },
                            {
                                $ref: "#/$defs/IChatGptSchema.IAnyOf"
                            },
                            {
                                type: "object",
                                properties: {
                                    type: {
                                        title: "Discriminator value of the type",
                                        type: "string",
                                        "enum": [
                                            "null"
                                        ]
                                    },
                                    title: {
                                        title: "Title of the schema",
                                        description: "Title of the schema.",
                                        type: "string"
                                    },
                                    description: {
                                        title: "Detailed description of the schema",
                                        description: "Detailed description of the schema.",
                                        type: "string"
                                    },
                                    deprecated: {
                                        title: "Whether the type is deprecated or not",
                                        description: "Whether the type is deprecated or not.",
                                        type: "boolean"
                                    },
                                    example: {
                                        title: "Example value",
                                        description: "Example value."
                                    },
                                    examples: {
                                        description: "Construct a type with a set of properties K of type T",
                                        type: "object",
                                        properties: {},
                                        required: [],
                                        additionalProperties: {}
                                    }
                                },
                                required: [
                                    "type"
                                ],
                                description: "Null type.\n\n------------------------------\n\nDescription of the current {@link IChatGptSchema.INull} type:\n\n> Null type.\n\n------------------------------\n\nDescription of the parent {@link IChatGptSchema} type:\n\n> Type schema info of the ChatGPT.\n> \n> `IChatGptSchema` is a type schema info of the ChatGPT function calling.\n> \n> `IChatGptSchema` basically follows the JSON schema definition of the OpenAPI v3.1\n> speciifcation; {@link OpenApiV3_1.IJsonSchema}.\n> \n> However, the `IChatGptSchema` does not follow the entire specification of\n> the OpenAPI v3.1. It has own specific restrictions and definitions. Here is the\n> list of how `IChatGptSchema` is different with the OpenAPI v3.1 JSON schema.\n> \n> - Decompose mixed type: {@link OpenApiV3_1.IJsonSchema.IMixed}\n> - Resolve nullable property: {@link OpenApiV3_1.IJsonSchema.__ISignificant.nullable}\n> - Tuple type is banned: {@link OpenApiV3_1.IJsonSchema.ITuple.prefixItems}\n> - Constant type is banned: {@link OpenApiV3_1.IJsonSchema.IConstant}\n> - Merge {@link OpenApiV3_1.IJsonSchema.IOneOf} to {@link IChatGptSchema.IAnOf}\n> - Merge {@link OpenApiV3_1.IJsonSchema.IAllOf} to {@link IChatGptSchema.IObject}\n> - Merge {@link OpenApiV3_1.IJsonSchema.IRecursiveReference} to {@link IChatGptSchema.IReference}\n> - When {@link IChatGptSchema.IConfig.strict} mode\n>   - Every object properties must be required\n>   - Do not allow {@link IChatGptSchema.IObject.additionalProperties}\n> \n> If compare with the {@link OpenApi.IJsonSchema}, the emended JSON schema specification,\n> \n> - {@link IChatGptSchema.IAnyOf} instead of the {@link OpenApi.IJsonSchema.IOneOf}\n> - {@link IChatGptSchema.IParameters.$defs} instead of the {@link OpenApi.IJsonSchema.IComponents.schemas}\n> - {@link IChatGptSchema.IString.enum} instead of the {@link OpenApi.IJsonSchema.IConstant}\n> - {@link IChatGptSchema.additionalProperties} is fixed to `false`\n> - No tuple type {@link OpenApi.IJsonSchema.ITuple} support\n> - When {@link IChatGptSchema.IConfig.strict} mode\n>   - Every object properties must be required\n>   - Do not allow {@link IChatGptSchema.IObject.additionalProperties}\n> \n> For reference, if you've composed the `IChatGptSchema` type with the\n> {@link IChatGptSchema.IConfig.reference} `false` option (default is `false`),\n> only the recursived named types would be archived into the\n> {@link IChatGptSchema.IParameters.$defs}, and the others would be ecaped from the\n> {@link IChatGptSchema.IReference} type.\n> \n> Also, ChatGPT has banned below constraint properties. Instead, I'll will\n> fill the {@link IChatGptSchema.__IAttribute.description} property with\n> the comment text like `\"@format uuid\"`.\n> \n> - {@link OpenApi.IJsonSchema.INumber.minimum}\n> - {@link OpenApi.IJsonSchema.INumber.maximum}\n> - {@link OpenApi.IJsonSchema.INumber.multipleOf}\n> - {@link OpenApi.IJsonSchema.IString.minLength}\n> - {@link OpenApi.IJsonSchema.IString.maxLength}\n> - {@link OpenApi.IJsonSchema.IString.format}\n> - {@link OpenApi.IJsonSchema.IString.pattern}\n> - {@link OpenApi.IJsonSchema.IString.contentMediaType}\n> - {@link OpenApi.IJsonSchema.IString.default}\n> - {@link OpenApi.IJsonSchema.IArray.minItems}\n> - {@link OpenApi.IJsonSchema.IArray.maxItems}\n> - {@link OpenApi.IJsonSchema.IArray.unique}"
                            },
                            {
                                type: "object",
                                properties: {
                                    title: {
                                        title: "Title of the schema",
                                        description: "Title of the schema.",
                                        type: "string"
                                    },
                                    description: {
                                        title: "Detailed description of the schema",
                                        description: "Detailed description of the schema.",
                                        type: "string"
                                    },
                                    deprecated: {
                                        title: "Whether the type is deprecated or not",
                                        description: "Whether the type is deprecated or not.",
                                        type: "boolean"
                                    },
                                    example: {
                                        title: "Example value",
                                        description: "Example value."
                                    },
                                    examples: {
                                        description: "Construct a type with a set of properties K of type T",
                                        type: "object",
                                        properties: {},
                                        required: [],
                                        additionalProperties: {}
                                    }
                                },
                                required: [],
                                description: "Unknown, the `any` type.\n\n------------------------------\n\nDescription of the current {@link IChatGptSchema.IUnknown} type:\n\n> Unknown, the `any` type.\n\n------------------------------\n\nDescription of the parent {@link IChatGptSchema} type:\n\n> Type schema info of the ChatGPT.\n> \n> `IChatGptSchema` is a type schema info of the ChatGPT function calling.\n> \n> `IChatGptSchema` basically follows the JSON schema definition of the OpenAPI v3.1\n> speciifcation; {@link OpenApiV3_1.IJsonSchema}.\n> \n> However, the `IChatGptSchema` does not follow the entire specification of\n> the OpenAPI v3.1. It has own specific restrictions and definitions. Here is the\n> list of how `IChatGptSchema` is different with the OpenAPI v3.1 JSON schema.\n> \n> - Decompose mixed type: {@link OpenApiV3_1.IJsonSchema.IMixed}\n> - Resolve nullable property: {@link OpenApiV3_1.IJsonSchema.__ISignificant.nullable}\n> - Tuple type is banned: {@link OpenApiV3_1.IJsonSchema.ITuple.prefixItems}\n> - Constant type is banned: {@link OpenApiV3_1.IJsonSchema.IConstant}\n> - Merge {@link OpenApiV3_1.IJsonSchema.IOneOf} to {@link IChatGptSchema.IAnOf}\n> - Merge {@link OpenApiV3_1.IJsonSchema.IAllOf} to {@link IChatGptSchema.IObject}\n> - Merge {@link OpenApiV3_1.IJsonSchema.IRecursiveReference} to {@link IChatGptSchema.IReference}\n> - When {@link IChatGptSchema.IConfig.strict} mode\n>   - Every object properties must be required\n>   - Do not allow {@link IChatGptSchema.IObject.additionalProperties}\n> \n> If compare with the {@link OpenApi.IJsonSchema}, the emended JSON schema specification,\n> \n> - {@link IChatGptSchema.IAnyOf} instead of the {@link OpenApi.IJsonSchema.IOneOf}\n> - {@link IChatGptSchema.IParameters.$defs} instead of the {@link OpenApi.IJsonSchema.IComponents.schemas}\n> - {@link IChatGptSchema.IString.enum} instead of the {@link OpenApi.IJsonSchema.IConstant}\n> - {@link IChatGptSchema.additionalProperties} is fixed to `false`\n> - No tuple type {@link OpenApi.IJsonSchema.ITuple} support\n> - When {@link IChatGptSchema.IConfig.strict} mode\n>   - Every object properties must be required\n>   - Do not allow {@link IChatGptSchema.IObject.additionalProperties}\n> \n> For reference, if you've composed the `IChatGptSchema` type with the\n> {@link IChatGptSchema.IConfig.reference} `false` option (default is `false`),\n> only the recursived named types would be archived into the\n> {@link IChatGptSchema.IParameters.$defs}, and the others would be ecaped from the\n> {@link IChatGptSchema.IReference} type.\n> \n> Also, ChatGPT has banned below constraint properties. Instead, I'll will\n> fill the {@link IChatGptSchema.__IAttribute.description} property with\n> the comment text like `\"@format uuid\"`.\n> \n> - {@link OpenApi.IJsonSchema.INumber.minimum}\n> - {@link OpenApi.IJsonSchema.INumber.maximum}\n> - {@link OpenApi.IJsonSchema.INumber.multipleOf}\n> - {@link OpenApi.IJsonSchema.IString.minLength}\n> - {@link OpenApi.IJsonSchema.IString.maxLength}\n> - {@link OpenApi.IJsonSchema.IString.format}\n> - {@link OpenApi.IJsonSchema.IString.pattern}\n> - {@link OpenApi.IJsonSchema.IString.contentMediaType}\n> - {@link OpenApi.IJsonSchema.IString.default}\n> - {@link OpenApi.IJsonSchema.IArray.minItems}\n> - {@link OpenApi.IJsonSchema.IArray.maxItems}\n> - {@link OpenApi.IJsonSchema.IArray.unique}"
                            }
                        ]
                    },
                    "IChatGptSchema.IObject": {
                        description: "Object type info.",
                        type: "object",
                        properties: {
                            properties: {
                                title: "Properties of the object",
                                $ref: "#/$defs/RecordstringIChatGptSchema"
                            },
                            additionalProperties: {
                                title: "Additional properties' info",
                                description: "Additional properties' info.\n\nThe `additionalProperties` means the type schema info of the additional\nproperties that are not listed in the {@link properties}.\n\nBy the way, if you've configured {@link IChatGptSchema.IConfig.strict} as `true`,\nChatGPT function calling does not support such dynamic key typed properties, so\nthe `additionalProperties` becomes always `false`.",
                                anyOf: [
                                    {
                                        type: "boolean"
                                    },
                                    {
                                        $ref: "#/$defs/IChatGptSchema.IObject"
                                    },
                                    {
                                        type: "object",
                                        properties: {
                                            "enum": {
                                                title: "Enumeration values",
                                                description: "Enumeration values.",
                                                type: "array",
                                                items: {
                                                    type: "string"
                                                }
                                            },
                                            type: {
                                                title: "Discriminator value of the type",
                                                type: "string",
                                                "enum": [
                                                    "string"
                                                ]
                                            },
                                            title: {
                                                title: "Title of the schema",
                                                description: "Title of the schema.",
                                                type: "string"
                                            },
                                            description: {
                                                title: "Detailed description of the schema",
                                                description: "Detailed description of the schema.",
                                                type: "string"
                                            },
                                            deprecated: {
                                                title: "Whether the type is deprecated or not",
                                                description: "Whether the type is deprecated or not.",
                                                type: "boolean"
                                            },
                                            example: {
                                                title: "Example value",
                                                description: "Example value."
                                            },
                                            examples: {
                                                description: "Construct a type with a set of properties K of type T",
                                                type: "object",
                                                properties: {},
                                                required: [],
                                                additionalProperties: {}
                                            }
                                        },
                                        required: [
                                            "type"
                                        ],
                                        description: "String type info.\n\n------------------------------\n\nDescription of the current {@link IChatGptSchema.IString} type:\n\n> String type info.\n\n------------------------------\n\nDescription of the parent {@link IChatGptSchema} type:\n\n> Type schema info of the ChatGPT.\n> \n> `IChatGptSchema` is a type schema info of the ChatGPT function calling.\n> \n> `IChatGptSchema` basically follows the JSON schema definition of the OpenAPI v3.1\n> speciifcation; {@link OpenApiV3_1.IJsonSchema}.\n> \n> However, the `IChatGptSchema` does not follow the entire specification of\n> the OpenAPI v3.1. It has own specific restrictions and definitions. Here is the\n> list of how `IChatGptSchema` is different with the OpenAPI v3.1 JSON schema.\n> \n> - Decompose mixed type: {@link OpenApiV3_1.IJsonSchema.IMixed}\n> - Resolve nullable property: {@link OpenApiV3_1.IJsonSchema.__ISignificant.nullable}\n> - Tuple type is banned: {@link OpenApiV3_1.IJsonSchema.ITuple.prefixItems}\n> - Constant type is banned: {@link OpenApiV3_1.IJsonSchema.IConstant}\n> - Merge {@link OpenApiV3_1.IJsonSchema.IOneOf} to {@link IChatGptSchema.IAnOf}\n> - Merge {@link OpenApiV3_1.IJsonSchema.IAllOf} to {@link IChatGptSchema.IObject}\n> - Merge {@link OpenApiV3_1.IJsonSchema.IRecursiveReference} to {@link IChatGptSchema.IReference}\n> - When {@link IChatGptSchema.IConfig.strict} mode\n>   - Every object properties must be required\n>   - Do not allow {@link IChatGptSchema.IObject.additionalProperties}\n> \n> If compare with the {@link OpenApi.IJsonSchema}, the emended JSON schema specification,\n> \n> - {@link IChatGptSchema.IAnyOf} instead of the {@link OpenApi.IJsonSchema.IOneOf}\n> - {@link IChatGptSchema.IParameters.$defs} instead of the {@link OpenApi.IJsonSchema.IComponents.schemas}\n> - {@link IChatGptSchema.IString.enum} instead of the {@link OpenApi.IJsonSchema.IConstant}\n> - {@link IChatGptSchema.additionalProperties} is fixed to `false`\n> - No tuple type {@link OpenApi.IJsonSchema.ITuple} support\n> - When {@link IChatGptSchema.IConfig.strict} mode\n>   - Every object properties must be required\n>   - Do not allow {@link IChatGptSchema.IObject.additionalProperties}\n> \n> For reference, if you've composed the `IChatGptSchema` type with the\n> {@link IChatGptSchema.IConfig.reference} `false` option (default is `false`),\n> only the recursived named types would be archived into the\n> {@link IChatGptSchema.IParameters.$defs}, and the others would be ecaped from the\n> {@link IChatGptSchema.IReference} type.\n> \n> Also, ChatGPT has banned below constraint properties. Instead, I'll will\n> fill the {@link IChatGptSchema.__IAttribute.description} property with\n> the comment text like `\"@format uuid\"`.\n> \n> - {@link OpenApi.IJsonSchema.INumber.minimum}\n> - {@link OpenApi.IJsonSchema.INumber.maximum}\n> - {@link OpenApi.IJsonSchema.INumber.multipleOf}\n> - {@link OpenApi.IJsonSchema.IString.minLength}\n> - {@link OpenApi.IJsonSchema.IString.maxLength}\n> - {@link OpenApi.IJsonSchema.IString.format}\n> - {@link OpenApi.IJsonSchema.IString.pattern}\n> - {@link OpenApi.IJsonSchema.IString.contentMediaType}\n> - {@link OpenApi.IJsonSchema.IString.default}\n> - {@link OpenApi.IJsonSchema.IArray.minItems}\n> - {@link OpenApi.IJsonSchema.IArray.maxItems}\n> - {@link OpenApi.IJsonSchema.IArray.unique}"
                                    },
                                    {
                                        type: "object",
                                        properties: {
                                            "enum": {
                                                title: "Enumeration values",
                                                description: "Enumeration values.",
                                                type: "array",
                                                items: {
                                                    type: "number"
                                                }
                                            },
                                            type: {
                                                title: "Discriminator value of the type",
                                                type: "string",
                                                "enum": [
                                                    "number"
                                                ]
                                            },
                                            title: {
                                                title: "Title of the schema",
                                                description: "Title of the schema.",
                                                type: "string"
                                            },
                                            description: {
                                                title: "Detailed description of the schema",
                                                description: "Detailed description of the schema.",
                                                type: "string"
                                            },
                                            deprecated: {
                                                title: "Whether the type is deprecated or not",
                                                description: "Whether the type is deprecated or not.",
                                                type: "boolean"
                                            },
                                            example: {
                                                title: "Example value",
                                                description: "Example value."
                                            },
                                            examples: {
                                                description: "Construct a type with a set of properties K of type T",
                                                type: "object",
                                                properties: {},
                                                required: [],
                                                additionalProperties: {}
                                            }
                                        },
                                        required: [
                                            "type"
                                        ],
                                        description: "Number (double) type info.\n\n------------------------------\n\nDescription of the current {@link IChatGptSchema.INumber} type:\n\n> Number (double) type info.\n\n------------------------------\n\nDescription of the parent {@link IChatGptSchema} type:\n\n> Type schema info of the ChatGPT.\n> \n> `IChatGptSchema` is a type schema info of the ChatGPT function calling.\n> \n> `IChatGptSchema` basically follows the JSON schema definition of the OpenAPI v3.1\n> speciifcation; {@link OpenApiV3_1.IJsonSchema}.\n> \n> However, the `IChatGptSchema` does not follow the entire specification of\n> the OpenAPI v3.1. It has own specific restrictions and definitions. Here is the\n> list of how `IChatGptSchema` is different with the OpenAPI v3.1 JSON schema.\n> \n> - Decompose mixed type: {@link OpenApiV3_1.IJsonSchema.IMixed}\n> - Resolve nullable property: {@link OpenApiV3_1.IJsonSchema.__ISignificant.nullable}\n> - Tuple type is banned: {@link OpenApiV3_1.IJsonSchema.ITuple.prefixItems}\n> - Constant type is banned: {@link OpenApiV3_1.IJsonSchema.IConstant}\n> - Merge {@link OpenApiV3_1.IJsonSchema.IOneOf} to {@link IChatGptSchema.IAnOf}\n> - Merge {@link OpenApiV3_1.IJsonSchema.IAllOf} to {@link IChatGptSchema.IObject}\n> - Merge {@link OpenApiV3_1.IJsonSchema.IRecursiveReference} to {@link IChatGptSchema.IReference}\n> - When {@link IChatGptSchema.IConfig.strict} mode\n>   - Every object properties must be required\n>   - Do not allow {@link IChatGptSchema.IObject.additionalProperties}\n> \n> If compare with the {@link OpenApi.IJsonSchema}, the emended JSON schema specification,\n> \n> - {@link IChatGptSchema.IAnyOf} instead of the {@link OpenApi.IJsonSchema.IOneOf}\n> - {@link IChatGptSchema.IParameters.$defs} instead of the {@link OpenApi.IJsonSchema.IComponents.schemas}\n> - {@link IChatGptSchema.IString.enum} instead of the {@link OpenApi.IJsonSchema.IConstant}\n> - {@link IChatGptSchema.additionalProperties} is fixed to `false`\n> - No tuple type {@link OpenApi.IJsonSchema.ITuple} support\n> - When {@link IChatGptSchema.IConfig.strict} mode\n>   - Every object properties must be required\n>   - Do not allow {@link IChatGptSchema.IObject.additionalProperties}\n> \n> For reference, if you've composed the `IChatGptSchema` type with the\n> {@link IChatGptSchema.IConfig.reference} `false` option (default is `false`),\n> only the recursived named types would be archived into the\n> {@link IChatGptSchema.IParameters.$defs}, and the others would be ecaped from the\n> {@link IChatGptSchema.IReference} type.\n> \n> Also, ChatGPT has banned below constraint properties. Instead, I'll will\n> fill the {@link IChatGptSchema.__IAttribute.description} property with\n> the comment text like `\"@format uuid\"`.\n> \n> - {@link OpenApi.IJsonSchema.INumber.minimum}\n> - {@link OpenApi.IJsonSchema.INumber.maximum}\n> - {@link OpenApi.IJsonSchema.INumber.multipleOf}\n> - {@link OpenApi.IJsonSchema.IString.minLength}\n> - {@link OpenApi.IJsonSchema.IString.maxLength}\n> - {@link OpenApi.IJsonSchema.IString.format}\n> - {@link OpenApi.IJsonSchema.IString.pattern}\n> - {@link OpenApi.IJsonSchema.IString.contentMediaType}\n> - {@link OpenApi.IJsonSchema.IString.default}\n> - {@link OpenApi.IJsonSchema.IArray.minItems}\n> - {@link OpenApi.IJsonSchema.IArray.maxItems}\n> - {@link OpenApi.IJsonSchema.IArray.unique}"
                                    },
                                    {
                                        type: "object",
                                        properties: {
                                            "enum": {
                                                title: "Enumeration values",
                                                description: "Enumeration values.",
                                                type: "array",
                                                items: {
                                                    type: "number"
                                                }
                                            },
                                            type: {
                                                title: "Discriminator value of the type",
                                                type: "string",
                                                "enum": [
                                                    "integer"
                                                ]
                                            },
                                            title: {
                                                title: "Title of the schema",
                                                description: "Title of the schema.",
                                                type: "string"
                                            },
                                            description: {
                                                title: "Detailed description of the schema",
                                                description: "Detailed description of the schema.",
                                                type: "string"
                                            },
                                            deprecated: {
                                                title: "Whether the type is deprecated or not",
                                                description: "Whether the type is deprecated or not.",
                                                type: "boolean"
                                            },
                                            example: {
                                                title: "Example value",
                                                description: "Example value."
                                            },
                                            examples: {
                                                description: "Construct a type with a set of properties K of type T",
                                                type: "object",
                                                properties: {},
                                                required: [],
                                                additionalProperties: {}
                                            }
                                        },
                                        required: [
                                            "type"
                                        ],
                                        description: "Integer type info.\n\n------------------------------\n\nDescription of the current {@link IChatGptSchema.IInteger} type:\n\n> Integer type info.\n\n------------------------------\n\nDescription of the parent {@link IChatGptSchema} type:\n\n> Type schema info of the ChatGPT.\n> \n> `IChatGptSchema` is a type schema info of the ChatGPT function calling.\n> \n> `IChatGptSchema` basically follows the JSON schema definition of the OpenAPI v3.1\n> speciifcation; {@link OpenApiV3_1.IJsonSchema}.\n> \n> However, the `IChatGptSchema` does not follow the entire specification of\n> the OpenAPI v3.1. It has own specific restrictions and definitions. Here is the\n> list of how `IChatGptSchema` is different with the OpenAPI v3.1 JSON schema.\n> \n> - Decompose mixed type: {@link OpenApiV3_1.IJsonSchema.IMixed}\n> - Resolve nullable property: {@link OpenApiV3_1.IJsonSchema.__ISignificant.nullable}\n> - Tuple type is banned: {@link OpenApiV3_1.IJsonSchema.ITuple.prefixItems}\n> - Constant type is banned: {@link OpenApiV3_1.IJsonSchema.IConstant}\n> - Merge {@link OpenApiV3_1.IJsonSchema.IOneOf} to {@link IChatGptSchema.IAnOf}\n> - Merge {@link OpenApiV3_1.IJsonSchema.IAllOf} to {@link IChatGptSchema.IObject}\n> - Merge {@link OpenApiV3_1.IJsonSchema.IRecursiveReference} to {@link IChatGptSchema.IReference}\n> - When {@link IChatGptSchema.IConfig.strict} mode\n>   - Every object properties must be required\n>   - Do not allow {@link IChatGptSchema.IObject.additionalProperties}\n> \n> If compare with the {@link OpenApi.IJsonSchema}, the emended JSON schema specification,\n> \n> - {@link IChatGptSchema.IAnyOf} instead of the {@link OpenApi.IJsonSchema.IOneOf}\n> - {@link IChatGptSchema.IParameters.$defs} instead of the {@link OpenApi.IJsonSchema.IComponents.schemas}\n> - {@link IChatGptSchema.IString.enum} instead of the {@link OpenApi.IJsonSchema.IConstant}\n> - {@link IChatGptSchema.additionalProperties} is fixed to `false`\n> - No tuple type {@link OpenApi.IJsonSchema.ITuple} support\n> - When {@link IChatGptSchema.IConfig.strict} mode\n>   - Every object properties must be required\n>   - Do not allow {@link IChatGptSchema.IObject.additionalProperties}\n> \n> For reference, if you've composed the `IChatGptSchema` type with the\n> {@link IChatGptSchema.IConfig.reference} `false` option (default is `false`),\n> only the recursived named types would be archived into the\n> {@link IChatGptSchema.IParameters.$defs}, and the others would be ecaped from the\n> {@link IChatGptSchema.IReference} type.\n> \n> Also, ChatGPT has banned below constraint properties. Instead, I'll will\n> fill the {@link IChatGptSchema.__IAttribute.description} property with\n> the comment text like `\"@format uuid\"`.\n> \n> - {@link OpenApi.IJsonSchema.INumber.minimum}\n> - {@link OpenApi.IJsonSchema.INumber.maximum}\n> - {@link OpenApi.IJsonSchema.INumber.multipleOf}\n> - {@link OpenApi.IJsonSchema.IString.minLength}\n> - {@link OpenApi.IJsonSchema.IString.maxLength}\n> - {@link OpenApi.IJsonSchema.IString.format}\n> - {@link OpenApi.IJsonSchema.IString.pattern}\n> - {@link OpenApi.IJsonSchema.IString.contentMediaType}\n> - {@link OpenApi.IJsonSchema.IString.default}\n> - {@link OpenApi.IJsonSchema.IArray.minItems}\n> - {@link OpenApi.IJsonSchema.IArray.maxItems}\n> - {@link OpenApi.IJsonSchema.IArray.unique}"
                                    },
                                    {
                                        type: "object",
                                        properties: {
                                            "enum": {
                                                title: "Enumeration values",
                                                description: "Enumeration values.",
                                                type: "array",
                                                items: {
                                                    type: "boolean"
                                                }
                                            },
                                            type: {
                                                title: "Discriminator value of the type",
                                                type: "string",
                                                "enum": [
                                                    "boolean"
                                                ]
                                            },
                                            title: {
                                                title: "Title of the schema",
                                                description: "Title of the schema.",
                                                type: "string"
                                            },
                                            description: {
                                                title: "Detailed description of the schema",
                                                description: "Detailed description of the schema.",
                                                type: "string"
                                            },
                                            deprecated: {
                                                title: "Whether the type is deprecated or not",
                                                description: "Whether the type is deprecated or not.",
                                                type: "boolean"
                                            },
                                            example: {
                                                title: "Example value",
                                                description: "Example value."
                                            },
                                            examples: {
                                                description: "Construct a type with a set of properties K of type T",
                                                type: "object",
                                                properties: {},
                                                required: [],
                                                additionalProperties: {}
                                            }
                                        },
                                        required: [
                                            "type"
                                        ],
                                        description: "Boolean type info.\n\n------------------------------\n\nDescription of the current {@link IChatGptSchema.IBoolean} type:\n\n> Boolean type info.\n\n------------------------------\n\nDescription of the parent {@link IChatGptSchema} type:\n\n> Type schema info of the ChatGPT.\n> \n> `IChatGptSchema` is a type schema info of the ChatGPT function calling.\n> \n> `IChatGptSchema` basically follows the JSON schema definition of the OpenAPI v3.1\n> speciifcation; {@link OpenApiV3_1.IJsonSchema}.\n> \n> However, the `IChatGptSchema` does not follow the entire specification of\n> the OpenAPI v3.1. It has own specific restrictions and definitions. Here is the\n> list of how `IChatGptSchema` is different with the OpenAPI v3.1 JSON schema.\n> \n> - Decompose mixed type: {@link OpenApiV3_1.IJsonSchema.IMixed}\n> - Resolve nullable property: {@link OpenApiV3_1.IJsonSchema.__ISignificant.nullable}\n> - Tuple type is banned: {@link OpenApiV3_1.IJsonSchema.ITuple.prefixItems}\n> - Constant type is banned: {@link OpenApiV3_1.IJsonSchema.IConstant}\n> - Merge {@link OpenApiV3_1.IJsonSchema.IOneOf} to {@link IChatGptSchema.IAnOf}\n> - Merge {@link OpenApiV3_1.IJsonSchema.IAllOf} to {@link IChatGptSchema.IObject}\n> - Merge {@link OpenApiV3_1.IJsonSchema.IRecursiveReference} to {@link IChatGptSchema.IReference}\n> - When {@link IChatGptSchema.IConfig.strict} mode\n>   - Every object properties must be required\n>   - Do not allow {@link IChatGptSchema.IObject.additionalProperties}\n> \n> If compare with the {@link OpenApi.IJsonSchema}, the emended JSON schema specification,\n> \n> - {@link IChatGptSchema.IAnyOf} instead of the {@link OpenApi.IJsonSchema.IOneOf}\n> - {@link IChatGptSchema.IParameters.$defs} instead of the {@link OpenApi.IJsonSchema.IComponents.schemas}\n> - {@link IChatGptSchema.IString.enum} instead of the {@link OpenApi.IJsonSchema.IConstant}\n> - {@link IChatGptSchema.additionalProperties} is fixed to `false`\n> - No tuple type {@link OpenApi.IJsonSchema.ITuple} support\n> - When {@link IChatGptSchema.IConfig.strict} mode\n>   - Every object properties must be required\n>   - Do not allow {@link IChatGptSchema.IObject.additionalProperties}\n> \n> For reference, if you've composed the `IChatGptSchema` type with the\n> {@link IChatGptSchema.IConfig.reference} `false` option (default is `false`),\n> only the recursived named types would be archived into the\n> {@link IChatGptSchema.IParameters.$defs}, and the others would be ecaped from the\n> {@link IChatGptSchema.IReference} type.\n> \n> Also, ChatGPT has banned below constraint properties. Instead, I'll will\n> fill the {@link IChatGptSchema.__IAttribute.description} property with\n> the comment text like `\"@format uuid\"`.\n> \n> - {@link OpenApi.IJsonSchema.INumber.minimum}\n> - {@link OpenApi.IJsonSchema.INumber.maximum}\n> - {@link OpenApi.IJsonSchema.INumber.multipleOf}\n> - {@link OpenApi.IJsonSchema.IString.minLength}\n> - {@link OpenApi.IJsonSchema.IString.maxLength}\n> - {@link OpenApi.IJsonSchema.IString.format}\n> - {@link OpenApi.IJsonSchema.IString.pattern}\n> - {@link OpenApi.IJsonSchema.IString.contentMediaType}\n> - {@link OpenApi.IJsonSchema.IString.default}\n> - {@link OpenApi.IJsonSchema.IArray.minItems}\n> - {@link OpenApi.IJsonSchema.IArray.maxItems}\n> - {@link OpenApi.IJsonSchema.IArray.unique}"
                                    },
                                    {
                                        $ref: "#/$defs/IChatGptSchema.IArray"
                                    },
                                    {
                                        type: "object",
                                        properties: {
                                            $ref: {
                                                title: "Reference to the named schema",
                                                description: "Reference to the named schema.\n\nThe `ref` is a reference to the named schema. Format of the `$ref` is\nfollowing the JSON Pointer specification. In the OpenAPI, the `$ref`\nstarts with `#/$defs/` which means the type is stored in\nthe {@link IChatGptSchema.IParameters.$defs} object.\n\n- `#/$defs/SomeObject`\n- `#/$defs/AnotherObject`",
                                                type: "string"
                                            },
                                            title: {
                                                title: "Title of the schema",
                                                description: "Title of the schema.",
                                                type: "string"
                                            },
                                            description: {
                                                title: "Detailed description of the schema",
                                                description: "Detailed description of the schema.",
                                                type: "string"
                                            },
                                            deprecated: {
                                                title: "Whether the type is deprecated or not",
                                                description: "Whether the type is deprecated or not.",
                                                type: "boolean"
                                            },
                                            example: {
                                                title: "Example value",
                                                description: "Example value."
                                            },
                                            examples: {
                                                description: "Construct a type with a set of properties K of type T",
                                                type: "object",
                                                properties: {},
                                                required: [],
                                                additionalProperties: {}
                                            }
                                        },
                                        required: [
                                            "$ref"
                                        ],
                                        description: "Reference type directing named schema.\n\n------------------------------\n\nDescription of the current {@link IChatGptSchema.IReference} type:\n\n> Reference type directing named schema.\n\n------------------------------\n\nDescription of the parent {@link IChatGptSchema} type:\n\n> Type schema info of the ChatGPT.\n> \n> `IChatGptSchema` is a type schema info of the ChatGPT function calling.\n> \n> `IChatGptSchema` basically follows the JSON schema definition of the OpenAPI v3.1\n> speciifcation; {@link OpenApiV3_1.IJsonSchema}.\n> \n> However, the `IChatGptSchema` does not follow the entire specification of\n> the OpenAPI v3.1. It has own specific restrictions and definitions. Here is the\n> list of how `IChatGptSchema` is different with the OpenAPI v3.1 JSON schema.\n> \n> - Decompose mixed type: {@link OpenApiV3_1.IJsonSchema.IMixed}\n> - Resolve nullable property: {@link OpenApiV3_1.IJsonSchema.__ISignificant.nullable}\n> - Tuple type is banned: {@link OpenApiV3_1.IJsonSchema.ITuple.prefixItems}\n> - Constant type is banned: {@link OpenApiV3_1.IJsonSchema.IConstant}\n> - Merge {@link OpenApiV3_1.IJsonSchema.IOneOf} to {@link IChatGptSchema.IAnOf}\n> - Merge {@link OpenApiV3_1.IJsonSchema.IAllOf} to {@link IChatGptSchema.IObject}\n> - Merge {@link OpenApiV3_1.IJsonSchema.IRecursiveReference} to {@link IChatGptSchema.IReference}\n> - When {@link IChatGptSchema.IConfig.strict} mode\n>   - Every object properties must be required\n>   - Do not allow {@link IChatGptSchema.IObject.additionalProperties}\n> \n> If compare with the {@link OpenApi.IJsonSchema}, the emended JSON schema specification,\n> \n> - {@link IChatGptSchema.IAnyOf} instead of the {@link OpenApi.IJsonSchema.IOneOf}\n> - {@link IChatGptSchema.IParameters.$defs} instead of the {@link OpenApi.IJsonSchema.IComponents.schemas}\n> - {@link IChatGptSchema.IString.enum} instead of the {@link OpenApi.IJsonSchema.IConstant}\n> - {@link IChatGptSchema.additionalProperties} is fixed to `false`\n> - No tuple type {@link OpenApi.IJsonSchema.ITuple} support\n> - When {@link IChatGptSchema.IConfig.strict} mode\n>   - Every object properties must be required\n>   - Do not allow {@link IChatGptSchema.IObject.additionalProperties}\n> \n> For reference, if you've composed the `IChatGptSchema` type with the\n> {@link IChatGptSchema.IConfig.reference} `false` option (default is `false`),\n> only the recursived named types would be archived into the\n> {@link IChatGptSchema.IParameters.$defs}, and the others would be ecaped from the\n> {@link IChatGptSchema.IReference} type.\n> \n> Also, ChatGPT has banned below constraint properties. Instead, I'll will\n> fill the {@link IChatGptSchema.__IAttribute.description} property with\n> the comment text like `\"@format uuid\"`.\n> \n> - {@link OpenApi.IJsonSchema.INumber.minimum}\n> - {@link OpenApi.IJsonSchema.INumber.maximum}\n> - {@link OpenApi.IJsonSchema.INumber.multipleOf}\n> - {@link OpenApi.IJsonSchema.IString.minLength}\n> - {@link OpenApi.IJsonSchema.IString.maxLength}\n> - {@link OpenApi.IJsonSchema.IString.format}\n> - {@link OpenApi.IJsonSchema.IString.pattern}\n> - {@link OpenApi.IJsonSchema.IString.contentMediaType}\n> - {@link OpenApi.IJsonSchema.IString.default}\n> - {@link OpenApi.IJsonSchema.IArray.minItems}\n> - {@link OpenApi.IJsonSchema.IArray.maxItems}\n> - {@link OpenApi.IJsonSchema.IArray.unique}"
                                    },
                                    {
                                        $ref: "#/$defs/IChatGptSchema.IAnyOf"
                                    },
                                    {
                                        type: "object",
                                        properties: {
                                            title: {
                                                title: "Title of the schema",
                                                description: "Title of the schema.",
                                                type: "string"
                                            },
                                            description: {
                                                title: "Detailed description of the schema",
                                                description: "Detailed description of the schema.",
                                                type: "string"
                                            },
                                            deprecated: {
                                                title: "Whether the type is deprecated or not",
                                                description: "Whether the type is deprecated or not.",
                                                type: "boolean"
                                            },
                                            example: {
                                                title: "Example value",
                                                description: "Example value."
                                            },
                                            examples: {
                                                description: "Construct a type with a set of properties K of type T",
                                                type: "object",
                                                properties: {},
                                                required: [],
                                                additionalProperties: {}
                                            }
                                        },
                                        required: [],
                                        description: "Unknown, the `any` type.\n\n------------------------------\n\nDescription of the current {@link IChatGptSchema.IUnknown} type:\n\n> Unknown, the `any` type.\n\n------------------------------\n\nDescription of the parent {@link IChatGptSchema} type:\n\n> Type schema info of the ChatGPT.\n> \n> `IChatGptSchema` is a type schema info of the ChatGPT function calling.\n> \n> `IChatGptSchema` basically follows the JSON schema definition of the OpenAPI v3.1\n> speciifcation; {@link OpenApiV3_1.IJsonSchema}.\n> \n> However, the `IChatGptSchema` does not follow the entire specification of\n> the OpenAPI v3.1. It has own specific restrictions and definitions. Here is the\n> list of how `IChatGptSchema` is different with the OpenAPI v3.1 JSON schema.\n> \n> - Decompose mixed type: {@link OpenApiV3_1.IJsonSchema.IMixed}\n> - Resolve nullable property: {@link OpenApiV3_1.IJsonSchema.__ISignificant.nullable}\n> - Tuple type is banned: {@link OpenApiV3_1.IJsonSchema.ITuple.prefixItems}\n> - Constant type is banned: {@link OpenApiV3_1.IJsonSchema.IConstant}\n> - Merge {@link OpenApiV3_1.IJsonSchema.IOneOf} to {@link IChatGptSchema.IAnOf}\n> - Merge {@link OpenApiV3_1.IJsonSchema.IAllOf} to {@link IChatGptSchema.IObject}\n> - Merge {@link OpenApiV3_1.IJsonSchema.IRecursiveReference} to {@link IChatGptSchema.IReference}\n> - When {@link IChatGptSchema.IConfig.strict} mode\n>   - Every object properties must be required\n>   - Do not allow {@link IChatGptSchema.IObject.additionalProperties}\n> \n> If compare with the {@link OpenApi.IJsonSchema}, the emended JSON schema specification,\n> \n> - {@link IChatGptSchema.IAnyOf} instead of the {@link OpenApi.IJsonSchema.IOneOf}\n> - {@link IChatGptSchema.IParameters.$defs} instead of the {@link OpenApi.IJsonSchema.IComponents.schemas}\n> - {@link IChatGptSchema.IString.enum} instead of the {@link OpenApi.IJsonSchema.IConstant}\n> - {@link IChatGptSchema.additionalProperties} is fixed to `false`\n> - No tuple type {@link OpenApi.IJsonSchema.ITuple} support\n> - When {@link IChatGptSchema.IConfig.strict} mode\n>   - Every object properties must be required\n>   - Do not allow {@link IChatGptSchema.IObject.additionalProperties}\n> \n> For reference, if you've composed the `IChatGptSchema` type with the\n> {@link IChatGptSchema.IConfig.reference} `false` option (default is `false`),\n> only the recursived named types would be archived into the\n> {@link IChatGptSchema.IParameters.$defs}, and the others would be ecaped from the\n> {@link IChatGptSchema.IReference} type.\n> \n> Also, ChatGPT has banned below constraint properties. Instead, I'll will\n> fill the {@link IChatGptSchema.__IAttribute.description} property with\n> the comment text like `\"@format uuid\"`.\n> \n> - {@link OpenApi.IJsonSchema.INumber.minimum}\n> - {@link OpenApi.IJsonSchema.INumber.maximum}\n> - {@link OpenApi.IJsonSchema.INumber.multipleOf}\n> - {@link OpenApi.IJsonSchema.IString.minLength}\n> - {@link OpenApi.IJsonSchema.IString.maxLength}\n> - {@link OpenApi.IJsonSchema.IString.format}\n> - {@link OpenApi.IJsonSchema.IString.pattern}\n> - {@link OpenApi.IJsonSchema.IString.contentMediaType}\n> - {@link OpenApi.IJsonSchema.IString.default}\n> - {@link OpenApi.IJsonSchema.IArray.minItems}\n> - {@link OpenApi.IJsonSchema.IArray.maxItems}\n> - {@link OpenApi.IJsonSchema.IArray.unique}"
                                    },
                                    {
                                        type: "object",
                                        properties: {
                                            type: {
                                                title: "Discriminator value of the type",
                                                type: "string",
                                                "enum": [
                                                    "null"
                                                ]
                                            },
                                            title: {
                                                title: "Title of the schema",
                                                description: "Title of the schema.",
                                                type: "string"
                                            },
                                            description: {
                                                title: "Detailed description of the schema",
                                                description: "Detailed description of the schema.",
                                                type: "string"
                                            },
                                            deprecated: {
                                                title: "Whether the type is deprecated or not",
                                                description: "Whether the type is deprecated or not.",
                                                type: "boolean"
                                            },
                                            example: {
                                                title: "Example value",
                                                description: "Example value."
                                            },
                                            examples: {
                                                description: "Construct a type with a set of properties K of type T",
                                                type: "object",
                                                properties: {},
                                                required: [],
                                                additionalProperties: {}
                                            }
                                        },
                                        required: [
                                            "type"
                                        ],
                                        description: "Null type.\n\n------------------------------\n\nDescription of the current {@link IChatGptSchema.INull} type:\n\n> Null type.\n\n------------------------------\n\nDescription of the parent {@link IChatGptSchema} type:\n\n> Type schema info of the ChatGPT.\n> \n> `IChatGptSchema` is a type schema info of the ChatGPT function calling.\n> \n> `IChatGptSchema` basically follows the JSON schema definition of the OpenAPI v3.1\n> speciifcation; {@link OpenApiV3_1.IJsonSchema}.\n> \n> However, the `IChatGptSchema` does not follow the entire specification of\n> the OpenAPI v3.1. It has own specific restrictions and definitions. Here is the\n> list of how `IChatGptSchema` is different with the OpenAPI v3.1 JSON schema.\n> \n> - Decompose mixed type: {@link OpenApiV3_1.IJsonSchema.IMixed}\n> - Resolve nullable property: {@link OpenApiV3_1.IJsonSchema.__ISignificant.nullable}\n> - Tuple type is banned: {@link OpenApiV3_1.IJsonSchema.ITuple.prefixItems}\n> - Constant type is banned: {@link OpenApiV3_1.IJsonSchema.IConstant}\n> - Merge {@link OpenApiV3_1.IJsonSchema.IOneOf} to {@link IChatGptSchema.IAnOf}\n> - Merge {@link OpenApiV3_1.IJsonSchema.IAllOf} to {@link IChatGptSchema.IObject}\n> - Merge {@link OpenApiV3_1.IJsonSchema.IRecursiveReference} to {@link IChatGptSchema.IReference}\n> - When {@link IChatGptSchema.IConfig.strict} mode\n>   - Every object properties must be required\n>   - Do not allow {@link IChatGptSchema.IObject.additionalProperties}\n> \n> If compare with the {@link OpenApi.IJsonSchema}, the emended JSON schema specification,\n> \n> - {@link IChatGptSchema.IAnyOf} instead of the {@link OpenApi.IJsonSchema.IOneOf}\n> - {@link IChatGptSchema.IParameters.$defs} instead of the {@link OpenApi.IJsonSchema.IComponents.schemas}\n> - {@link IChatGptSchema.IString.enum} instead of the {@link OpenApi.IJsonSchema.IConstant}\n> - {@link IChatGptSchema.additionalProperties} is fixed to `false`\n> - No tuple type {@link OpenApi.IJsonSchema.ITuple} support\n> - When {@link IChatGptSchema.IConfig.strict} mode\n>   - Every object properties must be required\n>   - Do not allow {@link IChatGptSchema.IObject.additionalProperties}\n> \n> For reference, if you've composed the `IChatGptSchema` type with the\n> {@link IChatGptSchema.IConfig.reference} `false` option (default is `false`),\n> only the recursived named types would be archived into the\n> {@link IChatGptSchema.IParameters.$defs}, and the others would be ecaped from the\n> {@link IChatGptSchema.IReference} type.\n> \n> Also, ChatGPT has banned below constraint properties. Instead, I'll will\n> fill the {@link IChatGptSchema.__IAttribute.description} property with\n> the comment text like `\"@format uuid\"`.\n> \n> - {@link OpenApi.IJsonSchema.INumber.minimum}\n> - {@link OpenApi.IJsonSchema.INumber.maximum}\n> - {@link OpenApi.IJsonSchema.INumber.multipleOf}\n> - {@link OpenApi.IJsonSchema.IString.minLength}\n> - {@link OpenApi.IJsonSchema.IString.maxLength}\n> - {@link OpenApi.IJsonSchema.IString.format}\n> - {@link OpenApi.IJsonSchema.IString.pattern}\n> - {@link OpenApi.IJsonSchema.IString.contentMediaType}\n> - {@link OpenApi.IJsonSchema.IString.default}\n> - {@link OpenApi.IJsonSchema.IArray.minItems}\n> - {@link OpenApi.IJsonSchema.IArray.maxItems}\n> - {@link OpenApi.IJsonSchema.IArray.unique}"
                                    }
                                ]
                            },
                            required: {
                                title: "List of key values of the required properties",
                                description: "List of key values of the required properties.\n\nThe `required` means a list of the key values of the required\n{@link properties}. If some property key is not listed in the `required`\nlist, it means that property is optional. Otherwise some property key\nexists in the `required` list, it means that the property must be filled.\n\nBelow is an example of the {@link properties} and `required`.\n\n```typescript\ninterface SomeObject {\n  id: string;\n  email: string;\n  name?: string;\n}\n```\n\nAs you can see, `id` and `email` {@link properties} are {@link required},\nso that they are listed in the `required` list.\n\n```json\n{\n  \"type\": \"object\",\n  \"properties\": {\n    \"id\": { \"type\": \"string\" },\n    \"email\": { \"type\": \"string\" },\n    \"name\": { \"type\": \"string\" }\n  },\n  \"required\": [\"id\", \"email\"]\n}\n```",
                                type: "array",
                                items: {
                                    type: "string"
                                }
                            },
                            type: {
                                title: "Discriminator value of the type",
                                type: "string",
                                "enum": [
                                    "object"
                                ]
                            },
                            title: {
                                title: "Title of the schema",
                                description: "Title of the schema.",
                                type: "string"
                            },
                            description: {
                                title: "Detailed description of the schema",
                                description: "Detailed description of the schema.",
                                type: "string"
                            },
                            deprecated: {
                                title: "Whether the type is deprecated or not",
                                description: "Whether the type is deprecated or not.",
                                type: "boolean"
                            },
                            example: {
                                title: "Example value",
                                description: "Example value."
                            },
                            examples: {
                                description: "Construct a type with a set of properties K of type T",
                                type: "object",
                                properties: {},
                                required: [],
                                additionalProperties: {}
                            }
                        },
                        required: [
                            "properties",
                            "required",
                            "type"
                        ]
                    },
                    "IChatGptSchema.IArray": {
                        description: "Array type info.",
                        type: "object",
                        properties: {
                            items: {
                                title: "Items type info",
                                $ref: "#/$defs/IChatGptSchema"
                            },
                            type: {
                                title: "Discriminator value of the type",
                                type: "string",
                                "enum": [
                                    "array"
                                ]
                            },
                            title: {
                                title: "Title of the schema",
                                description: "Title of the schema.",
                                type: "string"
                            },
                            description: {
                                title: "Detailed description of the schema",
                                description: "Detailed description of the schema.",
                                type: "string"
                            },
                            deprecated: {
                                title: "Whether the type is deprecated or not",
                                description: "Whether the type is deprecated or not.",
                                type: "boolean"
                            },
                            example: {
                                title: "Example value",
                                description: "Example value."
                            },
                            examples: {
                                description: "Construct a type with a set of properties K of type T",
                                type: "object",
                                properties: {},
                                required: [],
                                additionalProperties: {}
                            }
                        },
                        required: [
                            "items",
                            "type"
                        ]
                    },
                    "IChatGptSchema.IAnyOf": {
                        description: "Union type.\n\nIOneOf` represents an union type of the TypeScript (`A | B | C`).\n\nFor reference, even though your Swagger (or OpenAPI) document has\ndefined `anyOf` instead of the `oneOf`, {@link IChatGptSchema} forcibly\nconverts it to `oneOf` type.",
                        type: "object",
                        properties: {
                            anyOf: {
                                title: "List of the union types",
                                description: "List of the union types.",
                                type: "array",
                                items: {
                                    anyOf: [
                                        {
                                            $ref: "#/$defs/IChatGptSchema.IObject"
                                        },
                                        {
                                            type: "object",
                                            properties: {
                                                "enum": {
                                                    title: "Enumeration values",
                                                    description: "Enumeration values.",
                                                    type: "array",
                                                    items: {
                                                        type: "string"
                                                    }
                                                },
                                                type: {
                                                    title: "Discriminator value of the type",
                                                    type: "string",
                                                    "enum": [
                                                        "string"
                                                    ]
                                                },
                                                title: {
                                                    title: "Title of the schema",
                                                    description: "Title of the schema.",
                                                    type: "string"
                                                },
                                                description: {
                                                    title: "Detailed description of the schema",
                                                    description: "Detailed description of the schema.",
                                                    type: "string"
                                                },
                                                deprecated: {
                                                    title: "Whether the type is deprecated or not",
                                                    description: "Whether the type is deprecated or not.",
                                                    type: "boolean"
                                                },
                                                example: {
                                                    title: "Example value",
                                                    description: "Example value."
                                                },
                                                examples: {
                                                    description: "Construct a type with a set of properties K of type T",
                                                    type: "object",
                                                    properties: {},
                                                    required: [],
                                                    additionalProperties: {}
                                                }
                                            },
                                            required: [
                                                "type"
                                            ],
                                            description: "String type info.\n\n------------------------------\n\nDescription of the current {@link IChatGptSchema.IString} type:\n\n> String type info.\n\n------------------------------\n\nDescription of the parent {@link IChatGptSchema} type:\n\n> Type schema info of the ChatGPT.\n> \n> `IChatGptSchema` is a type schema info of the ChatGPT function calling.\n> \n> `IChatGptSchema` basically follows the JSON schema definition of the OpenAPI v3.1\n> speciifcation; {@link OpenApiV3_1.IJsonSchema}.\n> \n> However, the `IChatGptSchema` does not follow the entire specification of\n> the OpenAPI v3.1. It has own specific restrictions and definitions. Here is the\n> list of how `IChatGptSchema` is different with the OpenAPI v3.1 JSON schema.\n> \n> - Decompose mixed type: {@link OpenApiV3_1.IJsonSchema.IMixed}\n> - Resolve nullable property: {@link OpenApiV3_1.IJsonSchema.__ISignificant.nullable}\n> - Tuple type is banned: {@link OpenApiV3_1.IJsonSchema.ITuple.prefixItems}\n> - Constant type is banned: {@link OpenApiV3_1.IJsonSchema.IConstant}\n> - Merge {@link OpenApiV3_1.IJsonSchema.IOneOf} to {@link IChatGptSchema.IAnOf}\n> - Merge {@link OpenApiV3_1.IJsonSchema.IAllOf} to {@link IChatGptSchema.IObject}\n> - Merge {@link OpenApiV3_1.IJsonSchema.IRecursiveReference} to {@link IChatGptSchema.IReference}\n> - When {@link IChatGptSchema.IConfig.strict} mode\n>   - Every object properties must be required\n>   - Do not allow {@link IChatGptSchema.IObject.additionalProperties}\n> \n> If compare with the {@link OpenApi.IJsonSchema}, the emended JSON schema specification,\n> \n> - {@link IChatGptSchema.IAnyOf} instead of the {@link OpenApi.IJsonSchema.IOneOf}\n> - {@link IChatGptSchema.IParameters.$defs} instead of the {@link OpenApi.IJsonSchema.IComponents.schemas}\n> - {@link IChatGptSchema.IString.enum} instead of the {@link OpenApi.IJsonSchema.IConstant}\n> - {@link IChatGptSchema.additionalProperties} is fixed to `false`\n> - No tuple type {@link OpenApi.IJsonSchema.ITuple} support\n> - When {@link IChatGptSchema.IConfig.strict} mode\n>   - Every object properties must be required\n>   - Do not allow {@link IChatGptSchema.IObject.additionalProperties}\n> \n> For reference, if you've composed the `IChatGptSchema` type with the\n> {@link IChatGptSchema.IConfig.reference} `false` option (default is `false`),\n> only the recursived named types would be archived into the\n> {@link IChatGptSchema.IParameters.$defs}, and the others would be ecaped from the\n> {@link IChatGptSchema.IReference} type.\n> \n> Also, ChatGPT has banned below constraint properties. Instead, I'll will\n> fill the {@link IChatGptSchema.__IAttribute.description} property with\n> the comment text like `\"@format uuid\"`.\n> \n> - {@link OpenApi.IJsonSchema.INumber.minimum}\n> - {@link OpenApi.IJsonSchema.INumber.maximum}\n> - {@link OpenApi.IJsonSchema.INumber.multipleOf}\n> - {@link OpenApi.IJsonSchema.IString.minLength}\n> - {@link OpenApi.IJsonSchema.IString.maxLength}\n> - {@link OpenApi.IJsonSchema.IString.format}\n> - {@link OpenApi.IJsonSchema.IString.pattern}\n> - {@link OpenApi.IJsonSchema.IString.contentMediaType}\n> - {@link OpenApi.IJsonSchema.IString.default}\n> - {@link OpenApi.IJsonSchema.IArray.minItems}\n> - {@link OpenApi.IJsonSchema.IArray.maxItems}\n> - {@link OpenApi.IJsonSchema.IArray.unique}"
                                        },
                                        {
                                            type: "object",
                                            properties: {
                                                "enum": {
                                                    title: "Enumeration values",
                                                    description: "Enumeration values.",
                                                    type: "array",
                                                    items: {
                                                        type: "number"
                                                    }
                                                },
                                                type: {
                                                    title: "Discriminator value of the type",
                                                    type: "string",
                                                    "enum": [
                                                        "number"
                                                    ]
                                                },
                                                title: {
                                                    title: "Title of the schema",
                                                    description: "Title of the schema.",
                                                    type: "string"
                                                },
                                                description: {
                                                    title: "Detailed description of the schema",
                                                    description: "Detailed description of the schema.",
                                                    type: "string"
                                                },
                                                deprecated: {
                                                    title: "Whether the type is deprecated or not",
                                                    description: "Whether the type is deprecated or not.",
                                                    type: "boolean"
                                                },
                                                example: {
                                                    title: "Example value",
                                                    description: "Example value."
                                                },
                                                examples: {
                                                    description: "Construct a type with a set of properties K of type T",
                                                    type: "object",
                                                    properties: {},
                                                    required: [],
                                                    additionalProperties: {}
                                                }
                                            },
                                            required: [
                                                "type"
                                            ],
                                            description: "Number (double) type info.\n\n------------------------------\n\nDescription of the current {@link IChatGptSchema.INumber} type:\n\n> Number (double) type info.\n\n------------------------------\n\nDescription of the parent {@link IChatGptSchema} type:\n\n> Type schema info of the ChatGPT.\n> \n> `IChatGptSchema` is a type schema info of the ChatGPT function calling.\n> \n> `IChatGptSchema` basically follows the JSON schema definition of the OpenAPI v3.1\n> speciifcation; {@link OpenApiV3_1.IJsonSchema}.\n> \n> However, the `IChatGptSchema` does not follow the entire specification of\n> the OpenAPI v3.1. It has own specific restrictions and definitions. Here is the\n> list of how `IChatGptSchema` is different with the OpenAPI v3.1 JSON schema.\n> \n> - Decompose mixed type: {@link OpenApiV3_1.IJsonSchema.IMixed}\n> - Resolve nullable property: {@link OpenApiV3_1.IJsonSchema.__ISignificant.nullable}\n> - Tuple type is banned: {@link OpenApiV3_1.IJsonSchema.ITuple.prefixItems}\n> - Constant type is banned: {@link OpenApiV3_1.IJsonSchema.IConstant}\n> - Merge {@link OpenApiV3_1.IJsonSchema.IOneOf} to {@link IChatGptSchema.IAnOf}\n> - Merge {@link OpenApiV3_1.IJsonSchema.IAllOf} to {@link IChatGptSchema.IObject}\n> - Merge {@link OpenApiV3_1.IJsonSchema.IRecursiveReference} to {@link IChatGptSchema.IReference}\n> - When {@link IChatGptSchema.IConfig.strict} mode\n>   - Every object properties must be required\n>   - Do not allow {@link IChatGptSchema.IObject.additionalProperties}\n> \n> If compare with the {@link OpenApi.IJsonSchema}, the emended JSON schema specification,\n> \n> - {@link IChatGptSchema.IAnyOf} instead of the {@link OpenApi.IJsonSchema.IOneOf}\n> - {@link IChatGptSchema.IParameters.$defs} instead of the {@link OpenApi.IJsonSchema.IComponents.schemas}\n> - {@link IChatGptSchema.IString.enum} instead of the {@link OpenApi.IJsonSchema.IConstant}\n> - {@link IChatGptSchema.additionalProperties} is fixed to `false`\n> - No tuple type {@link OpenApi.IJsonSchema.ITuple} support\n> - When {@link IChatGptSchema.IConfig.strict} mode\n>   - Every object properties must be required\n>   - Do not allow {@link IChatGptSchema.IObject.additionalProperties}\n> \n> For reference, if you've composed the `IChatGptSchema` type with the\n> {@link IChatGptSchema.IConfig.reference} `false` option (default is `false`),\n> only the recursived named types would be archived into the\n> {@link IChatGptSchema.IParameters.$defs}, and the others would be ecaped from the\n> {@link IChatGptSchema.IReference} type.\n> \n> Also, ChatGPT has banned below constraint properties. Instead, I'll will\n> fill the {@link IChatGptSchema.__IAttribute.description} property with\n> the comment text like `\"@format uuid\"`.\n> \n> - {@link OpenApi.IJsonSchema.INumber.minimum}\n> - {@link OpenApi.IJsonSchema.INumber.maximum}\n> - {@link OpenApi.IJsonSchema.INumber.multipleOf}\n> - {@link OpenApi.IJsonSchema.IString.minLength}\n> - {@link OpenApi.IJsonSchema.IString.maxLength}\n> - {@link OpenApi.IJsonSchema.IString.format}\n> - {@link OpenApi.IJsonSchema.IString.pattern}\n> - {@link OpenApi.IJsonSchema.IString.contentMediaType}\n> - {@link OpenApi.IJsonSchema.IString.default}\n> - {@link OpenApi.IJsonSchema.IArray.minItems}\n> - {@link OpenApi.IJsonSchema.IArray.maxItems}\n> - {@link OpenApi.IJsonSchema.IArray.unique}"
                                        },
                                        {
                                            type: "object",
                                            properties: {
                                                "enum": {
                                                    title: "Enumeration values",
                                                    description: "Enumeration values.",
                                                    type: "array",
                                                    items: {
                                                        type: "number"
                                                    }
                                                },
                                                type: {
                                                    title: "Discriminator value of the type",
                                                    type: "string",
                                                    "enum": [
                                                        "integer"
                                                    ]
                                                },
                                                title: {
                                                    title: "Title of the schema",
                                                    description: "Title of the schema.",
                                                    type: "string"
                                                },
                                                description: {
                                                    title: "Detailed description of the schema",
                                                    description: "Detailed description of the schema.",
                                                    type: "string"
                                                },
                                                deprecated: {
                                                    title: "Whether the type is deprecated or not",
                                                    description: "Whether the type is deprecated or not.",
                                                    type: "boolean"
                                                },
                                                example: {
                                                    title: "Example value",
                                                    description: "Example value."
                                                },
                                                examples: {
                                                    description: "Construct a type with a set of properties K of type T",
                                                    type: "object",
                                                    properties: {},
                                                    required: [],
                                                    additionalProperties: {}
                                                }
                                            },
                                            required: [
                                                "type"
                                            ],
                                            description: "Integer type info.\n\n------------------------------\n\nDescription of the current {@link IChatGptSchema.IInteger} type:\n\n> Integer type info.\n\n------------------------------\n\nDescription of the parent {@link IChatGptSchema} type:\n\n> Type schema info of the ChatGPT.\n> \n> `IChatGptSchema` is a type schema info of the ChatGPT function calling.\n> \n> `IChatGptSchema` basically follows the JSON schema definition of the OpenAPI v3.1\n> speciifcation; {@link OpenApiV3_1.IJsonSchema}.\n> \n> However, the `IChatGptSchema` does not follow the entire specification of\n> the OpenAPI v3.1. It has own specific restrictions and definitions. Here is the\n> list of how `IChatGptSchema` is different with the OpenAPI v3.1 JSON schema.\n> \n> - Decompose mixed type: {@link OpenApiV3_1.IJsonSchema.IMixed}\n> - Resolve nullable property: {@link OpenApiV3_1.IJsonSchema.__ISignificant.nullable}\n> - Tuple type is banned: {@link OpenApiV3_1.IJsonSchema.ITuple.prefixItems}\n> - Constant type is banned: {@link OpenApiV3_1.IJsonSchema.IConstant}\n> - Merge {@link OpenApiV3_1.IJsonSchema.IOneOf} to {@link IChatGptSchema.IAnOf}\n> - Merge {@link OpenApiV3_1.IJsonSchema.IAllOf} to {@link IChatGptSchema.IObject}\n> - Merge {@link OpenApiV3_1.IJsonSchema.IRecursiveReference} to {@link IChatGptSchema.IReference}\n> - When {@link IChatGptSchema.IConfig.strict} mode\n>   - Every object properties must be required\n>   - Do not allow {@link IChatGptSchema.IObject.additionalProperties}\n> \n> If compare with the {@link OpenApi.IJsonSchema}, the emended JSON schema specification,\n> \n> - {@link IChatGptSchema.IAnyOf} instead of the {@link OpenApi.IJsonSchema.IOneOf}\n> - {@link IChatGptSchema.IParameters.$defs} instead of the {@link OpenApi.IJsonSchema.IComponents.schemas}\n> - {@link IChatGptSchema.IString.enum} instead of the {@link OpenApi.IJsonSchema.IConstant}\n> - {@link IChatGptSchema.additionalProperties} is fixed to `false`\n> - No tuple type {@link OpenApi.IJsonSchema.ITuple} support\n> - When {@link IChatGptSchema.IConfig.strict} mode\n>   - Every object properties must be required\n>   - Do not allow {@link IChatGptSchema.IObject.additionalProperties}\n> \n> For reference, if you've composed the `IChatGptSchema` type with the\n> {@link IChatGptSchema.IConfig.reference} `false` option (default is `false`),\n> only the recursived named types would be archived into the\n> {@link IChatGptSchema.IParameters.$defs}, and the others would be ecaped from the\n> {@link IChatGptSchema.IReference} type.\n> \n> Also, ChatGPT has banned below constraint properties. Instead, I'll will\n> fill the {@link IChatGptSchema.__IAttribute.description} property with\n> the comment text like `\"@format uuid\"`.\n> \n> - {@link OpenApi.IJsonSchema.INumber.minimum}\n> - {@link OpenApi.IJsonSchema.INumber.maximum}\n> - {@link OpenApi.IJsonSchema.INumber.multipleOf}\n> - {@link OpenApi.IJsonSchema.IString.minLength}\n> - {@link OpenApi.IJsonSchema.IString.maxLength}\n> - {@link OpenApi.IJsonSchema.IString.format}\n> - {@link OpenApi.IJsonSchema.IString.pattern}\n> - {@link OpenApi.IJsonSchema.IString.contentMediaType}\n> - {@link OpenApi.IJsonSchema.IString.default}\n> - {@link OpenApi.IJsonSchema.IArray.minItems}\n> - {@link OpenApi.IJsonSchema.IArray.maxItems}\n> - {@link OpenApi.IJsonSchema.IArray.unique}"
                                        },
                                        {
                                            type: "object",
                                            properties: {
                                                "enum": {
                                                    title: "Enumeration values",
                                                    description: "Enumeration values.",
                                                    type: "array",
                                                    items: {
                                                        type: "boolean"
                                                    }
                                                },
                                                type: {
                                                    title: "Discriminator value of the type",
                                                    type: "string",
                                                    "enum": [
                                                        "boolean"
                                                    ]
                                                },
                                                title: {
                                                    title: "Title of the schema",
                                                    description: "Title of the schema.",
                                                    type: "string"
                                                },
                                                description: {
                                                    title: "Detailed description of the schema",
                                                    description: "Detailed description of the schema.",
                                                    type: "string"
                                                },
                                                deprecated: {
                                                    title: "Whether the type is deprecated or not",
                                                    description: "Whether the type is deprecated or not.",
                                                    type: "boolean"
                                                },
                                                example: {
                                                    title: "Example value",
                                                    description: "Example value."
                                                },
                                                examples: {
                                                    description: "Construct a type with a set of properties K of type T",
                                                    type: "object",
                                                    properties: {},
                                                    required: [],
                                                    additionalProperties: {}
                                                }
                                            },
                                            required: [
                                                "type"
                                            ],
                                            description: "Boolean type info.\n\n------------------------------\n\nDescription of the current {@link IChatGptSchema.IBoolean} type:\n\n> Boolean type info.\n\n------------------------------\n\nDescription of the parent {@link IChatGptSchema} type:\n\n> Type schema info of the ChatGPT.\n> \n> `IChatGptSchema` is a type schema info of the ChatGPT function calling.\n> \n> `IChatGptSchema` basically follows the JSON schema definition of the OpenAPI v3.1\n> speciifcation; {@link OpenApiV3_1.IJsonSchema}.\n> \n> However, the `IChatGptSchema` does not follow the entire specification of\n> the OpenAPI v3.1. It has own specific restrictions and definitions. Here is the\n> list of how `IChatGptSchema` is different with the OpenAPI v3.1 JSON schema.\n> \n> - Decompose mixed type: {@link OpenApiV3_1.IJsonSchema.IMixed}\n> - Resolve nullable property: {@link OpenApiV3_1.IJsonSchema.__ISignificant.nullable}\n> - Tuple type is banned: {@link OpenApiV3_1.IJsonSchema.ITuple.prefixItems}\n> - Constant type is banned: {@link OpenApiV3_1.IJsonSchema.IConstant}\n> - Merge {@link OpenApiV3_1.IJsonSchema.IOneOf} to {@link IChatGptSchema.IAnOf}\n> - Merge {@link OpenApiV3_1.IJsonSchema.IAllOf} to {@link IChatGptSchema.IObject}\n> - Merge {@link OpenApiV3_1.IJsonSchema.IRecursiveReference} to {@link IChatGptSchema.IReference}\n> - When {@link IChatGptSchema.IConfig.strict} mode\n>   - Every object properties must be required\n>   - Do not allow {@link IChatGptSchema.IObject.additionalProperties}\n> \n> If compare with the {@link OpenApi.IJsonSchema}, the emended JSON schema specification,\n> \n> - {@link IChatGptSchema.IAnyOf} instead of the {@link OpenApi.IJsonSchema.IOneOf}\n> - {@link IChatGptSchema.IParameters.$defs} instead of the {@link OpenApi.IJsonSchema.IComponents.schemas}\n> - {@link IChatGptSchema.IString.enum} instead of the {@link OpenApi.IJsonSchema.IConstant}\n> - {@link IChatGptSchema.additionalProperties} is fixed to `false`\n> - No tuple type {@link OpenApi.IJsonSchema.ITuple} support\n> - When {@link IChatGptSchema.IConfig.strict} mode\n>   - Every object properties must be required\n>   - Do not allow {@link IChatGptSchema.IObject.additionalProperties}\n> \n> For reference, if you've composed the `IChatGptSchema` type with the\n> {@link IChatGptSchema.IConfig.reference} `false` option (default is `false`),\n> only the recursived named types would be archived into the\n> {@link IChatGptSchema.IParameters.$defs}, and the others would be ecaped from the\n> {@link IChatGptSchema.IReference} type.\n> \n> Also, ChatGPT has banned below constraint properties. Instead, I'll will\n> fill the {@link IChatGptSchema.__IAttribute.description} property with\n> the comment text like `\"@format uuid\"`.\n> \n> - {@link OpenApi.IJsonSchema.INumber.minimum}\n> - {@link OpenApi.IJsonSchema.INumber.maximum}\n> - {@link OpenApi.IJsonSchema.INumber.multipleOf}\n> - {@link OpenApi.IJsonSchema.IString.minLength}\n> - {@link OpenApi.IJsonSchema.IString.maxLength}\n> - {@link OpenApi.IJsonSchema.IString.format}\n> - {@link OpenApi.IJsonSchema.IString.pattern}\n> - {@link OpenApi.IJsonSchema.IString.contentMediaType}\n> - {@link OpenApi.IJsonSchema.IString.default}\n> - {@link OpenApi.IJsonSchema.IArray.minItems}\n> - {@link OpenApi.IJsonSchema.IArray.maxItems}\n> - {@link OpenApi.IJsonSchema.IArray.unique}"
                                        },
                                        {
                                            $ref: "#/$defs/IChatGptSchema.IArray"
                                        },
                                        {
                                            type: "object",
                                            properties: {
                                                $ref: {
                                                    title: "Reference to the named schema",
                                                    description: "Reference to the named schema.\n\nThe `ref` is a reference to the named schema. Format of the `$ref` is\nfollowing the JSON Pointer specification. In the OpenAPI, the `$ref`\nstarts with `#/$defs/` which means the type is stored in\nthe {@link IChatGptSchema.IParameters.$defs} object.\n\n- `#/$defs/SomeObject`\n- `#/$defs/AnotherObject`",
                                                    type: "string"
                                                },
                                                title: {
                                                    title: "Title of the schema",
                                                    description: "Title of the schema.",
                                                    type: "string"
                                                },
                                                description: {
                                                    title: "Detailed description of the schema",
                                                    description: "Detailed description of the schema.",
                                                    type: "string"
                                                },
                                                deprecated: {
                                                    title: "Whether the type is deprecated or not",
                                                    description: "Whether the type is deprecated or not.",
                                                    type: "boolean"
                                                },
                                                example: {
                                                    title: "Example value",
                                                    description: "Example value."
                                                },
                                                examples: {
                                                    description: "Construct a type with a set of properties K of type T",
                                                    type: "object",
                                                    properties: {},
                                                    required: [],
                                                    additionalProperties: {}
                                                }
                                            },
                                            required: [
                                                "$ref"
                                            ],
                                            description: "Reference type directing named schema.\n\n------------------------------\n\nDescription of the current {@link IChatGptSchema.IReference} type:\n\n> Reference type directing named schema.\n\n------------------------------\n\nDescription of the parent {@link IChatGptSchema} type:\n\n> Type schema info of the ChatGPT.\n> \n> `IChatGptSchema` is a type schema info of the ChatGPT function calling.\n> \n> `IChatGptSchema` basically follows the JSON schema definition of the OpenAPI v3.1\n> speciifcation; {@link OpenApiV3_1.IJsonSchema}.\n> \n> However, the `IChatGptSchema` does not follow the entire specification of\n> the OpenAPI v3.1. It has own specific restrictions and definitions. Here is the\n> list of how `IChatGptSchema` is different with the OpenAPI v3.1 JSON schema.\n> \n> - Decompose mixed type: {@link OpenApiV3_1.IJsonSchema.IMixed}\n> - Resolve nullable property: {@link OpenApiV3_1.IJsonSchema.__ISignificant.nullable}\n> - Tuple type is banned: {@link OpenApiV3_1.IJsonSchema.ITuple.prefixItems}\n> - Constant type is banned: {@link OpenApiV3_1.IJsonSchema.IConstant}\n> - Merge {@link OpenApiV3_1.IJsonSchema.IOneOf} to {@link IChatGptSchema.IAnOf}\n> - Merge {@link OpenApiV3_1.IJsonSchema.IAllOf} to {@link IChatGptSchema.IObject}\n> - Merge {@link OpenApiV3_1.IJsonSchema.IRecursiveReference} to {@link IChatGptSchema.IReference}\n> - When {@link IChatGptSchema.IConfig.strict} mode\n>   - Every object properties must be required\n>   - Do not allow {@link IChatGptSchema.IObject.additionalProperties}\n> \n> If compare with the {@link OpenApi.IJsonSchema}, the emended JSON schema specification,\n> \n> - {@link IChatGptSchema.IAnyOf} instead of the {@link OpenApi.IJsonSchema.IOneOf}\n> - {@link IChatGptSchema.IParameters.$defs} instead of the {@link OpenApi.IJsonSchema.IComponents.schemas}\n> - {@link IChatGptSchema.IString.enum} instead of the {@link OpenApi.IJsonSchema.IConstant}\n> - {@link IChatGptSchema.additionalProperties} is fixed to `false`\n> - No tuple type {@link OpenApi.IJsonSchema.ITuple} support\n> - When {@link IChatGptSchema.IConfig.strict} mode\n>   - Every object properties must be required\n>   - Do not allow {@link IChatGptSchema.IObject.additionalProperties}\n> \n> For reference, if you've composed the `IChatGptSchema` type with the\n> {@link IChatGptSchema.IConfig.reference} `false` option (default is `false`),\n> only the recursived named types would be archived into the\n> {@link IChatGptSchema.IParameters.$defs}, and the others would be ecaped from the\n> {@link IChatGptSchema.IReference} type.\n> \n> Also, ChatGPT has banned below constraint properties. Instead, I'll will\n> fill the {@link IChatGptSchema.__IAttribute.description} property with\n> the comment text like `\"@format uuid\"`.\n> \n> - {@link OpenApi.IJsonSchema.INumber.minimum}\n> - {@link OpenApi.IJsonSchema.INumber.maximum}\n> - {@link OpenApi.IJsonSchema.INumber.multipleOf}\n> - {@link OpenApi.IJsonSchema.IString.minLength}\n> - {@link OpenApi.IJsonSchema.IString.maxLength}\n> - {@link OpenApi.IJsonSchema.IString.format}\n> - {@link OpenApi.IJsonSchema.IString.pattern}\n> - {@link OpenApi.IJsonSchema.IString.contentMediaType}\n> - {@link OpenApi.IJsonSchema.IString.default}\n> - {@link OpenApi.IJsonSchema.IArray.minItems}\n> - {@link OpenApi.IJsonSchema.IArray.maxItems}\n> - {@link OpenApi.IJsonSchema.IArray.unique}"
                                        },
                                        {
                                            type: "object",
                                            properties: {
                                                title: {
                                                    title: "Title of the schema",
                                                    description: "Title of the schema.",
                                                    type: "string"
                                                },
                                                description: {
                                                    title: "Detailed description of the schema",
                                                    description: "Detailed description of the schema.",
                                                    type: "string"
                                                },
                                                deprecated: {
                                                    title: "Whether the type is deprecated or not",
                                                    description: "Whether the type is deprecated or not.",
                                                    type: "boolean"
                                                },
                                                example: {
                                                    title: "Example value",
                                                    description: "Example value."
                                                },
                                                examples: {
                                                    description: "Construct a type with a set of properties K of type T",
                                                    type: "object",
                                                    properties: {},
                                                    required: [],
                                                    additionalProperties: {}
                                                }
                                            },
                                            required: [],
                                            description: "Unknown, the `any` type.\n\n------------------------------\n\nDescription of the current {@link IChatGptSchema.IUnknown} type:\n\n> Unknown, the `any` type.\n\n------------------------------\n\nDescription of the parent {@link IChatGptSchema} type:\n\n> Type schema info of the ChatGPT.\n> \n> `IChatGptSchema` is a type schema info of the ChatGPT function calling.\n> \n> `IChatGptSchema` basically follows the JSON schema definition of the OpenAPI v3.1\n> speciifcation; {@link OpenApiV3_1.IJsonSchema}.\n> \n> However, the `IChatGptSchema` does not follow the entire specification of\n> the OpenAPI v3.1. It has own specific restrictions and definitions. Here is the\n> list of how `IChatGptSchema` is different with the OpenAPI v3.1 JSON schema.\n> \n> - Decompose mixed type: {@link OpenApiV3_1.IJsonSchema.IMixed}\n> - Resolve nullable property: {@link OpenApiV3_1.IJsonSchema.__ISignificant.nullable}\n> - Tuple type is banned: {@link OpenApiV3_1.IJsonSchema.ITuple.prefixItems}\n> - Constant type is banned: {@link OpenApiV3_1.IJsonSchema.IConstant}\n> - Merge {@link OpenApiV3_1.IJsonSchema.IOneOf} to {@link IChatGptSchema.IAnOf}\n> - Merge {@link OpenApiV3_1.IJsonSchema.IAllOf} to {@link IChatGptSchema.IObject}\n> - Merge {@link OpenApiV3_1.IJsonSchema.IRecursiveReference} to {@link IChatGptSchema.IReference}\n> - When {@link IChatGptSchema.IConfig.strict} mode\n>   - Every object properties must be required\n>   - Do not allow {@link IChatGptSchema.IObject.additionalProperties}\n> \n> If compare with the {@link OpenApi.IJsonSchema}, the emended JSON schema specification,\n> \n> - {@link IChatGptSchema.IAnyOf} instead of the {@link OpenApi.IJsonSchema.IOneOf}\n> - {@link IChatGptSchema.IParameters.$defs} instead of the {@link OpenApi.IJsonSchema.IComponents.schemas}\n> - {@link IChatGptSchema.IString.enum} instead of the {@link OpenApi.IJsonSchema.IConstant}\n> - {@link IChatGptSchema.additionalProperties} is fixed to `false`\n> - No tuple type {@link OpenApi.IJsonSchema.ITuple} support\n> - When {@link IChatGptSchema.IConfig.strict} mode\n>   - Every object properties must be required\n>   - Do not allow {@link IChatGptSchema.IObject.additionalProperties}\n> \n> For reference, if you've composed the `IChatGptSchema` type with the\n> {@link IChatGptSchema.IConfig.reference} `false` option (default is `false`),\n> only the recursived named types would be archived into the\n> {@link IChatGptSchema.IParameters.$defs}, and the others would be ecaped from the\n> {@link IChatGptSchema.IReference} type.\n> \n> Also, ChatGPT has banned below constraint properties. Instead, I'll will\n> fill the {@link IChatGptSchema.__IAttribute.description} property with\n> the comment text like `\"@format uuid\"`.\n> \n> - {@link OpenApi.IJsonSchema.INumber.minimum}\n> - {@link OpenApi.IJsonSchema.INumber.maximum}\n> - {@link OpenApi.IJsonSchema.INumber.multipleOf}\n> - {@link OpenApi.IJsonSchema.IString.minLength}\n> - {@link OpenApi.IJsonSchema.IString.maxLength}\n> - {@link OpenApi.IJsonSchema.IString.format}\n> - {@link OpenApi.IJsonSchema.IString.pattern}\n> - {@link OpenApi.IJsonSchema.IString.contentMediaType}\n> - {@link OpenApi.IJsonSchema.IString.default}\n> - {@link OpenApi.IJsonSchema.IArray.minItems}\n> - {@link OpenApi.IJsonSchema.IArray.maxItems}\n> - {@link OpenApi.IJsonSchema.IArray.unique}"
                                        },
                                        {
                                            type: "object",
                                            properties: {
                                                type: {
                                                    title: "Discriminator value of the type",
                                                    type: "string",
                                                    "enum": [
                                                        "null"
                                                    ]
                                                },
                                                title: {
                                                    title: "Title of the schema",
                                                    description: "Title of the schema.",
                                                    type: "string"
                                                },
                                                description: {
                                                    title: "Detailed description of the schema",
                                                    description: "Detailed description of the schema.",
                                                    type: "string"
                                                },
                                                deprecated: {
                                                    title: "Whether the type is deprecated or not",
                                                    description: "Whether the type is deprecated or not.",
                                                    type: "boolean"
                                                },
                                                example: {
                                                    title: "Example value",
                                                    description: "Example value."
                                                },
                                                examples: {
                                                    description: "Construct a type with a set of properties K of type T",
                                                    type: "object",
                                                    properties: {},
                                                    required: [],
                                                    additionalProperties: {}
                                                }
                                            },
                                            required: [
                                                "type"
                                            ],
                                            description: "Null type.\n\n------------------------------\n\nDescription of the current {@link IChatGptSchema.INull} type:\n\n> Null type.\n\n------------------------------\n\nDescription of the parent {@link IChatGptSchema} type:\n\n> Type schema info of the ChatGPT.\n> \n> `IChatGptSchema` is a type schema info of the ChatGPT function calling.\n> \n> `IChatGptSchema` basically follows the JSON schema definition of the OpenAPI v3.1\n> speciifcation; {@link OpenApiV3_1.IJsonSchema}.\n> \n> However, the `IChatGptSchema` does not follow the entire specification of\n> the OpenAPI v3.1. It has own specific restrictions and definitions. Here is the\n> list of how `IChatGptSchema` is different with the OpenAPI v3.1 JSON schema.\n> \n> - Decompose mixed type: {@link OpenApiV3_1.IJsonSchema.IMixed}\n> - Resolve nullable property: {@link OpenApiV3_1.IJsonSchema.__ISignificant.nullable}\n> - Tuple type is banned: {@link OpenApiV3_1.IJsonSchema.ITuple.prefixItems}\n> - Constant type is banned: {@link OpenApiV3_1.IJsonSchema.IConstant}\n> - Merge {@link OpenApiV3_1.IJsonSchema.IOneOf} to {@link IChatGptSchema.IAnOf}\n> - Merge {@link OpenApiV3_1.IJsonSchema.IAllOf} to {@link IChatGptSchema.IObject}\n> - Merge {@link OpenApiV3_1.IJsonSchema.IRecursiveReference} to {@link IChatGptSchema.IReference}\n> - When {@link IChatGptSchema.IConfig.strict} mode\n>   - Every object properties must be required\n>   - Do not allow {@link IChatGptSchema.IObject.additionalProperties}\n> \n> If compare with the {@link OpenApi.IJsonSchema}, the emended JSON schema specification,\n> \n> - {@link IChatGptSchema.IAnyOf} instead of the {@link OpenApi.IJsonSchema.IOneOf}\n> - {@link IChatGptSchema.IParameters.$defs} instead of the {@link OpenApi.IJsonSchema.IComponents.schemas}\n> - {@link IChatGptSchema.IString.enum} instead of the {@link OpenApi.IJsonSchema.IConstant}\n> - {@link IChatGptSchema.additionalProperties} is fixed to `false`\n> - No tuple type {@link OpenApi.IJsonSchema.ITuple} support\n> - When {@link IChatGptSchema.IConfig.strict} mode\n>   - Every object properties must be required\n>   - Do not allow {@link IChatGptSchema.IObject.additionalProperties}\n> \n> For reference, if you've composed the `IChatGptSchema` type with the\n> {@link IChatGptSchema.IConfig.reference} `false` option (default is `false`),\n> only the recursived named types would be archived into the\n> {@link IChatGptSchema.IParameters.$defs}, and the others would be ecaped from the\n> {@link IChatGptSchema.IReference} type.\n> \n> Also, ChatGPT has banned below constraint properties. Instead, I'll will\n> fill the {@link IChatGptSchema.__IAttribute.description} property with\n> the comment text like `\"@format uuid\"`.\n> \n> - {@link OpenApi.IJsonSchema.INumber.minimum}\n> - {@link OpenApi.IJsonSchema.INumber.maximum}\n> - {@link OpenApi.IJsonSchema.INumber.multipleOf}\n> - {@link OpenApi.IJsonSchema.IString.minLength}\n> - {@link OpenApi.IJsonSchema.IString.maxLength}\n> - {@link OpenApi.IJsonSchema.IString.format}\n> - {@link OpenApi.IJsonSchema.IString.pattern}\n> - {@link OpenApi.IJsonSchema.IString.contentMediaType}\n> - {@link OpenApi.IJsonSchema.IString.default}\n> - {@link OpenApi.IJsonSchema.IArray.minItems}\n> - {@link OpenApi.IJsonSchema.IArray.maxItems}\n> - {@link OpenApi.IJsonSchema.IArray.unique}"
                                        }
                                    ]
                                }
                            },
                            title: {
                                title: "Title of the schema",
                                description: "Title of the schema.",
                                type: "string"
                            },
                            description: {
                                title: "Detailed description of the schema",
                                description: "Detailed description of the schema.",
                                type: "string"
                            },
                            deprecated: {
                                title: "Whether the type is deprecated or not",
                                description: "Whether the type is deprecated or not.",
                                type: "boolean"
                            },
                            example: {
                                title: "Example value",
                                description: "Example value."
                            },
                            examples: {
                                description: "Construct a type with a set of properties K of type T",
                                type: "object",
                                properties: {},
                                required: [],
                                additionalProperties: {}
                            }
                        },
                        required: [
                            "anyOf"
                        ]
                    }
                }
            },
            output: {
                type: "array",
                items: {
                    description: "LLM function calling schema from HTTP (OpenAPI) operation.\n\n`IHttpLlmFunction` is a data structure representing a function converted\nfrom the {@link OpenApi.IOperation OpenAPI operation}, used for the LLM\n(Large Language Model) function calling. It's a typical RPC (Remote Procedure Call)\nstructure containing the function {@link name}, {@link parameters}, and\n{@link output return type}.\n\nIf you provide this `IHttpLlmFunction` data to the LLM provider like \"OpenAI\",\nthe \"OpenAI\" will compose a function arguments by analyzing conversations with\nthe user. With the LLM composed arguments, you can execute the function through\n{@link LlmFetcher.execute} and get the result.\n\nFor reference, different between `IHttpLlmFunction` and its origin source\n{@link OpenApi.IOperation} is, `IHttpLlmFunction` has converted every type schema\ninformations from {@link OpenApi.IJsonSchema} to {@link ILlmSchemaV3} to escape\n{@link OpenApi.IJsonSchema.IReference reference types}, and downgrade the version\nof the JSON schema to OpenAPI 3.0. It's because LLM function call feature cannot\nunderstand both reference types and OpenAPI 3.1 specification.\n\nAdditionally, if you've composed `IHttpLlmFunction` with\n{@link IHttpLlmApplication.IOptions.keyword} configuration as `true`, number of\n{@link IHttpLlmFunction.parameters} are always 1 and the first parameter's\ntype is always {@link ILlmSchemaV3.IObject}. The properties' rule is:\n\n- `pathParameters`: Path parameters of {@link OpenApi.IOperation.parameters}\n- `query`: Query parameter of {@link IHttpMigrateRoute.query}\n- `body`: Body parameter of {@link IHttpMigrateRoute.body}\n\n```typescript\n{\n  ...pathParameters,\n  query,\n  body,\n}\n```\n\nOtherwise, the parameters would be multiple, and the sequence of the parameters\nare following below rules:\n\n```typescript\n[\n  ...pathParameters,\n  ...(query ? [query] : []),\n  ...(body ? [body] : []),\n]\n```",
                    type: "object",
                    properties: {
                        method: {
                            title: "HTTP method of the endpoint",
                            type: "string",
                            "enum": [
                                "get",
                                "post",
                                "put",
                                "patch",
                                "delete"
                            ]
                        },
                        path: {
                            title: "Path of the endpoint",
                            description: "Path of the endpoint.",
                            type: "string"
                        },
                        name: {
                            title: "Representative name of the function",
                            description: "Representative name of the function.\n\nThe `name` is a repsentative name identifying the function in the\n{@link IHttpLlmApplication}. The `name` value is just composed by joining the\n{@link IHttpMigrateRoute.accessor} by underscore `_` character.\n\nHere is the composition rule of the  {@link IHttpMigrateRoute.accessor}:\n\n> The `accessor` is composed with the following rules. At first,\n> namespaces are composed by static directory names in the {@link path}.\n> Parametric symbols represented by `:param` or `{param}` cannot be\n> a part of the namespace.\n>\n> Instead, they would be a part of the function name. The function\n> name is composed with the {@link method HTTP method} and parametric\n> symbols like `getByParam` or `postByParam`. If there are multiple\n> path parameters, they would be concatenated by `And` like\n> `getByParam1AndParam2`.\n>\n> For refefence, if the {@link operation}'s {@link method} is `delete`,\n> the function name would be replaced to `erase` instead of `delete`.\n> It is the reason why the `delete` is a reserved keyword in many\n> programming languages.\n>\n> - Example 1\n>   - path: `POST /shopping/sellers/sales`\n>   - accessor: `shopping.sellers.sales.post`\n> - Example 2\n>   - endpoint: `GET /shoppings/sellers/sales/:saleId/reviews/:reviewId/comments/:id\n>   - accessor: `shoppings.sellers.sales.reviews.getBySaleIdAndReviewIdAndCommentId`",
                            type: "string"
                        },
                        parameters: {
                            description: "Type of the function parameters.\n\n`IChatGptSchema.IParameters` is a type defining a function's parameters\nas a keyworded object type.\n\nIt also can be utilized for the structured output metadata.\n\n------------------------------\n\nDescription of the current {@link IChatGptSchema.IParameters} type:\n\n> Type of the function parameters.\n> \n> `IChatGptSchema.IParameters` is a type defining a function's parameters\n> as a keyworded object type.\n> \n> It also can be utilized for the structured output metadata.\n\n------------------------------\n\nDescription of the parent {@link IChatGptSchema} type:\n\n> Type schema info of the ChatGPT.\n> \n> `IChatGptSchema` is a type schema info of the ChatGPT function calling.\n> \n> `IChatGptSchema` basically follows the JSON schema definition of the OpenAPI v3.1\n> speciifcation; {@link OpenApiV3_1.IJsonSchema}.\n> \n> However, the `IChatGptSchema` does not follow the entire specification of\n> the OpenAPI v3.1. It has own specific restrictions and definitions. Here is the\n> list of how `IChatGptSchema` is different with the OpenAPI v3.1 JSON schema.\n> \n> - Decompose mixed type: {@link OpenApiV3_1.IJsonSchema.IMixed}\n> - Resolve nullable property: {@link OpenApiV3_1.IJsonSchema.__ISignificant.nullable}\n> - Tuple type is banned: {@link OpenApiV3_1.IJsonSchema.ITuple.prefixItems}\n> - Constant type is banned: {@link OpenApiV3_1.IJsonSchema.IConstant}\n> - Merge {@link OpenApiV3_1.IJsonSchema.IOneOf} to {@link IChatGptSchema.IAnOf}\n> - Merge {@link OpenApiV3_1.IJsonSchema.IAllOf} to {@link IChatGptSchema.IObject}\n> - Merge {@link OpenApiV3_1.IJsonSchema.IRecursiveReference} to {@link IChatGptSchema.IReference}\n> - When {@link IChatGptSchema.IConfig.strict} mode\n>   - Every object properties must be required\n>   - Do not allow {@link IChatGptSchema.IObject.additionalProperties}\n> \n> If compare with the {@link OpenApi.IJsonSchema}, the emended JSON schema specification,\n> \n> - {@link IChatGptSchema.IAnyOf} instead of the {@link OpenApi.IJsonSchema.IOneOf}\n> - {@link IChatGptSchema.IParameters.$defs} instead of the {@link OpenApi.IJsonSchema.IComponents.schemas}\n> - {@link IChatGptSchema.IString.enum} instead of the {@link OpenApi.IJsonSchema.IConstant}\n> - {@link IChatGptSchema.additionalProperties} is fixed to `false`\n> - No tuple type {@link OpenApi.IJsonSchema.ITuple} support\n> - When {@link IChatGptSchema.IConfig.strict} mode\n>   - Every object properties must be required\n>   - Do not allow {@link IChatGptSchema.IObject.additionalProperties}\n> \n> For reference, if you've composed the `IChatGptSchema` type with the\n> {@link IChatGptSchema.IConfig.reference} `false` option (default is `false`),\n> only the recursived named types would be archived into the\n> {@link IChatGptSchema.IParameters.$defs}, and the others would be ecaped from the\n> {@link IChatGptSchema.IReference} type.\n> \n> Also, ChatGPT has banned below constraint properties. Instead, I'll will\n> fill the {@link IChatGptSchema.__IAttribute.description} property with\n> the comment text like `\"@format uuid\"`.\n> \n> - {@link OpenApi.IJsonSchema.INumber.minimum}\n> - {@link OpenApi.IJsonSchema.INumber.maximum}\n> - {@link OpenApi.IJsonSchema.INumber.multipleOf}\n> - {@link OpenApi.IJsonSchema.IString.minLength}\n> - {@link OpenApi.IJsonSchema.IString.maxLength}\n> - {@link OpenApi.IJsonSchema.IString.format}\n> - {@link OpenApi.IJsonSchema.IString.pattern}\n> - {@link OpenApi.IJsonSchema.IString.contentMediaType}\n> - {@link OpenApi.IJsonSchema.IString.default}\n> - {@link OpenApi.IJsonSchema.IArray.minItems}\n> - {@link OpenApi.IJsonSchema.IArray.maxItems}\n> - {@link OpenApi.IJsonSchema.IArray.unique}",
                            type: "object",
                            properties: {
                                $defs: {
                                    title: "Collection of the named types",
                                    $ref: "#/$defs/RecordstringIChatGptSchema"
                                },
                                additionalProperties: {
                                    title: "Additional properties' info",
                                    type: "boolean",
                                    "enum": [
                                        false
                                    ]
                                },
                                type: {
                                    title: "Discriminator value of the type",
                                    type: "string",
                                    "enum": [
                                        "object"
                                    ]
                                },
                                required: {
                                    title: "List of key values of the required properties",
                                    description: "List of key values of the required properties.\n\nThe `required` means a list of the key values of the required\n{@link properties}. If some property key is not listed in the `required`\nlist, it means that property is optional. Otherwise some property key\nexists in the `required` list, it means that the property must be filled.\n\nBelow is an example of the {@link properties} and `required`.\n\n```typescript\ninterface SomeObject {\n  id: string;\n  email: string;\n  name?: string;\n}\n```\n\nAs you can see, `id` and `email` {@link properties} are {@link required},\nso that they are listed in the `required` list.\n\n```json\n{\n  \"type\": \"object\",\n  \"properties\": {\n    \"id\": { \"type\": \"string\" },\n    \"email\": { \"type\": \"string\" },\n    \"name\": { \"type\": \"string\" }\n  },\n  \"required\": [\"id\", \"email\"]\n}\n```",
                                    type: "array",
                                    items: {
                                        type: "string"
                                    }
                                },
                                properties: {
                                    title: "Properties of the object",
                                    $ref: "#/$defs/RecordstringIChatGptSchema"
                                },
                                title: {
                                    title: "Title of the schema",
                                    description: "Title of the schema.",
                                    type: "string"
                                },
                                description: {
                                    title: "Detailed description of the schema",
                                    description: "Detailed description of the schema.",
                                    type: "string"
                                },
                                deprecated: {
                                    title: "Whether the type is deprecated or not",
                                    description: "Whether the type is deprecated or not.",
                                    type: "boolean"
                                },
                                example: {
                                    title: "Example value",
                                    description: "Example value."
                                },
                                examples: {
                                    description: "Construct a type with a set of properties K of type T",
                                    type: "object",
                                    properties: {},
                                    required: [],
                                    additionalProperties: {}
                                }
                            },
                            required: [
                                "$defs",
                                "additionalProperties",
                                "type",
                                "required",
                                "properties"
                            ]
                        },
                        separated: {
                            description: "Collection of separated parameters.\n\n------------------------------\n\nDescription of the current {@link IHttpLlmFunction.ISeparatedchatgpt} type:\n\n> Collection of separated parameters.",
                            type: "object",
                            properties: {
                                llm: {
                                    title: "Parameters that would be composed by the LLM",
                                    description: "Parameters that would be composed by the LLM.",
                                    anyOf: [
                                        {
                                            type: "null"
                                        },
                                        {
                                            type: "object",
                                            properties: {
                                                $defs: {
                                                    title: "Collection of the named types",
                                                    $ref: "#/$defs/RecordstringIChatGptSchema"
                                                },
                                                additionalProperties: {
                                                    title: "Additional properties' info",
                                                    type: "boolean",
                                                    "enum": [
                                                        false
                                                    ]
                                                },
                                                type: {
                                                    title: "Discriminator value of the type",
                                                    type: "string",
                                                    "enum": [
                                                        "object"
                                                    ]
                                                },
                                                required: {
                                                    title: "List of key values of the required properties",
                                                    description: "List of key values of the required properties.\n\nThe `required` means a list of the key values of the required\n{@link properties}. If some property key is not listed in the `required`\nlist, it means that property is optional. Otherwise some property key\nexists in the `required` list, it means that the property must be filled.\n\nBelow is an example of the {@link properties} and `required`.\n\n```typescript\ninterface SomeObject {\n  id: string;\n  email: string;\n  name?: string;\n}\n```\n\nAs you can see, `id` and `email` {@link properties} are {@link required},\nso that they are listed in the `required` list.\n\n```json\n{\n  \"type\": \"object\",\n  \"properties\": {\n    \"id\": { \"type\": \"string\" },\n    \"email\": { \"type\": \"string\" },\n    \"name\": { \"type\": \"string\" }\n  },\n  \"required\": [\"id\", \"email\"]\n}\n```",
                                                    type: "array",
                                                    items: {
                                                        type: "string"
                                                    }
                                                },
                                                properties: {
                                                    title: "Properties of the object",
                                                    $ref: "#/$defs/RecordstringIChatGptSchema"
                                                },
                                                title: {
                                                    title: "Title of the schema",
                                                    description: "Title of the schema.",
                                                    type: "string"
                                                },
                                                description: {
                                                    title: "Detailed description of the schema",
                                                    description: "Detailed description of the schema.",
                                                    type: "string"
                                                },
                                                deprecated: {
                                                    title: "Whether the type is deprecated or not",
                                                    description: "Whether the type is deprecated or not.",
                                                    type: "boolean"
                                                },
                                                example: {
                                                    title: "Example value",
                                                    description: "Example value."
                                                },
                                                examples: {
                                                    description: "Construct a type with a set of properties K of type T",
                                                    type: "object",
                                                    properties: {},
                                                    required: [],
                                                    additionalProperties: {}
                                                }
                                            },
                                            required: [
                                                "$defs",
                                                "additionalProperties",
                                                "type",
                                                "required",
                                                "properties"
                                            ],
                                            description: "Type of the function parameters.\n\n`IChatGptSchema.IParameters` is a type defining a function's parameters\nas a keyworded object type.\n\nIt also can be utilized for the structured output metadata.\n\n------------------------------\n\nDescription of the current {@link IChatGptSchema.IParameters} type:\n\n> Type of the function parameters.\n> \n> `IChatGptSchema.IParameters` is a type defining a function's parameters\n> as a keyworded object type.\n> \n> It also can be utilized for the structured output metadata.\n\n------------------------------\n\nDescription of the parent {@link IChatGptSchema} type:\n\n> Type schema info of the ChatGPT.\n> \n> `IChatGptSchema` is a type schema info of the ChatGPT function calling.\n> \n> `IChatGptSchema` basically follows the JSON schema definition of the OpenAPI v3.1\n> speciifcation; {@link OpenApiV3_1.IJsonSchema}.\n> \n> However, the `IChatGptSchema` does not follow the entire specification of\n> the OpenAPI v3.1. It has own specific restrictions and definitions. Here is the\n> list of how `IChatGptSchema` is different with the OpenAPI v3.1 JSON schema.\n> \n> - Decompose mixed type: {@link OpenApiV3_1.IJsonSchema.IMixed}\n> - Resolve nullable property: {@link OpenApiV3_1.IJsonSchema.__ISignificant.nullable}\n> - Tuple type is banned: {@link OpenApiV3_1.IJsonSchema.ITuple.prefixItems}\n> - Constant type is banned: {@link OpenApiV3_1.IJsonSchema.IConstant}\n> - Merge {@link OpenApiV3_1.IJsonSchema.IOneOf} to {@link IChatGptSchema.IAnOf}\n> - Merge {@link OpenApiV3_1.IJsonSchema.IAllOf} to {@link IChatGptSchema.IObject}\n> - Merge {@link OpenApiV3_1.IJsonSchema.IRecursiveReference} to {@link IChatGptSchema.IReference}\n> - When {@link IChatGptSchema.IConfig.strict} mode\n>   - Every object properties must be required\n>   - Do not allow {@link IChatGptSchema.IObject.additionalProperties}\n> \n> If compare with the {@link OpenApi.IJsonSchema}, the emended JSON schema specification,\n> \n> - {@link IChatGptSchema.IAnyOf} instead of the {@link OpenApi.IJsonSchema.IOneOf}\n> - {@link IChatGptSchema.IParameters.$defs} instead of the {@link OpenApi.IJsonSchema.IComponents.schemas}\n> - {@link IChatGptSchema.IString.enum} instead of the {@link OpenApi.IJsonSchema.IConstant}\n> - {@link IChatGptSchema.additionalProperties} is fixed to `false`\n> - No tuple type {@link OpenApi.IJsonSchema.ITuple} support\n> - When {@link IChatGptSchema.IConfig.strict} mode\n>   - Every object properties must be required\n>   - Do not allow {@link IChatGptSchema.IObject.additionalProperties}\n> \n> For reference, if you've composed the `IChatGptSchema` type with the\n> {@link IChatGptSchema.IConfig.reference} `false` option (default is `false`),\n> only the recursived named types would be archived into the\n> {@link IChatGptSchema.IParameters.$defs}, and the others would be ecaped from the\n> {@link IChatGptSchema.IReference} type.\n> \n> Also, ChatGPT has banned below constraint properties. Instead, I'll will\n> fill the {@link IChatGptSchema.__IAttribute.description} property with\n> the comment text like `\"@format uuid\"`.\n> \n> - {@link OpenApi.IJsonSchema.INumber.minimum}\n> - {@link OpenApi.IJsonSchema.INumber.maximum}\n> - {@link OpenApi.IJsonSchema.INumber.multipleOf}\n> - {@link OpenApi.IJsonSchema.IString.minLength}\n> - {@link OpenApi.IJsonSchema.IString.maxLength}\n> - {@link OpenApi.IJsonSchema.IString.format}\n> - {@link OpenApi.IJsonSchema.IString.pattern}\n> - {@link OpenApi.IJsonSchema.IString.contentMediaType}\n> - {@link OpenApi.IJsonSchema.IString.default}\n> - {@link OpenApi.IJsonSchema.IArray.minItems}\n> - {@link OpenApi.IJsonSchema.IArray.maxItems}\n> - {@link OpenApi.IJsonSchema.IArray.unique}"
                                        }
                                    ]
                                },
                                human: {
                                    title: "Parameters that would be composed by the human",
                                    description: "Parameters that would be composed by the human.",
                                    anyOf: [
                                        {
                                            type: "null"
                                        },
                                        {
                                            type: "object",
                                            properties: {
                                                $defs: {
                                                    title: "Collection of the named types",
                                                    $ref: "#/$defs/RecordstringIChatGptSchema"
                                                },
                                                additionalProperties: {
                                                    title: "Additional properties' info",
                                                    type: "boolean",
                                                    "enum": [
                                                        false
                                                    ]
                                                },
                                                type: {
                                                    title: "Discriminator value of the type",
                                                    type: "string",
                                                    "enum": [
                                                        "object"
                                                    ]
                                                },
                                                required: {
                                                    title: "List of key values of the required properties",
                                                    description: "List of key values of the required properties.\n\nThe `required` means a list of the key values of the required\n{@link properties}. If some property key is not listed in the `required`\nlist, it means that property is optional. Otherwise some property key\nexists in the `required` list, it means that the property must be filled.\n\nBelow is an example of the {@link properties} and `required`.\n\n```typescript\ninterface SomeObject {\n  id: string;\n  email: string;\n  name?: string;\n}\n```\n\nAs you can see, `id` and `email` {@link properties} are {@link required},\nso that they are listed in the `required` list.\n\n```json\n{\n  \"type\": \"object\",\n  \"properties\": {\n    \"id\": { \"type\": \"string\" },\n    \"email\": { \"type\": \"string\" },\n    \"name\": { \"type\": \"string\" }\n  },\n  \"required\": [\"id\", \"email\"]\n}\n```",
                                                    type: "array",
                                                    items: {
                                                        type: "string"
                                                    }
                                                },
                                                properties: {
                                                    title: "Properties of the object",
                                                    $ref: "#/$defs/RecordstringIChatGptSchema"
                                                },
                                                title: {
                                                    title: "Title of the schema",
                                                    description: "Title of the schema.",
                                                    type: "string"
                                                },
                                                description: {
                                                    title: "Detailed description of the schema",
                                                    description: "Detailed description of the schema.",
                                                    type: "string"
                                                },
                                                deprecated: {
                                                    title: "Whether the type is deprecated or not",
                                                    description: "Whether the type is deprecated or not.",
                                                    type: "boolean"
                                                },
                                                example: {
                                                    title: "Example value",
                                                    description: "Example value."
                                                },
                                                examples: {
                                                    description: "Construct a type with a set of properties K of type T",
                                                    type: "object",
                                                    properties: {},
                                                    required: [],
                                                    additionalProperties: {}
                                                }
                                            },
                                            required: [
                                                "$defs",
                                                "additionalProperties",
                                                "type",
                                                "required",
                                                "properties"
                                            ],
                                            description: "Type of the function parameters.\n\n`IChatGptSchema.IParameters` is a type defining a function's parameters\nas a keyworded object type.\n\nIt also can be utilized for the structured output metadata.\n\n------------------------------\n\nDescription of the current {@link IChatGptSchema.IParameters} type:\n\n> Type of the function parameters.\n> \n> `IChatGptSchema.IParameters` is a type defining a function's parameters\n> as a keyworded object type.\n> \n> It also can be utilized for the structured output metadata.\n\n------------------------------\n\nDescription of the parent {@link IChatGptSchema} type:\n\n> Type schema info of the ChatGPT.\n> \n> `IChatGptSchema` is a type schema info of the ChatGPT function calling.\n> \n> `IChatGptSchema` basically follows the JSON schema definition of the OpenAPI v3.1\n> speciifcation; {@link OpenApiV3_1.IJsonSchema}.\n> \n> However, the `IChatGptSchema` does not follow the entire specification of\n> the OpenAPI v3.1. It has own specific restrictions and definitions. Here is the\n> list of how `IChatGptSchema` is different with the OpenAPI v3.1 JSON schema.\n> \n> - Decompose mixed type: {@link OpenApiV3_1.IJsonSchema.IMixed}\n> - Resolve nullable property: {@link OpenApiV3_1.IJsonSchema.__ISignificant.nullable}\n> - Tuple type is banned: {@link OpenApiV3_1.IJsonSchema.ITuple.prefixItems}\n> - Constant type is banned: {@link OpenApiV3_1.IJsonSchema.IConstant}\n> - Merge {@link OpenApiV3_1.IJsonSchema.IOneOf} to {@link IChatGptSchema.IAnOf}\n> - Merge {@link OpenApiV3_1.IJsonSchema.IAllOf} to {@link IChatGptSchema.IObject}\n> - Merge {@link OpenApiV3_1.IJsonSchema.IRecursiveReference} to {@link IChatGptSchema.IReference}\n> - When {@link IChatGptSchema.IConfig.strict} mode\n>   - Every object properties must be required\n>   - Do not allow {@link IChatGptSchema.IObject.additionalProperties}\n> \n> If compare with the {@link OpenApi.IJsonSchema}, the emended JSON schema specification,\n> \n> - {@link IChatGptSchema.IAnyOf} instead of the {@link OpenApi.IJsonSchema.IOneOf}\n> - {@link IChatGptSchema.IParameters.$defs} instead of the {@link OpenApi.IJsonSchema.IComponents.schemas}\n> - {@link IChatGptSchema.IString.enum} instead of the {@link OpenApi.IJsonSchema.IConstant}\n> - {@link IChatGptSchema.additionalProperties} is fixed to `false`\n> - No tuple type {@link OpenApi.IJsonSchema.ITuple} support\n> - When {@link IChatGptSchema.IConfig.strict} mode\n>   - Every object properties must be required\n>   - Do not allow {@link IChatGptSchema.IObject.additionalProperties}\n> \n> For reference, if you've composed the `IChatGptSchema` type with the\n> {@link IChatGptSchema.IConfig.reference} `false` option (default is `false`),\n> only the recursived named types would be archived into the\n> {@link IChatGptSchema.IParameters.$defs}, and the others would be ecaped from the\n> {@link IChatGptSchema.IReference} type.\n> \n> Also, ChatGPT has banned below constraint properties. Instead, I'll will\n> fill the {@link IChatGptSchema.__IAttribute.description} property with\n> the comment text like `\"@format uuid\"`.\n> \n> - {@link OpenApi.IJsonSchema.INumber.minimum}\n> - {@link OpenApi.IJsonSchema.INumber.maximum}\n> - {@link OpenApi.IJsonSchema.INumber.multipleOf}\n> - {@link OpenApi.IJsonSchema.IString.minLength}\n> - {@link OpenApi.IJsonSchema.IString.maxLength}\n> - {@link OpenApi.IJsonSchema.IString.format}\n> - {@link OpenApi.IJsonSchema.IString.pattern}\n> - {@link OpenApi.IJsonSchema.IString.contentMediaType}\n> - {@link OpenApi.IJsonSchema.IString.default}\n> - {@link OpenApi.IJsonSchema.IArray.minItems}\n> - {@link OpenApi.IJsonSchema.IArray.maxItems}\n> - {@link OpenApi.IJsonSchema.IArray.unique}"
                                        }
                                    ]
                                }
                            },
                            required: [
                                "llm",
                                "human"
                            ]
                        },
                        output: {
                            title: "Expected return type",
                            description: "Expected return type.\n\nIf the target operation returns nothing (`void`), the `output`\nwould be `undefined`.",
                            anyOf: [
                                {
                                    $ref: "#/$defs/IChatGptSchema.IObject"
                                },
                                {
                                    type: "object",
                                    properties: {
                                        "enum": {
                                            title: "Enumeration values",
                                            description: "Enumeration values.",
                                            type: "array",
                                            items: {
                                                type: "string"
                                            }
                                        },
                                        type: {
                                            title: "Discriminator value of the type",
                                            type: "string",
                                            "enum": [
                                                "string"
                                            ]
                                        },
                                        title: {
                                            title: "Title of the schema",
                                            description: "Title of the schema.",
                                            type: "string"
                                        },
                                        description: {
                                            title: "Detailed description of the schema",
                                            description: "Detailed description of the schema.",
                                            type: "string"
                                        },
                                        deprecated: {
                                            title: "Whether the type is deprecated or not",
                                            description: "Whether the type is deprecated or not.",
                                            type: "boolean"
                                        },
                                        example: {
                                            title: "Example value",
                                            description: "Example value."
                                        },
                                        examples: {
                                            description: "Construct a type with a set of properties K of type T",
                                            type: "object",
                                            properties: {},
                                            required: [],
                                            additionalProperties: {}
                                        }
                                    },
                                    required: [
                                        "type"
                                    ],
                                    description: "String type info.\n\n------------------------------\n\nDescription of the current {@link IChatGptSchema.IString} type:\n\n> String type info.\n\n------------------------------\n\nDescription of the parent {@link IChatGptSchema} type:\n\n> Type schema info of the ChatGPT.\n> \n> `IChatGptSchema` is a type schema info of the ChatGPT function calling.\n> \n> `IChatGptSchema` basically follows the JSON schema definition of the OpenAPI v3.1\n> speciifcation; {@link OpenApiV3_1.IJsonSchema}.\n> \n> However, the `IChatGptSchema` does not follow the entire specification of\n> the OpenAPI v3.1. It has own specific restrictions and definitions. Here is the\n> list of how `IChatGptSchema` is different with the OpenAPI v3.1 JSON schema.\n> \n> - Decompose mixed type: {@link OpenApiV3_1.IJsonSchema.IMixed}\n> - Resolve nullable property: {@link OpenApiV3_1.IJsonSchema.__ISignificant.nullable}\n> - Tuple type is banned: {@link OpenApiV3_1.IJsonSchema.ITuple.prefixItems}\n> - Constant type is banned: {@link OpenApiV3_1.IJsonSchema.IConstant}\n> - Merge {@link OpenApiV3_1.IJsonSchema.IOneOf} to {@link IChatGptSchema.IAnOf}\n> - Merge {@link OpenApiV3_1.IJsonSchema.IAllOf} to {@link IChatGptSchema.IObject}\n> - Merge {@link OpenApiV3_1.IJsonSchema.IRecursiveReference} to {@link IChatGptSchema.IReference}\n> - When {@link IChatGptSchema.IConfig.strict} mode\n>   - Every object properties must be required\n>   - Do not allow {@link IChatGptSchema.IObject.additionalProperties}\n> \n> If compare with the {@link OpenApi.IJsonSchema}, the emended JSON schema specification,\n> \n> - {@link IChatGptSchema.IAnyOf} instead of the {@link OpenApi.IJsonSchema.IOneOf}\n> - {@link IChatGptSchema.IParameters.$defs} instead of the {@link OpenApi.IJsonSchema.IComponents.schemas}\n> - {@link IChatGptSchema.IString.enum} instead of the {@link OpenApi.IJsonSchema.IConstant}\n> - {@link IChatGptSchema.additionalProperties} is fixed to `false`\n> - No tuple type {@link OpenApi.IJsonSchema.ITuple} support\n> - When {@link IChatGptSchema.IConfig.strict} mode\n>   - Every object properties must be required\n>   - Do not allow {@link IChatGptSchema.IObject.additionalProperties}\n> \n> For reference, if you've composed the `IChatGptSchema` type with the\n> {@link IChatGptSchema.IConfig.reference} `false` option (default is `false`),\n> only the recursived named types would be archived into the\n> {@link IChatGptSchema.IParameters.$defs}, and the others would be ecaped from the\n> {@link IChatGptSchema.IReference} type.\n> \n> Also, ChatGPT has banned below constraint properties. Instead, I'll will\n> fill the {@link IChatGptSchema.__IAttribute.description} property with\n> the comment text like `\"@format uuid\"`.\n> \n> - {@link OpenApi.IJsonSchema.INumber.minimum}\n> - {@link OpenApi.IJsonSchema.INumber.maximum}\n> - {@link OpenApi.IJsonSchema.INumber.multipleOf}\n> - {@link OpenApi.IJsonSchema.IString.minLength}\n> - {@link OpenApi.IJsonSchema.IString.maxLength}\n> - {@link OpenApi.IJsonSchema.IString.format}\n> - {@link OpenApi.IJsonSchema.IString.pattern}\n> - {@link OpenApi.IJsonSchema.IString.contentMediaType}\n> - {@link OpenApi.IJsonSchema.IString.default}\n> - {@link OpenApi.IJsonSchema.IArray.minItems}\n> - {@link OpenApi.IJsonSchema.IArray.maxItems}\n> - {@link OpenApi.IJsonSchema.IArray.unique}"
                                },
                                {
                                    type: "object",
                                    properties: {
                                        "enum": {
                                            title: "Enumeration values",
                                            description: "Enumeration values.",
                                            type: "array",
                                            items: {
                                                type: "number"
                                            }
                                        },
                                        type: {
                                            title: "Discriminator value of the type",
                                            type: "string",
                                            "enum": [
                                                "number"
                                            ]
                                        },
                                        title: {
                                            title: "Title of the schema",
                                            description: "Title of the schema.",
                                            type: "string"
                                        },
                                        description: {
                                            title: "Detailed description of the schema",
                                            description: "Detailed description of the schema.",
                                            type: "string"
                                        },
                                        deprecated: {
                                            title: "Whether the type is deprecated or not",
                                            description: "Whether the type is deprecated or not.",
                                            type: "boolean"
                                        },
                                        example: {
                                            title: "Example value",
                                            description: "Example value."
                                        },
                                        examples: {
                                            description: "Construct a type with a set of properties K of type T",
                                            type: "object",
                                            properties: {},
                                            required: [],
                                            additionalProperties: {}
                                        }
                                    },
                                    required: [
                                        "type"
                                    ],
                                    description: "Number (double) type info.\n\n------------------------------\n\nDescription of the current {@link IChatGptSchema.INumber} type:\n\n> Number (double) type info.\n\n------------------------------\n\nDescription of the parent {@link IChatGptSchema} type:\n\n> Type schema info of the ChatGPT.\n> \n> `IChatGptSchema` is a type schema info of the ChatGPT function calling.\n> \n> `IChatGptSchema` basically follows the JSON schema definition of the OpenAPI v3.1\n> speciifcation; {@link OpenApiV3_1.IJsonSchema}.\n> \n> However, the `IChatGptSchema` does not follow the entire specification of\n> the OpenAPI v3.1. It has own specific restrictions and definitions. Here is the\n> list of how `IChatGptSchema` is different with the OpenAPI v3.1 JSON schema.\n> \n> - Decompose mixed type: {@link OpenApiV3_1.IJsonSchema.IMixed}\n> - Resolve nullable property: {@link OpenApiV3_1.IJsonSchema.__ISignificant.nullable}\n> - Tuple type is banned: {@link OpenApiV3_1.IJsonSchema.ITuple.prefixItems}\n> - Constant type is banned: {@link OpenApiV3_1.IJsonSchema.IConstant}\n> - Merge {@link OpenApiV3_1.IJsonSchema.IOneOf} to {@link IChatGptSchema.IAnOf}\n> - Merge {@link OpenApiV3_1.IJsonSchema.IAllOf} to {@link IChatGptSchema.IObject}\n> - Merge {@link OpenApiV3_1.IJsonSchema.IRecursiveReference} to {@link IChatGptSchema.IReference}\n> - When {@link IChatGptSchema.IConfig.strict} mode\n>   - Every object properties must be required\n>   - Do not allow {@link IChatGptSchema.IObject.additionalProperties}\n> \n> If compare with the {@link OpenApi.IJsonSchema}, the emended JSON schema specification,\n> \n> - {@link IChatGptSchema.IAnyOf} instead of the {@link OpenApi.IJsonSchema.IOneOf}\n> - {@link IChatGptSchema.IParameters.$defs} instead of the {@link OpenApi.IJsonSchema.IComponents.schemas}\n> - {@link IChatGptSchema.IString.enum} instead of the {@link OpenApi.IJsonSchema.IConstant}\n> - {@link IChatGptSchema.additionalProperties} is fixed to `false`\n> - No tuple type {@link OpenApi.IJsonSchema.ITuple} support\n> - When {@link IChatGptSchema.IConfig.strict} mode\n>   - Every object properties must be required\n>   - Do not allow {@link IChatGptSchema.IObject.additionalProperties}\n> \n> For reference, if you've composed the `IChatGptSchema` type with the\n> {@link IChatGptSchema.IConfig.reference} `false` option (default is `false`),\n> only the recursived named types would be archived into the\n> {@link IChatGptSchema.IParameters.$defs}, and the others would be ecaped from the\n> {@link IChatGptSchema.IReference} type.\n> \n> Also, ChatGPT has banned below constraint properties. Instead, I'll will\n> fill the {@link IChatGptSchema.__IAttribute.description} property with\n> the comment text like `\"@format uuid\"`.\n> \n> - {@link OpenApi.IJsonSchema.INumber.minimum}\n> - {@link OpenApi.IJsonSchema.INumber.maximum}\n> - {@link OpenApi.IJsonSchema.INumber.multipleOf}\n> - {@link OpenApi.IJsonSchema.IString.minLength}\n> - {@link OpenApi.IJsonSchema.IString.maxLength}\n> - {@link OpenApi.IJsonSchema.IString.format}\n> - {@link OpenApi.IJsonSchema.IString.pattern}\n> - {@link OpenApi.IJsonSchema.IString.contentMediaType}\n> - {@link OpenApi.IJsonSchema.IString.default}\n> - {@link OpenApi.IJsonSchema.IArray.minItems}\n> - {@link OpenApi.IJsonSchema.IArray.maxItems}\n> - {@link OpenApi.IJsonSchema.IArray.unique}"
                                },
                                {
                                    type: "object",
                                    properties: {
                                        "enum": {
                                            title: "Enumeration values",
                                            description: "Enumeration values.",
                                            type: "array",
                                            items: {
                                                type: "number"
                                            }
                                        },
                                        type: {
                                            title: "Discriminator value of the type",
                                            type: "string",
                                            "enum": [
                                                "integer"
                                            ]
                                        },
                                        title: {
                                            title: "Title of the schema",
                                            description: "Title of the schema.",
                                            type: "string"
                                        },
                                        description: {
                                            title: "Detailed description of the schema",
                                            description: "Detailed description of the schema.",
                                            type: "string"
                                        },
                                        deprecated: {
                                            title: "Whether the type is deprecated or not",
                                            description: "Whether the type is deprecated or not.",
                                            type: "boolean"
                                        },
                                        example: {
                                            title: "Example value",
                                            description: "Example value."
                                        },
                                        examples: {
                                            description: "Construct a type with a set of properties K of type T",
                                            type: "object",
                                            properties: {},
                                            required: [],
                                            additionalProperties: {}
                                        }
                                    },
                                    required: [
                                        "type"
                                    ],
                                    description: "Integer type info.\n\n------------------------------\n\nDescription of the current {@link IChatGptSchema.IInteger} type:\n\n> Integer type info.\n\n------------------------------\n\nDescription of the parent {@link IChatGptSchema} type:\n\n> Type schema info of the ChatGPT.\n> \n> `IChatGptSchema` is a type schema info of the ChatGPT function calling.\n> \n> `IChatGptSchema` basically follows the JSON schema definition of the OpenAPI v3.1\n> speciifcation; {@link OpenApiV3_1.IJsonSchema}.\n> \n> However, the `IChatGptSchema` does not follow the entire specification of\n> the OpenAPI v3.1. It has own specific restrictions and definitions. Here is the\n> list of how `IChatGptSchema` is different with the OpenAPI v3.1 JSON schema.\n> \n> - Decompose mixed type: {@link OpenApiV3_1.IJsonSchema.IMixed}\n> - Resolve nullable property: {@link OpenApiV3_1.IJsonSchema.__ISignificant.nullable}\n> - Tuple type is banned: {@link OpenApiV3_1.IJsonSchema.ITuple.prefixItems}\n> - Constant type is banned: {@link OpenApiV3_1.IJsonSchema.IConstant}\n> - Merge {@link OpenApiV3_1.IJsonSchema.IOneOf} to {@link IChatGptSchema.IAnOf}\n> - Merge {@link OpenApiV3_1.IJsonSchema.IAllOf} to {@link IChatGptSchema.IObject}\n> - Merge {@link OpenApiV3_1.IJsonSchema.IRecursiveReference} to {@link IChatGptSchema.IReference}\n> - When {@link IChatGptSchema.IConfig.strict} mode\n>   - Every object properties must be required\n>   - Do not allow {@link IChatGptSchema.IObject.additionalProperties}\n> \n> If compare with the {@link OpenApi.IJsonSchema}, the emended JSON schema specification,\n> \n> - {@link IChatGptSchema.IAnyOf} instead of the {@link OpenApi.IJsonSchema.IOneOf}\n> - {@link IChatGptSchema.IParameters.$defs} instead of the {@link OpenApi.IJsonSchema.IComponents.schemas}\n> - {@link IChatGptSchema.IString.enum} instead of the {@link OpenApi.IJsonSchema.IConstant}\n> - {@link IChatGptSchema.additionalProperties} is fixed to `false`\n> - No tuple type {@link OpenApi.IJsonSchema.ITuple} support\n> - When {@link IChatGptSchema.IConfig.strict} mode\n>   - Every object properties must be required\n>   - Do not allow {@link IChatGptSchema.IObject.additionalProperties}\n> \n> For reference, if you've composed the `IChatGptSchema` type with the\n> {@link IChatGptSchema.IConfig.reference} `false` option (default is `false`),\n> only the recursived named types would be archived into the\n> {@link IChatGptSchema.IParameters.$defs}, and the others would be ecaped from the\n> {@link IChatGptSchema.IReference} type.\n> \n> Also, ChatGPT has banned below constraint properties. Instead, I'll will\n> fill the {@link IChatGptSchema.__IAttribute.description} property with\n> the comment text like `\"@format uuid\"`.\n> \n> - {@link OpenApi.IJsonSchema.INumber.minimum}\n> - {@link OpenApi.IJsonSchema.INumber.maximum}\n> - {@link OpenApi.IJsonSchema.INumber.multipleOf}\n> - {@link OpenApi.IJsonSchema.IString.minLength}\n> - {@link OpenApi.IJsonSchema.IString.maxLength}\n> - {@link OpenApi.IJsonSchema.IString.format}\n> - {@link OpenApi.IJsonSchema.IString.pattern}\n> - {@link OpenApi.IJsonSchema.IString.contentMediaType}\n> - {@link OpenApi.IJsonSchema.IString.default}\n> - {@link OpenApi.IJsonSchema.IArray.minItems}\n> - {@link OpenApi.IJsonSchema.IArray.maxItems}\n> - {@link OpenApi.IJsonSchema.IArray.unique}"
                                },
                                {
                                    type: "object",
                                    properties: {
                                        "enum": {
                                            title: "Enumeration values",
                                            description: "Enumeration values.",
                                            type: "array",
                                            items: {
                                                type: "boolean"
                                            }
                                        },
                                        type: {
                                            title: "Discriminator value of the type",
                                            type: "string",
                                            "enum": [
                                                "boolean"
                                            ]
                                        },
                                        title: {
                                            title: "Title of the schema",
                                            description: "Title of the schema.",
                                            type: "string"
                                        },
                                        description: {
                                            title: "Detailed description of the schema",
                                            description: "Detailed description of the schema.",
                                            type: "string"
                                        },
                                        deprecated: {
                                            title: "Whether the type is deprecated or not",
                                            description: "Whether the type is deprecated or not.",
                                            type: "boolean"
                                        },
                                        example: {
                                            title: "Example value",
                                            description: "Example value."
                                        },
                                        examples: {
                                            description: "Construct a type with a set of properties K of type T",
                                            type: "object",
                                            properties: {},
                                            required: [],
                                            additionalProperties: {}
                                        }
                                    },
                                    required: [
                                        "type"
                                    ],
                                    description: "Boolean type info.\n\n------------------------------\n\nDescription of the current {@link IChatGptSchema.IBoolean} type:\n\n> Boolean type info.\n\n------------------------------\n\nDescription of the parent {@link IChatGptSchema} type:\n\n> Type schema info of the ChatGPT.\n> \n> `IChatGptSchema` is a type schema info of the ChatGPT function calling.\n> \n> `IChatGptSchema` basically follows the JSON schema definition of the OpenAPI v3.1\n> speciifcation; {@link OpenApiV3_1.IJsonSchema}.\n> \n> However, the `IChatGptSchema` does not follow the entire specification of\n> the OpenAPI v3.1. It has own specific restrictions and definitions. Here is the\n> list of how `IChatGptSchema` is different with the OpenAPI v3.1 JSON schema.\n> \n> - Decompose mixed type: {@link OpenApiV3_1.IJsonSchema.IMixed}\n> - Resolve nullable property: {@link OpenApiV3_1.IJsonSchema.__ISignificant.nullable}\n> - Tuple type is banned: {@link OpenApiV3_1.IJsonSchema.ITuple.prefixItems}\n> - Constant type is banned: {@link OpenApiV3_1.IJsonSchema.IConstant}\n> - Merge {@link OpenApiV3_1.IJsonSchema.IOneOf} to {@link IChatGptSchema.IAnOf}\n> - Merge {@link OpenApiV3_1.IJsonSchema.IAllOf} to {@link IChatGptSchema.IObject}\n> - Merge {@link OpenApiV3_1.IJsonSchema.IRecursiveReference} to {@link IChatGptSchema.IReference}\n> - When {@link IChatGptSchema.IConfig.strict} mode\n>   - Every object properties must be required\n>   - Do not allow {@link IChatGptSchema.IObject.additionalProperties}\n> \n> If compare with the {@link OpenApi.IJsonSchema}, the emended JSON schema specification,\n> \n> - {@link IChatGptSchema.IAnyOf} instead of the {@link OpenApi.IJsonSchema.IOneOf}\n> - {@link IChatGptSchema.IParameters.$defs} instead of the {@link OpenApi.IJsonSchema.IComponents.schemas}\n> - {@link IChatGptSchema.IString.enum} instead of the {@link OpenApi.IJsonSchema.IConstant}\n> - {@link IChatGptSchema.additionalProperties} is fixed to `false`\n> - No tuple type {@link OpenApi.IJsonSchema.ITuple} support\n> - When {@link IChatGptSchema.IConfig.strict} mode\n>   - Every object properties must be required\n>   - Do not allow {@link IChatGptSchema.IObject.additionalProperties}\n> \n> For reference, if you've composed the `IChatGptSchema` type with the\n> {@link IChatGptSchema.IConfig.reference} `false` option (default is `false`),\n> only the recursived named types would be archived into the\n> {@link IChatGptSchema.IParameters.$defs}, and the others would be ecaped from the\n> {@link IChatGptSchema.IReference} type.\n> \n> Also, ChatGPT has banned below constraint properties. Instead, I'll will\n> fill the {@link IChatGptSchema.__IAttribute.description} property with\n> the comment text like `\"@format uuid\"`.\n> \n> - {@link OpenApi.IJsonSchema.INumber.minimum}\n> - {@link OpenApi.IJsonSchema.INumber.maximum}\n> - {@link OpenApi.IJsonSchema.INumber.multipleOf}\n> - {@link OpenApi.IJsonSchema.IString.minLength}\n> - {@link OpenApi.IJsonSchema.IString.maxLength}\n> - {@link OpenApi.IJsonSchema.IString.format}\n> - {@link OpenApi.IJsonSchema.IString.pattern}\n> - {@link OpenApi.IJsonSchema.IString.contentMediaType}\n> - {@link OpenApi.IJsonSchema.IString.default}\n> - {@link OpenApi.IJsonSchema.IArray.minItems}\n> - {@link OpenApi.IJsonSchema.IArray.maxItems}\n> - {@link OpenApi.IJsonSchema.IArray.unique}"
                                },
                                {
                                    $ref: "#/$defs/IChatGptSchema.IArray"
                                },
                                {
                                    type: "object",
                                    properties: {
                                        $ref: {
                                            title: "Reference to the named schema",
                                            description: "Reference to the named schema.\n\nThe `ref` is a reference to the named schema. Format of the `$ref` is\nfollowing the JSON Pointer specification. In the OpenAPI, the `$ref`\nstarts with `#/$defs/` which means the type is stored in\nthe {@link IChatGptSchema.IParameters.$defs} object.\n\n- `#/$defs/SomeObject`\n- `#/$defs/AnotherObject`",
                                            type: "string"
                                        },
                                        title: {
                                            title: "Title of the schema",
                                            description: "Title of the schema.",
                                            type: "string"
                                        },
                                        description: {
                                            title: "Detailed description of the schema",
                                            description: "Detailed description of the schema.",
                                            type: "string"
                                        },
                                        deprecated: {
                                            title: "Whether the type is deprecated or not",
                                            description: "Whether the type is deprecated or not.",
                                            type: "boolean"
                                        },
                                        example: {
                                            title: "Example value",
                                            description: "Example value."
                                        },
                                        examples: {
                                            description: "Construct a type with a set of properties K of type T",
                                            type: "object",
                                            properties: {},
                                            required: [],
                                            additionalProperties: {}
                                        }
                                    },
                                    required: [
                                        "$ref"
                                    ],
                                    description: "Reference type directing named schema.\n\n------------------------------\n\nDescription of the current {@link IChatGptSchema.IReference} type:\n\n> Reference type directing named schema.\n\n------------------------------\n\nDescription of the parent {@link IChatGptSchema} type:\n\n> Type schema info of the ChatGPT.\n> \n> `IChatGptSchema` is a type schema info of the ChatGPT function calling.\n> \n> `IChatGptSchema` basically follows the JSON schema definition of the OpenAPI v3.1\n> speciifcation; {@link OpenApiV3_1.IJsonSchema}.\n> \n> However, the `IChatGptSchema` does not follow the entire specification of\n> the OpenAPI v3.1. It has own specific restrictions and definitions. Here is the\n> list of how `IChatGptSchema` is different with the OpenAPI v3.1 JSON schema.\n> \n> - Decompose mixed type: {@link OpenApiV3_1.IJsonSchema.IMixed}\n> - Resolve nullable property: {@link OpenApiV3_1.IJsonSchema.__ISignificant.nullable}\n> - Tuple type is banned: {@link OpenApiV3_1.IJsonSchema.ITuple.prefixItems}\n> - Constant type is banned: {@link OpenApiV3_1.IJsonSchema.IConstant}\n> - Merge {@link OpenApiV3_1.IJsonSchema.IOneOf} to {@link IChatGptSchema.IAnOf}\n> - Merge {@link OpenApiV3_1.IJsonSchema.IAllOf} to {@link IChatGptSchema.IObject}\n> - Merge {@link OpenApiV3_1.IJsonSchema.IRecursiveReference} to {@link IChatGptSchema.IReference}\n> - When {@link IChatGptSchema.IConfig.strict} mode\n>   - Every object properties must be required\n>   - Do not allow {@link IChatGptSchema.IObject.additionalProperties}\n> \n> If compare with the {@link OpenApi.IJsonSchema}, the emended JSON schema specification,\n> \n> - {@link IChatGptSchema.IAnyOf} instead of the {@link OpenApi.IJsonSchema.IOneOf}\n> - {@link IChatGptSchema.IParameters.$defs} instead of the {@link OpenApi.IJsonSchema.IComponents.schemas}\n> - {@link IChatGptSchema.IString.enum} instead of the {@link OpenApi.IJsonSchema.IConstant}\n> - {@link IChatGptSchema.additionalProperties} is fixed to `false`\n> - No tuple type {@link OpenApi.IJsonSchema.ITuple} support\n> - When {@link IChatGptSchema.IConfig.strict} mode\n>   - Every object properties must be required\n>   - Do not allow {@link IChatGptSchema.IObject.additionalProperties}\n> \n> For reference, if you've composed the `IChatGptSchema` type with the\n> {@link IChatGptSchema.IConfig.reference} `false` option (default is `false`),\n> only the recursived named types would be archived into the\n> {@link IChatGptSchema.IParameters.$defs}, and the others would be ecaped from the\n> {@link IChatGptSchema.IReference} type.\n> \n> Also, ChatGPT has banned below constraint properties. Instead, I'll will\n> fill the {@link IChatGptSchema.__IAttribute.description} property with\n> the comment text like `\"@format uuid\"`.\n> \n> - {@link OpenApi.IJsonSchema.INumber.minimum}\n> - {@link OpenApi.IJsonSchema.INumber.maximum}\n> - {@link OpenApi.IJsonSchema.INumber.multipleOf}\n> - {@link OpenApi.IJsonSchema.IString.minLength}\n> - {@link OpenApi.IJsonSchema.IString.maxLength}\n> - {@link OpenApi.IJsonSchema.IString.format}\n> - {@link OpenApi.IJsonSchema.IString.pattern}\n> - {@link OpenApi.IJsonSchema.IString.contentMediaType}\n> - {@link OpenApi.IJsonSchema.IString.default}\n> - {@link OpenApi.IJsonSchema.IArray.minItems}\n> - {@link OpenApi.IJsonSchema.IArray.maxItems}\n> - {@link OpenApi.IJsonSchema.IArray.unique}"
                                },
                                {
                                    $ref: "#/$defs/IChatGptSchema.IAnyOf"
                                },
                                {
                                    type: "object",
                                    properties: {
                                        title: {
                                            title: "Title of the schema",
                                            description: "Title of the schema.",
                                            type: "string"
                                        },
                                        description: {
                                            title: "Detailed description of the schema",
                                            description: "Detailed description of the schema.",
                                            type: "string"
                                        },
                                        deprecated: {
                                            title: "Whether the type is deprecated or not",
                                            description: "Whether the type is deprecated or not.",
                                            type: "boolean"
                                        },
                                        example: {
                                            title: "Example value",
                                            description: "Example value."
                                        },
                                        examples: {
                                            description: "Construct a type with a set of properties K of type T",
                                            type: "object",
                                            properties: {},
                                            required: [],
                                            additionalProperties: {}
                                        }
                                    },
                                    required: [],
                                    description: "Unknown, the `any` type.\n\n------------------------------\n\nDescription of the current {@link IChatGptSchema.IUnknown} type:\n\n> Unknown, the `any` type.\n\n------------------------------\n\nDescription of the parent {@link IChatGptSchema} type:\n\n> Type schema info of the ChatGPT.\n> \n> `IChatGptSchema` is a type schema info of the ChatGPT function calling.\n> \n> `IChatGptSchema` basically follows the JSON schema definition of the OpenAPI v3.1\n> speciifcation; {@link OpenApiV3_1.IJsonSchema}.\n> \n> However, the `IChatGptSchema` does not follow the entire specification of\n> the OpenAPI v3.1. It has own specific restrictions and definitions. Here is the\n> list of how `IChatGptSchema` is different with the OpenAPI v3.1 JSON schema.\n> \n> - Decompose mixed type: {@link OpenApiV3_1.IJsonSchema.IMixed}\n> - Resolve nullable property: {@link OpenApiV3_1.IJsonSchema.__ISignificant.nullable}\n> - Tuple type is banned: {@link OpenApiV3_1.IJsonSchema.ITuple.prefixItems}\n> - Constant type is banned: {@link OpenApiV3_1.IJsonSchema.IConstant}\n> - Merge {@link OpenApiV3_1.IJsonSchema.IOneOf} to {@link IChatGptSchema.IAnOf}\n> - Merge {@link OpenApiV3_1.IJsonSchema.IAllOf} to {@link IChatGptSchema.IObject}\n> - Merge {@link OpenApiV3_1.IJsonSchema.IRecursiveReference} to {@link IChatGptSchema.IReference}\n> - When {@link IChatGptSchema.IConfig.strict} mode\n>   - Every object properties must be required\n>   - Do not allow {@link IChatGptSchema.IObject.additionalProperties}\n> \n> If compare with the {@link OpenApi.IJsonSchema}, the emended JSON schema specification,\n> \n> - {@link IChatGptSchema.IAnyOf} instead of the {@link OpenApi.IJsonSchema.IOneOf}\n> - {@link IChatGptSchema.IParameters.$defs} instead of the {@link OpenApi.IJsonSchema.IComponents.schemas}\n> - {@link IChatGptSchema.IString.enum} instead of the {@link OpenApi.IJsonSchema.IConstant}\n> - {@link IChatGptSchema.additionalProperties} is fixed to `false`\n> - No tuple type {@link OpenApi.IJsonSchema.ITuple} support\n> - When {@link IChatGptSchema.IConfig.strict} mode\n>   - Every object properties must be required\n>   - Do not allow {@link IChatGptSchema.IObject.additionalProperties}\n> \n> For reference, if you've composed the `IChatGptSchema` type with the\n> {@link IChatGptSchema.IConfig.reference} `false` option (default is `false`),\n> only the recursived named types would be archived into the\n> {@link IChatGptSchema.IParameters.$defs}, and the others would be ecaped from the\n> {@link IChatGptSchema.IReference} type.\n> \n> Also, ChatGPT has banned below constraint properties. Instead, I'll will\n> fill the {@link IChatGptSchema.__IAttribute.description} property with\n> the comment text like `\"@format uuid\"`.\n> \n> - {@link OpenApi.IJsonSchema.INumber.minimum}\n> - {@link OpenApi.IJsonSchema.INumber.maximum}\n> - {@link OpenApi.IJsonSchema.INumber.multipleOf}\n> - {@link OpenApi.IJsonSchema.IString.minLength}\n> - {@link OpenApi.IJsonSchema.IString.maxLength}\n> - {@link OpenApi.IJsonSchema.IString.format}\n> - {@link OpenApi.IJsonSchema.IString.pattern}\n> - {@link OpenApi.IJsonSchema.IString.contentMediaType}\n> - {@link OpenApi.IJsonSchema.IString.default}\n> - {@link OpenApi.IJsonSchema.IArray.minItems}\n> - {@link OpenApi.IJsonSchema.IArray.maxItems}\n> - {@link OpenApi.IJsonSchema.IArray.unique}"
                                },
                                {
                                    type: "object",
                                    properties: {
                                        type: {
                                            title: "Discriminator value of the type",
                                            type: "string",
                                            "enum": [
                                                "null"
                                            ]
                                        },
                                        title: {
                                            title: "Title of the schema",
                                            description: "Title of the schema.",
                                            type: "string"
                                        },
                                        description: {
                                            title: "Detailed description of the schema",
                                            description: "Detailed description of the schema.",
                                            type: "string"
                                        },
                                        deprecated: {
                                            title: "Whether the type is deprecated or not",
                                            description: "Whether the type is deprecated or not.",
                                            type: "boolean"
                                        },
                                        example: {
                                            title: "Example value",
                                            description: "Example value."
                                        },
                                        examples: {
                                            description: "Construct a type with a set of properties K of type T",
                                            type: "object",
                                            properties: {},
                                            required: [],
                                            additionalProperties: {}
                                        }
                                    },
                                    required: [
                                        "type"
                                    ],
                                    description: "Null type.\n\n------------------------------\n\nDescription of the current {@link IChatGptSchema.INull} type:\n\n> Null type.\n\n------------------------------\n\nDescription of the parent {@link IChatGptSchema} type:\n\n> Type schema info of the ChatGPT.\n> \n> `IChatGptSchema` is a type schema info of the ChatGPT function calling.\n> \n> `IChatGptSchema` basically follows the JSON schema definition of the OpenAPI v3.1\n> speciifcation; {@link OpenApiV3_1.IJsonSchema}.\n> \n> However, the `IChatGptSchema` does not follow the entire specification of\n> the OpenAPI v3.1. It has own specific restrictions and definitions. Here is the\n> list of how `IChatGptSchema` is different with the OpenAPI v3.1 JSON schema.\n> \n> - Decompose mixed type: {@link OpenApiV3_1.IJsonSchema.IMixed}\n> - Resolve nullable property: {@link OpenApiV3_1.IJsonSchema.__ISignificant.nullable}\n> - Tuple type is banned: {@link OpenApiV3_1.IJsonSchema.ITuple.prefixItems}\n> - Constant type is banned: {@link OpenApiV3_1.IJsonSchema.IConstant}\n> - Merge {@link OpenApiV3_1.IJsonSchema.IOneOf} to {@link IChatGptSchema.IAnOf}\n> - Merge {@link OpenApiV3_1.IJsonSchema.IAllOf} to {@link IChatGptSchema.IObject}\n> - Merge {@link OpenApiV3_1.IJsonSchema.IRecursiveReference} to {@link IChatGptSchema.IReference}\n> - When {@link IChatGptSchema.IConfig.strict} mode\n>   - Every object properties must be required\n>   - Do not allow {@link IChatGptSchema.IObject.additionalProperties}\n> \n> If compare with the {@link OpenApi.IJsonSchema}, the emended JSON schema specification,\n> \n> - {@link IChatGptSchema.IAnyOf} instead of the {@link OpenApi.IJsonSchema.IOneOf}\n> - {@link IChatGptSchema.IParameters.$defs} instead of the {@link OpenApi.IJsonSchema.IComponents.schemas}\n> - {@link IChatGptSchema.IString.enum} instead of the {@link OpenApi.IJsonSchema.IConstant}\n> - {@link IChatGptSchema.additionalProperties} is fixed to `false`\n> - No tuple type {@link OpenApi.IJsonSchema.ITuple} support\n> - When {@link IChatGptSchema.IConfig.strict} mode\n>   - Every object properties must be required\n>   - Do not allow {@link IChatGptSchema.IObject.additionalProperties}\n> \n> For reference, if you've composed the `IChatGptSchema` type with the\n> {@link IChatGptSchema.IConfig.reference} `false` option (default is `false`),\n> only the recursived named types would be archived into the\n> {@link IChatGptSchema.IParameters.$defs}, and the others would be ecaped from the\n> {@link IChatGptSchema.IReference} type.\n> \n> Also, ChatGPT has banned below constraint properties. Instead, I'll will\n> fill the {@link IChatGptSchema.__IAttribute.description} property with\n> the comment text like `\"@format uuid\"`.\n> \n> - {@link OpenApi.IJsonSchema.INumber.minimum}\n> - {@link OpenApi.IJsonSchema.INumber.maximum}\n> - {@link OpenApi.IJsonSchema.INumber.multipleOf}\n> - {@link OpenApi.IJsonSchema.IString.minLength}\n> - {@link OpenApi.IJsonSchema.IString.maxLength}\n> - {@link OpenApi.IJsonSchema.IString.format}\n> - {@link OpenApi.IJsonSchema.IString.pattern}\n> - {@link OpenApi.IJsonSchema.IString.contentMediaType}\n> - {@link OpenApi.IJsonSchema.IString.default}\n> - {@link OpenApi.IJsonSchema.IArray.minItems}\n> - {@link OpenApi.IJsonSchema.IArray.maxItems}\n> - {@link OpenApi.IJsonSchema.IArray.unique}"
                                }
                            ]
                        },
                        description: {
                            title: "Description of the function",
                            description: "Description of the function.\n\n`IHttpLlmFunction.description` is composed by below rule:\n\n1. Starts from the {@link OpenApi.IOperation.summary} paragraph.\n2. The next paragraphs are filled with the\n   {@link OpenApi.IOperation.description}. By the way, if the first\n   paragraph of {@link OpenApi.IOperation.description} is same with the\n   {@link OpenApi.IOperation.summary}, it would not be duplicated.\n3. Parameters' descriptions are added with `@param` tag.\n4. {@link OpenApi.IOperation.security Security requirements} are added\n   with `@security` tag.\n5. Tag names are added with `@tag` tag.\n6. If {@link OpenApi.IOperation.deprecated}, `@deprecated` tag is added.\n\nFor reference, the `description` is very important property to teach\nthe purpose of the function to the LLM (Language Large Model), and\nLLM actually determines which function to call by the description.\n\nAlso, when the LLM conversates with the user, the `description` is\nused to explain the function to the user. Therefore, the `description`\nproperty has the highest priroity, and you have to consider it.",
                            type: "string"
                        },
                        deprecated: {
                            title: "Whether the function is deprecated or not",
                            description: "Whether the function is deprecated or not.\n\nIf the `deprecated` is `true`, the function is not recommended to use.\n\nLLM (Large Language Model) may not use the deprecated function.",
                            type: "boolean"
                        },
                        tags: {
                            title: "Category tags for the function",
                            description: "Category tags for the function.\n\nSame with {@link OpenApi.IOperation.tags} indicating the category of the function.",
                            type: "array",
                            items: {
                                type: "string"
                            }
                        }
                    },
                    required: [
                        "method",
                        "path",
                        "name",
                        "parameters"
                    ]
                }
            },
            description: "Get list of API functions.\n\nIf user seems like to request some function calling except this one,\ncall this `getApiFunctions()` to get the list of candidate API functions\nprovided from this application.\n\nAlso, user just wants to list up every remote API functions that can be\ncalled from the backend server, utilize this function too."
        }
    ]
}.functions[0];
const SYSTEM_PROMPT = [
    "You are a helpful assistant.",
    "",
    "Use the supplied tools to assist the user.",
].join("\n");
