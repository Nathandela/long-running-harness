import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  fallbackLabel?: string;
};

type State = {
  error: Error | null;
};

export class ErrorBoundary extends Component<Props, State> {
  override state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  override render(): ReactNode {
    const { error } = this.state;
    if (error === null) {
      return this.props.children;
    }

    const label = this.props.fallbackLabel ?? "Something went wrong";

    return (
      <div
        role="alert"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem",
          gap: "1rem",
          color: "var(--color-red)",
          backgroundColor: "var(--color-black)",
          minHeight: "120px",
        }}
      >
        <h2 style={{ margin: 0, fontSize: "1.25rem" }}>{label}</h2>
        <p
          style={{
            margin: 0,
            fontSize: "0.875rem",
            color: "var(--color-gray-300)",
            maxWidth: "40ch",
            textAlign: "center",
          }}
        >
          {error.message}
        </p>
        <button
          type="button"
          onClick={() => {
            window.location.reload();
          }}
          style={{
            padding: "0.5rem 1.5rem",
            border: "var(--border-width) solid var(--color-red)",
            background: "transparent",
            color: "var(--color-red)",
            cursor: "pointer",
            fontSize: "0.875rem",
          }}
        >
          Reload
        </button>
      </div>
    );
  }
}
