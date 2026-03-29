/**
 * Modulation Matrix panel: drag-to-connect UI with SVG cable visualization.
 * Source list on left, destination list on right.
 * Active routes shown as colored cables with amount controls.
 *
 * Keyboard flow: Enter on source port starts connection mode,
 * Tab to destination port, Enter to confirm. Escape cancels.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { tokens } from "@ui/tokens/tokens";
import {
  useModulationStore,
  MOD_SOURCE_LABELS,
  MOD_DEST_LABELS,
} from "@state/synth/modulation-store";
import {
  MOD_SOURCES,
  MOD_DESTINATIONS,
  type ModSource,
  type ModDestination,
} from "@audio/synth/modulation-types";

import type { ModRoute } from "@audio/synth/modulation-types";

type Props = {
  trackId: string;
};

const EMPTY_ROUTES: readonly ModRoute[] = [];

const BORDER = "var(--border)";

const LABEL_STYLE: React.CSSProperties = {
  fontFamily: tokens.font.mono,
  fontSize: tokens.text.xs,
  color: tokens.color.gray300,
  textTransform: "uppercase",
  letterSpacing: "0.1em",
};

// Cable colors per source (cycle through for visual distinction)
const SOURCE_COLORS: Record<ModSource, string> = {
  lfo1: tokens.color.blue,
  lfo2: tokens.color.pink,
  ampEnv: tokens.color.amber,
  filterEnv: tokens.color.green,
  velocity: tokens.color.orange,
  aftertouch: tokens.color.violet,
  modWheel: tokens.color.cyan,
  pitchBend: tokens.color.hotpink,
};

const PORT_STYLE: React.CSSProperties = {
  width: 12,
  height: 12,
  borderRadius: "50%",
  backgroundColor: tokens.color.gray900,
  cursor: "pointer",
  flexShrink: 0,
  padding: 0,
  background: "none",
};

function Port({
  testId,
  color,
  label,
  highlight,
  onMouseDown,
  onMouseUp,
  onKeyAction,
}: {
  testId: string;
  color: string;
  label: string;
  highlight?: boolean;
  onMouseDown?: () => void;
  onMouseUp?: () => void;
  onKeyAction?: () => void;
}): React.JSX.Element {
  return (
    <button
      type="button"
      data-testid={testId}
      aria-label={label}
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUp}
      onKeyDown={(e) => {
        if (e.key === "Enter" && onKeyAction) {
          e.preventDefault();
          onKeyAction();
        }
      }}
      style={{
        ...PORT_STYLE,
        border: `2px solid ${color}`,
        outline:
          highlight === true ? `2px solid ${tokens.color.white}` : undefined,
        outlineOffset: 2,
      }}
    />
  );
}

export function ModulationMatrix({ trackId }: Props): React.JSX.Element {
  const routes = useModulationStore(
    (s) => s.matrices[trackId]?.routes ?? EMPTY_ROUTES,
  );
  const initMatrix = useModulationStore((s) => s.initMatrix);
  const addRoute = useModulationStore((s) => s.addRoute);
  const removeRoute = useModulationStore((s) => s.removeRoute);
  const updateAmount = useModulationStore((s) => s.updateRouteAmount);
  const toggleBipolar = useModulationStore((s) => s.toggleRouteBipolar);

  useEffect(() => {
    initMatrix(trackId);
  }, [trackId, initMatrix]);

  const [dragSource, setDragSource] = useState<ModSource | null>(null);
  const [connectingSource, setConnectingSource] = useState<ModSource | null>(
    null,
  );
  const [announcement, setAnnouncement] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const activeSource = dragSource ?? connectingSource;

  const handleSrcMouseDown = useCallback((source: ModSource) => {
    setDragSource(source);
  }, []);

  const handleDestMouseUp = useCallback(
    (destination: ModDestination) => {
      if (dragSource) {
        addRoute(trackId, dragSource, destination);
        setDragSource(null);
      }
    },
    [dragSource, trackId, addRoute],
  );

  const handleGlobalMouseUp = useCallback(() => {
    setDragSource(null);
  }, []);

  // Keyboard: start connecting from source
  const handleSrcKeyAction = useCallback(
    (source: ModSource) => {
      if (connectingSource === source) {
        setConnectingSource(null);
        setAnnouncement("Connection cancelled.");
      } else {
        setConnectingSource(source);
        setAnnouncement(
          `Connecting from ${MOD_SOURCE_LABELS[source]}. Tab to a destination and press Enter to connect.`,
        );
      }
    },
    [connectingSource],
  );

  // Keyboard: complete connection to destination
  const handleDestKeyAction = useCallback(
    (destination: ModDestination) => {
      if (connectingSource) {
        addRoute(trackId, connectingSource, destination);
        setAnnouncement(
          `Connected ${MOD_SOURCE_LABELS[connectingSource]} to ${MOD_DEST_LABELS[destination]}.`,
        );
        setConnectingSource(null);
      }
    },
    [connectingSource, trackId, addRoute],
  );

  // Escape cancels keyboard connection
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape" && connectingSource !== null) {
        setConnectingSource(null);
        setAnnouncement("Connection cancelled.");
      }
    },
    [connectingSource],
  );

  // Clear drag state when mouse released anywhere (including outside component)
  useEffect(() => {
    document.addEventListener("mouseup", handleGlobalMouseUp);
    return () => {
      document.removeEventListener("mouseup", handleGlobalMouseUp);
    };
  }, [handleGlobalMouseUp]);

  return (
    <div
      ref={containerRef}
      data-testid="mod-matrix"
      onMouseUp={handleGlobalMouseUp}
      onKeyDown={handleKeyDown}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: tokens.space[2],
        border: BORDER,
        padding: tokens.space[2],
        backgroundColor: tokens.color.gray900,
        fontFamily: tokens.font.mono,
        fontSize: tokens.text.sm,
        color: tokens.color.gray100,
        userSelect: "none",
      }}
    >
      <span
        style={{
          ...LABEL_STYLE,
          color: tokens.color.blue,
          fontSize: tokens.text.sm,
        }}
      >
        MOD MATRIX
      </span>

      {/* Live region for screen reader announcements */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        style={{
          position: "absolute",
          width: 1,
          height: 1,
          overflow: "hidden",
          clip: "rect(0,0,0,0)",
          whiteSpace: "nowrap",
        }}
      >
        {announcement}
      </div>

      {/* Sources and Destinations side by side */}
      <div style={{ display: "flex", gap: tokens.space[4] }}>
        {/* Sources */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: tokens.space[1],
          }}
        >
          <span style={LABEL_STYLE}>SOURCES</span>
          {MOD_SOURCES.map((src) => (
            <div
              key={src}
              style={{
                display: "flex",
                alignItems: "center",
                gap: tokens.space[1],
              }}
            >
              <span
                style={{
                  ...LABEL_STYLE,
                  width: 80,
                  color:
                    activeSource === src
                      ? SOURCE_COLORS[src]
                      : tokens.color.gray300,
                }}
              >
                {MOD_SOURCE_LABELS[src]}
              </span>
              <Port
                testId={`src-port-${src}`}
                color={SOURCE_COLORS[src]}
                label={`Source: ${MOD_SOURCE_LABELS[src]}`}
                highlight={connectingSource === src}
                onMouseDown={() => {
                  handleSrcMouseDown(src);
                }}
                onKeyAction={() => {
                  handleSrcKeyAction(src);
                }}
              />
            </div>
          ))}
        </div>

        {/* SVG cable visualization area */}
        <div style={{ position: "relative", width: 60, minHeight: 200 }}>
          <svg
            viewBox="0 0 60 200"
            preserveAspectRatio="none"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              pointerEvents: "none",
            }}
          >
            {routes.map((route) => {
              const srcIdx = MOD_SOURCES.indexOf(route.source);
              const destIdx = MOD_DESTINATIONS.indexOf(route.destination);
              const srcY = 20 + srcIdx * 22;
              const destY = 20 + destIdx * 22;
              return (
                <line
                  key={route.id}
                  data-testid={`cable-${route.source}-${route.destination}`}
                  x1={0}
                  y1={srcY}
                  x2={60}
                  y2={destY}
                  stroke={SOURCE_COLORS[route.source]}
                  strokeWidth={2}
                  strokeOpacity={0.7 + Math.abs(route.amount) * 0.3}
                />
              );
            })}
          </svg>
        </div>

        {/* Destinations */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: tokens.space[1],
          }}
        >
          <span style={LABEL_STYLE}>DESTINATIONS</span>
          {MOD_DESTINATIONS.map((dest) => (
            <div
              key={dest}
              style={{
                display: "flex",
                alignItems: "center",
                gap: tokens.space[1],
              }}
            >
              <Port
                testId={`dest-port-${dest}`}
                color={
                  connectingSource !== null
                    ? tokens.color.white
                    : tokens.color.gray500
                }
                label={`Destination: ${MOD_DEST_LABELS[dest]}`}
                onMouseUp={() => {
                  handleDestMouseUp(dest);
                }}
                onKeyAction={() => {
                  handleDestKeyAction(dest);
                }}
              />
              <span style={{ ...LABEL_STYLE, width: 80 }}>
                {MOD_DEST_LABELS[dest]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Active routes list with amount controls */}
      {routes.length > 0 && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: tokens.space[1],
            borderTop: BORDER,
            paddingTop: tokens.space[2],
          }}
        >
          <span style={LABEL_STYLE}>ROUTES</span>
          {routes.map((route) => (
            <div
              key={route.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: tokens.space[2],
                padding: `${String(tokens.space.half)}px 0`,
              }}
            >
              <span
                style={{
                  ...LABEL_STYLE,
                  color: SOURCE_COLORS[route.source],
                  width: 80,
                }}
              >
                {MOD_SOURCE_LABELS[route.source]}
              </span>
              <span style={{ ...LABEL_STYLE, color: tokens.color.gray500 }}>
                {">"}
              </span>
              <span style={{ ...LABEL_STYLE, width: 80 }}>
                {MOD_DEST_LABELS[route.destination]}
              </span>
              <input
                type="range"
                data-testid={`route-amount-${route.id}`}
                min={-1}
                max={1}
                step={0.01}
                value={route.amount}
                onChange={(e) => {
                  updateAmount(trackId, route.id, Number(e.target.value));
                }}
                style={{ width: 80, accentColor: SOURCE_COLORS[route.source] }}
              />
              <span style={{ ...LABEL_STYLE, width: 40, textAlign: "right" }}>
                {(route.amount * 100).toFixed(0)}%
              </span>
              <button
                data-testid={`route-bipolar-${route.id}`}
                aria-label={`Toggle bipolar mode for ${MOD_SOURCE_LABELS[route.source]} to ${MOD_DEST_LABELS[route.destination]}`}
                aria-pressed={route.bipolar}
                onClick={() => {
                  toggleBipolar(trackId, route.id);
                }}
                style={{
                  background: "none",
                  border: `${String(tokens.border.width)}px solid ${route.bipolar ? tokens.color.blue : tokens.color.gray700}`,
                  color: route.bipolar
                    ? tokens.color.blue
                    : tokens.color.gray500,
                  fontFamily: tokens.font.mono,
                  fontSize: tokens.text["2xs"],
                  cursor: "pointer",
                  padding: `${String(tokens.space.px)}px ${String(tokens.space[1] - 1)}px`,
                }}
              >
                {route.bipolar ? "BI" : "UNI"}
              </button>
              <button
                data-testid={`route-delete-${route.id}`}
                aria-label={`Remove route ${MOD_SOURCE_LABELS[route.source]} to ${MOD_DEST_LABELS[route.destination]}`}
                onClick={() => {
                  removeRoute(trackId, route.id);
                }}
                style={{
                  background: "none",
                  border: `${String(tokens.border.width)}px solid ${tokens.color.gray700}`,
                  color: tokens.color.gray500,
                  fontFamily: tokens.font.mono,
                  fontSize: tokens.text.xs,
                  cursor: "pointer",
                  padding: `${String(tokens.space.px)}px ${String(tokens.space[1])}px`,
                }}
              >
                X
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
