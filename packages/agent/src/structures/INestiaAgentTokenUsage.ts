export interface INestiaAgentTokenUsage {
  total: number;
  prompt: INestiaAgentTokenUsage.IPrompt;
  completion: INestiaAgentTokenUsage.ICompletion;
}
export namespace INestiaAgentTokenUsage {
  export interface IPrompt {
    total: number;
    audio: number;
    cached: number;
  }
  export interface ICompletion {
    total: number;
    accepted_prediction: number;
    audio: number;
    reasoning: number;
    rejected_prediction: number;
  }
}
