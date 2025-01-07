export interface INestiaChatCost {
  total: number;
  prompt: INestiaChatCost.IPrompt;
  completion: INestiaChatCost.ICompletion;
}
export namespace INestiaChatCost {
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
