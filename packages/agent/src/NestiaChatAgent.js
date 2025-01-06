"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NestiaChatAgent = void 0;
const ChatGptAgent_1 = require("./chatgpt/ChatGptAgent");
class NestiaChatAgent {
    constructor(props) {
        this.agent = new ChatGptAgent_1.ChatGptAgent(props);
    }
    conversate(content) {
        return this.agent.conversate(content);
    }
    getHistories() {
        return this.agent.getHistories();
    }
    on(type, listener) {
        this.agent.on(type, listener);
    }
}
exports.NestiaChatAgent = NestiaChatAgent;
