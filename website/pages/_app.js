import Script from "next/script";

import "../src/styles/unset.css";

export default function Nextra({ Component, pageProps }) {
  const getLayout = Component.getLayout || ((page) => page);
  return (
    <>
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
      {getLayout(<Component {...pageProps} />)}
    </>
  );
}
