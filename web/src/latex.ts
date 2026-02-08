import katex from "katex";

const renderLatexSegment = (segment: string, displayMode: boolean) =>
  katex.renderToString(segment, {
    throwOnError: false,
    displayMode
  });

export const renderTextWithLatex = (text: string) => {
  if (!text) return "";

  const blockRegex = /\\\[([\s\S]*?)\\\]/g;
  const inlineRegex = /\\\(([\s\S]*?)\\\)/g;

  let html = text.replace(blockRegex, (_match, latex) => {
    return renderLatexSegment(latex.trim(), true);
  });

  html = html.replace(inlineRegex, (_match, latex) => {
    return renderLatexSegment(latex.trim(), false);
  });

  return html;
};
