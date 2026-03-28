export type {
  AutomationPoint,
  AutomationLane,
  AutomationMode,
  InterpolationMode,
  ParameterTarget,
  ParameterRange,
} from "./automation-types";
export {
  DEFAULT_AUTOMATION_MODE,
  nextLaneId,
  _seedLaneCounter,
  _resetLaneCounter,
} from "./automation-types";
export {
  evaluateCurve,
  denormalize,
  normalize,
  insertPoint,
  removePoint,
  movePoint,
} from "./automation-curve";
export { createAutomationScheduler } from "./automation-scheduler";
export type {
  AutomationScheduler,
  ResolvedParam,
  ParamResolver,
} from "./automation-scheduler";
