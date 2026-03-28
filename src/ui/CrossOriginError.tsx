export function CrossOriginError(): React.JSX.Element {
  return (
    <div
      role="alert"
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#000",
        color: "#fff",
        fontFamily: "JetBrains Mono, monospace",
        padding: "32px",
      }}
    >
      <div style={{ maxWidth: "480px", textAlign: "center" }}>
        <h1
          style={{ fontSize: "24px", marginBottom: "16px", color: "#ff3333" }}
        >
          Cross-Origin Isolation Required
        </h1>
        <p style={{ fontSize: "14px", lineHeight: 1.6 }}>
          BRUTALWAV requires <code>SharedArrayBuffer</code> for real-time audio
          processing. Your server must set these headers:
        </p>
        <pre
          style={{
            textAlign: "left",
            backgroundColor: "#111",
            padding: "16px",
            marginTop: "16px",
            fontSize: "12px",
            border: "2px solid #333",
          }}
        >
          {`Cross-Origin-Opener-Policy: same-origin\nCross-Origin-Embedder-Policy: require-corp`}
        </pre>
      </div>
    </div>
  );
}
