import { DocsThemeConfig } from "nextra-theme-docs";
import { useConfig } from "nextra-theme-docs";
import React from "react";

const config: DocsThemeConfig = {
  logo: () => (
    <>
      <img src="/favicon/android-chrome-192x192.png" width={32} height={32} />
      <span
        style={{
          fontWeight: "bold",
          fontSize: "1.2rem",
          paddingLeft: 10,
          paddingRight: 10,
        }}
      >
        Nestia
      </span>
      <span>NestJS Helper Libraries</span>
    </>
  ),
  project: {
    link: "https://github.com/samchon/nestia",
  },
  chat: {
    link: "https://discord.gg/E94XhzrUCZ",
  },
  docsRepositoryBase: "https://github.com/samchon/nestia/blob/master/website",
  footer: {
    content: () => (
      <span>
        Made by{" "}
        <a
          href="https://github.com/samchon"
          target="_blank"
          style={{ color: "blue" }}
        >
          <u> Samchon </u>
        </a>
      </span>
    ),
  },
  head: () => {
    const config = useConfig();
    return (
      <>
        <title>
          {"Nestia > "}
          {config.title}
        </title>
        <link rel="manifest" href="/favicon/site.webmanifest" />
        {/* ICONS */}
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/favicon/apple-touch-icon.png"
        />
        {[16, 32].map((size) => (
          <link
            key={size}
            rel="icon"
            type="image/png"
            sizes={`${size}x${size}`}
            href={`/favicon/favicon-${size}x${size}.png`}
          />
        ))}
        {/* OG */}
        <meta name="og:type" content="object" />
        <meta name="og:site_name" content="Nestia Guide Documents" />
        <meta name="og:url" content="https://nestia.io" />
        <meta name="og:image" content="/og.jpg" />
        <meta name="og:title" content="Nestia Guide Documents" />
        <meta name="og:description" content="NestJS Helper Libraries" />
        {/* TWITTER */}
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:site" content="@SamchonGithub" />
        <meta name="twitter:image" content="https://nestia.io/og.jpg" />
        <meta name="twitter:title" content="Nestia Guide Documents" />
        <meta name="twitter:description" content="NestJS Helper Libraries" />
      </>
    );
  },
};

export default config;
