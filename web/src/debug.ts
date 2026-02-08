export const renderDebugSection = (container: HTMLElement, raw?: string, error?: string) => {
  container.innerHTML = `
    <details class="debug-panel">
      <summary>Debug Output</summary>
      ${error ? `<div class="debug-error">${error}</div>` : ""}
      <pre class="debug-raw">${raw ?? "No raw output."}</pre>
    </details>
  `;
};
