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
exports.ChatGptAgent = void 0;
const ChatGptCancelFunctionAgent_1 = require("./ChatGptCancelFunctionAgent");
const ChatGptDescribeFunctionAgent_1 = require("./ChatGptDescribeFunctionAgent");
const ChatGptExecuteFunctionAgent_1 = require("./ChatGptExecuteFunctionAgent");
const ChatGptInitializeFunctionAgent_1 = require("./ChatGptInitializeFunctionAgent");
const ChatGptSelectFunctionAgent_1 = require("./ChatGptSelectFunctionAgent");
class ChatGptAgent {
    constructor(props) {
        var _a;
        this.props = props;
        this.stack_ = [];
        this.histories_ = props.histories ? [...props.histories] : [];
        this.listeners_ = new Map();
        this.initialized_ = false;
        if (!!((_a = props.config) === null || _a === void 0 ? void 0 : _a.capacity) &&
            props.application.functions.length > props.config.capacity) {
            const size = Math.ceil(props.application.functions.length / props.config.capacity);
            const capacity = Math.ceil(props.application.functions.length / size);
            const entireFunctions = props.application.functions.slice();
            this.divide_ = new Array(size)
                .fill(0)
                .map(() => entireFunctions.splice(0, capacity));
        }
    }
    getHistories() {
        return this.histories_;
    }
    conversate(content) {
        return __awaiter(this, void 0, void 0, function* () {
            const index = this.histories_.length;
            const out = () => this.histories_.slice(index);
            // FUNCTIONS ARE NOT LISTED YET
            if (this.initialized_ === false) {
                const output = yield ChatGptInitializeFunctionAgent_1.ChatGptInitializeFunctionAgent.execute({
                    service: this.props.service,
                    histories: this.histories_,
                    config: this.props.config,
                    content,
                });
                this.initialized_ || (this.initialized_ = output.mounted);
                this.histories_.push(...output.prompts);
                if (this.initialized_ === false)
                    return out();
                else
                    this.dispatch({ type: "initialize" });
            }
            // CANCEL CANDIDATE FUNCTIONS
            if (this.stack_.length)
                this.histories_.push(...(yield ChatGptCancelFunctionAgent_1.ChatGptCancelFunctionAgent.execute({
                    application: this.props.application,
                    service: this.props.service,
                    histories: this.histories_,
                    stack: this.stack_,
                    dispatch: (event) => this.dispatch(event),
                    config: this.props.config,
                    content,
                })));
            // SELECT CANDIDATE FUNCTIONS
            this.histories_.push(...(yield ChatGptSelectFunctionAgent_1.ChatGptSelectFunctionAgent.execute({
                application: this.props.application,
                service: this.props.service,
                histories: this.histories_,
                stack: this.stack_,
                dispatch: (event) => this.dispatch(event),
                divide: this.divide_,
                config: this.props.config,
                content,
            })));
            if (this.stack_.length === 0)
                return out();
            // CALL FUNCTIONS
            while (true) {
                const prompts = yield ChatGptExecuteFunctionAgent_1.ChatGptExecuteFunctionAgent.execute({
                    connection: this.props.connection,
                    service: this.props.service,
                    histories: this.histories_,
                    application: this.props.application,
                    functions: Array.from(this.stack_.values()).map((item) => item.function),
                    dispatch: (event) => this.dispatch(event),
                    config: this.props.config,
                    content,
                });
                this.histories_.push(...prompts);
                // EXPLAIN RETURN VALUES
                const calls = prompts.filter((p) => p.kind === "execute");
                for (const c of calls)
                    ChatGptCancelFunctionAgent_1.ChatGptCancelFunctionAgent.cancelFunction({
                        stack: this.stack_,
                        reference: {
                            name: c.function.name,
                            reason: "completed",
                        },
                        dispatch: (event) => this.dispatch(event),
                    });
                if (calls.length !== 0)
                    this.histories_.push(...(yield ChatGptDescribeFunctionAgent_1.ChatGptDescribeFunctionAgent.execute({
                        service: this.props.service,
                        histories: calls,
                        config: this.props.config,
                    })));
                if (calls.length === 0 || this.stack_.length === 0)
                    break;
            }
            return out();
        });
    }
    on(type, listener) {
        take(this.listeners_, type, () => new Set()).add(listener);
    }
    dispatch(event) {
        return __awaiter(this, void 0, void 0, function* () {
            const set = this.listeners_.get(event.type);
            if (set)
                yield Promise.all(Array.from(set).map((listener) => __awaiter(this, void 0, void 0, function* () {
                    try {
                        yield listener(event);
                    }
                    catch (_a) { }
                })));
        });
    }
}
exports.ChatGptAgent = ChatGptAgent;
const take = (dict, key, generator) => {
    const oldbie = dict.get(key);
    if (oldbie)
        return oldbie;
    const value = generator();
    dict.set(key, value);
    return value;
};
