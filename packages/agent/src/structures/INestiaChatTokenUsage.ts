export interface INestiaChatTokenUsage {
  total: number;
  prompt: INestiaChatTokenUsage.IPrompt;
  completion: INestiaChatTokenUsage.ICompletion;
}
export namespace INestiaChatTokenUsage {
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
