import {
  Button,
  FormControl,
  FormControlLabel,
  FormLabel,
  Radio,
  RadioGroup,
  TextField,
  Typography,
} from "@mui/material";
import { NestiaAgent } from "@nestia/agent";
import { NestiaChatApplication } from "@nestia/chat";
import {
  HttpLlm,
  IHttpConnection,
  IHttpLlmApplication,
  OpenApi,
} from "@samchon/openapi";
import ShoppingApi from "@samchon/shopping-api";
import OpenAI from "openai";
import { useState } from "react";

export default function ShoppingChatApplication() {
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("gpt-4o-mini");
  const [name, setName] = useState("John Doe");
  const [mobile, setMobile] = useState("821012345678");
  const [progress, setProgress] = useState(false);
  const [agent, setAgent] = useState<NestiaAgent | null>(null);

  const openChatApplication = async () => {
    setProgress(true);
    // PREPARE LLM APPLICATION
    const application: IHttpLlmApplication<"chatgpt"> = HttpLlm.application({
      model: "chatgpt",
      document: OpenApi.convert(
        await fetch(
          "https://raw.githubusercontent.com/samchon/shopping-backend/refs/heads/master/packages/api/customer.swagger.json",
        ).then((r) => r.json()),
      ),
    });

    // HANDLESHAKE WITH SHOPPING BACKEND
    const connection: IHttpConnection = {
      host: "https://shopping-be.wrtn.ai",
    };
    await ShoppingApi.functional.shoppings.customers.authenticate.create(
      connection,
      {
        channel_code: "samchon",
        external_user: null,
        href: window.location.href,
        referrer: window.document.referrer,
      },
    );
    await ShoppingApi.functional.shoppings.customers.authenticate.activate(
      connection,
      {
        mobile,
        name,
      },
    );

    // COMPOSE CHAT AGENT
    setAgent(
      new NestiaAgent({
        provider: {
          type: "chatgpt",
          api: new OpenAI({
            apiKey,
            dangerouslyAllowBrowser: true,
          }),
          model: "gpt-4o-mini",
        },
        controllers: [
          {
            protocol: "http",
            name: "shopping",
            application,
            connection,
          },
        ],
      }),
    );
  };

  return (
    <div className="initialDiv">
      <div
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          top: 0,
          left: 0,
          margin: 0,
          overflow: "hidden",
        }}
      >
        {agent ? (
          <NestiaChatApplication agent={agent} />
        ) : (
          <FormControl fullWidth style={{ paddingLeft: 15 }}>
            <Typography variant="h4">Shopping A.I. Chatbot</Typography>
            <hr />
            <br />
            Demonstration of Nestia A.I. Chatbot with Shopping Backend API.
            <br />
            <br />
            <FormLabel> OpenAI Configuration </FormLabel>
            <TextField
              onChange={(e) => setApiKey(e.target.value)}
              defaultValue={apiKey}
              label="OpenAI API Key"
              variant="outlined"
            />
            <br />
            <RadioGroup
              defaultValue={model}
              onChange={(_e, value) => setModel(value)}
              style={{ paddingLeft: 15 }}
            >
              <FormControlLabel
                control={<Radio />}
                label="GPT-4o Mini"
                value="gpt-4o-mini"
              />
              <FormControlLabel
                control={<Radio />}
                label="GPT-4o"
                value="gpt-4o"
              />
            </RadioGroup>
            <br />
            <FormLabel> Membership Information </FormLabel>
            <TextField
              onChange={(e) => setName(e.target.value)}
              defaultValue={name}
              label="Name"
              variant="outlined"
            />
            <TextField
              onChange={(e) => setMobile(e.target.value)}
              defaultValue={mobile}
              label="Mobile"
              variant="outlined"
            />
            <br />
            <br />
            <Button
              component="a"
              fullWidth
              variant="contained"
              color={"info"}
              size="large"
              disabled={progress}
              onClick={() => openChatApplication()}
            >
              {"Opening A.I. Chatbot"}
            </Button>
          </FormControl>
        )}
      </div>
    </div>
  );
}
