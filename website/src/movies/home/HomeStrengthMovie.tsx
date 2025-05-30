import { Box, Container, Grid } from "@mui/material";
import React from "react";

import HomeCodeBlock from "../../components/home/HomeCodeBlock";
import HomeStrengthSectionMovie from "./HomeStrengthSectionMovie";

const BLUE = "rgb(0, 200, 255)";
const GREEN = "rgb(80, 200, 0)";
const PURPLE = "rgb(191, 64, 191)";
const YELLOW = "#DEC20B";

const sections: HomeStrengthSectionMovie.Props[] = [
  {
    title: "Super-fast Performance",
    subTitle: (
      <React.Fragment>
        <span style={{ color: PURPLE }}>@</span>
        <span style={{ color: BLUE }}>TypedBody()</span>
        <span style={{ color: "gray" }}>{" input: "}</span>
        <span style={{ color: GREEN }}>IArticleCreate</span>
      </React.Fragment>
    ),
    description: (
      <React.Fragment>
        <p>
          <b>20,000x faster</b> than <i>class-validator</i>.
        </p>
        <br />
        <p>
          <b>200x faster</b> than <i>class-transformer</i>.
        </p>
        <br />
        <p>
          Composite performance becomes <b>10x faster</b>.
        </p>
      </React.Fragment>
    ),
    image: "/favicon/android-chrome-512x512.png",
    href: "/docs/core/TypedBody",
    width: 125,
  },
  {
    title: "Software Development Kit",
    subTitle: <HomeCodeBlock>npx nestia sdk</HomeCodeBlock>,
    description: (
      <React.Fragment>
        <p>
          Collection of typed <HomeCodeBlock>fetch</HomeCodeBlock> functions.
        </p>
        <br />
        <p>Automatically generated by compiler.</p>
        <br />
        <p>
          Similar with <i>tRPC</i>, but fully automated.
        </p>
      </React.Fragment>
    ),
    image: "/images/home/sdk.png",
    href: "/docs/sdk",
  },
  {
    title: "Mockup Simulator",
    subTitle: (
      <React.Fragment>
        <span style={{ color: "gray" }}>{"{ "}</span>
        <span style={{ color: GREEN }}>{"simulate: "}</span>
        <span style={{ color: BLUE }}>{"true"}</span>
        <span style={{ color: "gray" }}>{" }"}</span>
      </React.Fragment>
    ),
    description: (
      <React.Fragment>
        <p>Mockup Simulator embedded in SDK.</p>
        <br />
        <p>Simulates backend API.</p>
        <br />
        <p>
          Based on{" "}
          <i>
            <span style={{ color: BLUE }}>typia</span>
            <span style={{ color: "gray" }}>.</span>
            <span style={{ color: PURPLE }}>assert</span>
            <span style={{ color: "gray" }}>{"<"}</span>
            <span style={{ color: GREEN }}>T</span>
            <span style={{ color: "gray" }}>{">"}</span>
          </i>
          ,{" "}
          <i>
            <span style={{ color: BLUE }}>typia</span>
            <span style={{ color: "gray" }}>.</span>
            <span style={{ color: PURPLE }}>random</span>
            <span style={{ color: "gray" }}>{"<"}</span>
            <span style={{ color: GREEN }}>T</span>
            <span style={{ color: "gray" }}>{">"}</span>
          </i>
        </p>
      </React.Fragment>
    ),
    image: "/images/home/random.png",
    href: "/docs/sdk/simulate",
  },
  {
    title: "WebSocket RPC",
    subTitle: (
      <React.Fragment>
        <span style={{ color: PURPLE }}>@</span>
        <span style={{ color: BLUE }}>{"WebSocketRoute"}</span>
        {"."}
        <span style={{ color: YELLOW }}>{"Acceptor()"}</span>
      </React.Fragment>
    ),
    description: (
      <React.Fragment>
        <p>WebSocket RPC with NestJS.</p>
        <br />
        <p>
          Much easier than <HomeCodeBlock>@WebSocketGateway()</HomeCodeBlock>.
        </p>
        <br />
        <p>Supports SDK library generation</p>
      </React.Fragment>
    ),
    image: "/images/home/websocket.svg",
    href: "/docs/core/WebSocketRoute",
  },
  {
    title: "TypeScript Swagger Editor",
    subTitle: (
      <React.Fragment>
        <span style={{ color: BLUE }}>TypeScript IDE</span>
        {" + "}
        <span style={{ color: GREEN }}>Swagger/UI</span>
      </React.Fragment>
    ),
    description: (
      <React.Fragment>
        <p>Web based TypeScript Editor IDE</p>
        <br />
        <p>Swagger to NestJS/SDK</p>
        <br />
        <p>Supports Mockup Simulator</p>
      </React.Fragment>
    ),
    image: "/images/home/swagger.png",
    href: "/docs/swagger/editor",
  },
  {
    title: "Super A.I. Chatbot",
    subTitle: (
      <React.Fragment>
        <span style={{ color: BLUE }}>Agentic AI</span>
        {" by "}
        <span style={{ color: GREEN }}>Swagger Document</span>
      </React.Fragment>
    ),
    description: (
      <React.Fragment>
        <p>Swagger operations to LLM function schemas</p>
        <br />
        <p>Converse your backend server to A.I. chatbot</p>
        <br />
        <p>The best tool for A.I. chatbot development</p>
      </React.Fragment>
    ),
    image: "/images/home/openai.svg",
    href: "/docs/swagger/chat",
  },
];

const HomeStrengthMovie = () => (
  <Box sx={{ display: "flex" }}>
    <Container
      sx={{
        mt: 3,
        display: "flex",
        position: "relative",
      }}
    >
      <Grid container spacing={3}>
        {sections.map(HomeStrengthSectionMovie)}
      </Grid>
    </Container>
  </Box>
);
export default HomeStrengthMovie;
