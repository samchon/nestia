import Script from "next/script";
import { Head } from "nextra/components";

const title = "Nestia";
const description = "NestJS Helper Libraries";

export const metadata = {
  metadataBase: new URL("https://nestia.io"),
  title: {
    default: title,
    template: "%s | Nestia",
  },
  description,
};

export default function RootLayout(props) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <Head>
        <link rel="manifest" href="/favicon/site.webmanifest" />
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
        <meta name="og:type" content="object" />
        <meta name="og:site_name" content={title} />
        <meta name="og:url" content="https://nestia.io" />
        <meta name="og:image" content="/og.jpg" />
        <meta name="og:title" content={title} />
        <meta name="og:description" content={description} />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:site" content="@SamchonGithub" />
        <meta name="twitter:image" content="/og.jpg" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <Script
          type="text/javascript"
          dangerouslySetInnerHTML={{
            __html: `
(function(c,l,a,r,i,t,y){
    c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
    t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
    y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
})(window, document, "clarity", "script", "gu5qz1srj3");
`,
          }}
        />
        <Script
          async
          src="https://widget.gurubase.io/widget.latest.min.js"
          data-widget-id="HVLr8t1Bl24uyjbA2DeIAz7CmRTzzyvmDiEUxxeQeqg"
          data-text="Ask AI"
          data-margins='{"bottom": "1rem", "right": "1rem"}'
          data-light-mode="true"
          id="guru-widget-id"
        />
      </Head>
      <body>{props.children}</body>
    </html>
  );
}
