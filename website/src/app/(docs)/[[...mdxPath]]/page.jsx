import { generateStaticParamsFor, importPage } from "nextra/pages";

import { useMDXComponents as getMDXComponents } from "../../../../mdx-components";

const generateAllStaticParams = generateStaticParamsFor("mdxPath");

export async function generateStaticParams() {
  const params = await generateAllStaticParams();
  return params.filter(({ mdxPath = [] }) => mdxPath[0] !== "blog");
}

export async function generateMetadata(props) {
  const params = await props.params;

  const { metadata } = await importPage(params.mdxPath);
  return metadata;
}

const Wrapper = getMDXComponents().wrapper;

export default async function Page(props) {
  const params = await props.params;

  const result = await importPage(params.mdxPath);
  const { default: MDXContent, toc, metadata } = result;

  // The sidebar wash is scoped to docs routes via `body:has(...)` in
  // global.css, so the landing keeps a plain white gutter. This marker is
  // what that selector keys off.
  const isDocsPage = params.mdxPath?.[0] === "docs";

  return (
    <Wrapper toc={toc} metadata={metadata}>
      {isDocsPage && (
        <span className="nestia-docs-page-marker" aria-hidden="true" hidden />
      )}
      <MDXContent {...props} params={params} />
    </Wrapper>
  );
}
