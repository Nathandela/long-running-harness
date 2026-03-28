/**
 * MessagePort protocol for UI-thread <-> AudioWorklet communication.
 * All messages are typed discriminated unions for type safety.
 */

/** Messages sent from UI thread to AudioWorklet */
export type EngineCommand =
  | {
      type: "init";
      sampleRate: number;
      sharedBuffers: {
        metering: SharedArrayBuffer;
        transport: SharedArrayBuffer;
      };
    }
  | { type: "play" }
  | { type: "pause" }
  | { type: "stop" }
  | { type: "seek"; positionSeconds: number }
  | { type: "set-bpm"; bpm: number };

/** Messages sent from AudioWorklet to UI thread */
export type EngineEvent =
  | { type: "ready" }
  | { type: "error"; message: string }
  | { type: "state-change"; state: "playing" | "paused" | "stopped" };

export type MessagePortProtocol = {
  command: EngineCommand;
  event: EngineEvent;
};

/**
 * Type-safe message sender for the engine command channel.
 */
export function postEngineCommand(
  port: MessagePort,
  command: EngineCommand,
): void {
  port.postMessage(command);
}

/**
 * Type-safe message sender for engine events.
 */
export function postEngineEvent(port: MessagePort, event: EngineEvent): void {
  port.postMessage(event);
}
