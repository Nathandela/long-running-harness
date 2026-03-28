/**
 * React Context for UseTransportReturn.
 * Separated from the provider component for react-refresh compatibility.
 */

import { createContext } from "react";
import type { UseTransportReturn } from "./use-transport";

export const TransportCtx = createContext<UseTransportReturn | null>(null);
