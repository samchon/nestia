import { AppBar, Button, Input, Toolbar, Typography } from "@mui/material";
import { NestiaChatAgent } from "@nestia/agent";
import React from "react";

export const NestiaChatMovie = () => {
  const handleKeyUp = async (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      await handleSend();
    }
  };

  const handleSend = async () => {};

  return (
    <React.Fragment>
      <AppBar>
        <Toolbar>
          <Typography variant="h6"> Nestia A.I. Chatbot </Typography>
        </Toolbar>
      </AppBar>
      <AppBar>
        <Toolbar>
          <Input
            id="conversate_input"
            fullWidth
            placeholder="Conversate with A.I. Chatbot"
            onKeyUp={handleKeyUp}
          />
          <Button variant="contained" onClick={handleSend}>
            Send
          </Button>
        </Toolbar>
      </AppBar>
    </React.Fragment>
  );
};
export namespace NestiaChatMovie {
  export interface IProps {
    agent: NestiaChatAgent;
  }
}
