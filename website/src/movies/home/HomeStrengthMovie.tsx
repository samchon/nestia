"use client";

import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Container,
  Grid,
  Typography,
} from "@mui/material";

import HomeSectionHeading from "../../components/home/HomeSectionHeading";
import { PALETTE } from "../../constants/PALETTE";

interface FeatureCardProps {
  icon: string;
  title: string;
  code: string;
  metric?: string;
  metricNote?: string;
  description: string;
  href: string;
}

const features: FeatureCardProps[] = [
  {
    icon: "/favicon/android-chrome-512x512.png",
    title: "Super-fast Validation",
    code: "@TypedBody() input: T",
    metric: "20,000x faster",
    metricNote: "than class-validator",
    description:
      "AOT-compiled runtime validators powered by typia. Supports complex union types, recursive structures, and the most detailed error reporting.",
    href: "/docs/core/TypedBody",
  },
  {
    icon: "/images/home/sdk.png",
    title: "Type-safe SDK",
    code: "npx nestia sdk",
    metric: "Zero manual work",
    metricNote: "fully automated",
    description:
      "Auto-generate a collection of typed fetch functions from your NestJS controllers. Like tRPC, but requires no code modification.",
    href: "/docs/sdk",
  },
  {
    icon: "/images/home/random.png",
    title: "Mockup Simulator",
    code: "{ simulate: true }",
    metric: "Frontend first",
    metricNote: "no backend needed",
    description:
      "SDK-embedded mockup simulator that mimics your backend API. Based on typia.assert and typia.random for realistic mock data.",
    href: "/docs/sdk/simulate",
  },
  {
    icon: "/images/home/websocket.svg",
    title: "WebSocket RPC",
    code: "@WebSocketRoute.Acceptor()",
    metric: "Much easier",
    metricNote: "than @WebSocketGateway",
    description:
      "Type-safe WebSocket RPC with NestJS. Full SDK generation support, seamless integration with the nestia ecosystem.",
    href: "/docs/core/WebSocketRoute",
  },
  {
    icon: "/images/home/swagger.png",
    title: "Swagger Editor",
    code: "TypeScript IDE + Swagger/UI",
    metric: "All-in-one",
    metricNote: "editor + simulator",
    description:
      "Web-based TypeScript IDE with Swagger UI. Convert any Swagger document to NestJS project with SDK and mockup simulator.",
    href: "/docs/swagger/editor",
  },
  {
    icon: "/images/home/openai.svg",
    title: "AI Chatbot",
    code: "Agentic AI by Swagger",
    metric: "Instant",
    metricNote: "Swagger to AI agent",
    description:
      "Convert Swagger operations to LLM function calling schemas. Turn your backend server into an AI chatbot with a single command.",
    href: "/docs/swagger/chat",
  },
];

const FeatureCard = (props: FeatureCardProps) => (
  <Grid item xs={12} sm={6} md={4}>
    <Card
      variant="outlined"
      sx={{
        height: "100%",
        backgroundColor: PALETTE.WASH,
        borderColor: PALETTE.BORDER,
        transition: "all 0.2s ease",
        "&:hover": {
          borderColor: PALETTE.RED,
          backgroundColor: PALETTE.SOFT,
        },
      }}
    >
      <CardActionArea
        href={props.href}
        sx={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          p: 0,
        }}
      >
        <CardContent sx={{ p: 3, width: "100%" }}>
          <Box
            component="img"
            src={props.icon}
            alt={props.title}
            sx={{ height: 72, width: 72, objectFit: "contain", mb: 2 }}
          />
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              fontSize: "1.05rem",
              mb: 0.5,
              color: PALETTE.INK,
            }}
          >
            {props.title}
          </Typography>
          <Typography
            sx={{
              fontFamily:
                "'Fira Code', 'JetBrains Mono', monospace",
              fontSize: "0.82rem",
              color: PALETTE.RED_DEEP,
              mb: 1,
            }}
          >
            {props.code}
          </Typography>
          {props.metric && (
            <Typography sx={{ fontSize: "0.85rem", mb: 1.5 }}>
              <span style={{ color: PALETTE.RED, fontWeight: 600 }}>
                {props.metric}
              </span>
              {props.metricNote && (
                <span
                  style={{
                    color: PALETTE.MUTED,
                    fontWeight: 400,
                  }}
                >
                  {" "}
                  ({props.metricNote})
                </span>
              )}
            </Typography>
          )}
          <Typography
            variant="body2"
            sx={{
              color: PALETTE.MUTED,
              lineHeight: 1.65,
              fontSize: "0.88rem",
            }}
          >
            {props.description}
          </Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  </Grid>
);

const HomeStrengthMovie = () => (
  <Box sx={{ py: { xs: 6, md: 10 } }}>
    <Container maxWidth="lg">
      <HomeSectionHeading title="Key Features" maxWidth={600}>
        One library. Pure TypeScript types. Everything you need for NestJS.
      </HomeSectionHeading>
      <Grid container spacing={3}>
        {features.map((f) => (
          <FeatureCard key={f.title} {...f} />
        ))}
      </Grid>
    </Container>
  </Box>
);
export default HomeStrengthMovie;
