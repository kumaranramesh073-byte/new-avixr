/* ═══════════════════════════════════════════════════════════════════════════
   Enterprise GenAI Platform — Core Type Definitions
   ═══════════════════════════════════════════════════════════════════════════ */

// ─── Session & Agent Types ────────────────────────────────────────────────

export type StepType = 'chart' | 'table' | 'map' | 'text';

export type SessionStatus =
  | 'idle'
  | 'planning'
  | 'ready'
  | 'executing'
  | 'done'
  | 'error';

export type StepStatus = 'pending' | 'executing' | 'done' | 'error';

export interface PlanStep {
  id: number;
  title: string;
  description: string;
  type: StepType;
  dataSource: string;
}

export interface ExecutionPlan {
  steps: PlanStep[];
}

// ─── Chart Content ────────────────────────────────────────────────────────

export interface BarConfig {
  key: string;
  color: string;
  name: string;
}

export interface ChartContentData {
  summary: string;
  chartType: 'bar' | 'line';
  data: Record<string, string | number>[];
  xKey: string;
  bars: BarConfig[];
}

// ─── Table Content ────────────────────────────────────────────────────────

export interface TableContentData {
  summary: string;
  columns: string[];
  rows: string[][];
}

// ─── Map Content ──────────────────────────────────────────────────────────

export interface MapLocation {
  name: string;
  lat: number;
  lng: number;
  info: string;
  risk: 'high' | 'medium' | 'low';
}

export interface CausalLink {
  from: string;
  to: string;
  strength: number;
  direction: 'positive' | 'negative' | 'neutral';
  lag: string;
}

export interface RippleEffect {
  trigger: string;
  primaryImpact: string;
  secondaryEffects: string[];
  magnitude: number;
}

export interface SimulationResult {
  causalChain: CausalLink[];
  rippleEffects: RippleEffect[];
  systemStability: number;
  criticalPaths: string[];
  summary: string;
}

export interface ScoreDimension {
  score: number;
  rationale: string;
}

export interface AIStrategy {
  id: string;
  type: string;
  title: string;
  description: string;
  metricLabel: string;
  metricValue: string;
  timeline: string;
  status: 'RECOMMENDED' | 'HIGH IMPACT' | 'OPPORTUNITY';
}

export interface DecisionScore {
  confidence: ScoreDimension;
  impact: ScoreDimension;
  urgency: ScoreDimension;
  feasibility: ScoreDimension;
  compositeScore: number;
  recommendation: string;
  executiveSummary: string;
  rank: 'EXECUTE_NOW' | 'PLAN_AND_EXECUTE' | 'MONITOR_AND_WAIT' | 'DEPRIORITIZE';
  strategies: AIStrategy[];
}

export interface MapContentData {
  summary: string;
  locations: MapLocation[];
}

// ─── Text Content ─────────────────────────────────────────────────────────

export interface TextContentData {
  summary: string;
}

// ─── Unified Content ──────────────────────────────────────────────────────

export type StepContent =
  | ChartContentData
  | TableContentData
  | MapContentData
  | TextContentData;

// ─── Step Result ──────────────────────────────────────────────────────────

export interface StepResult extends PlanStep {
  content: StepContent;
  status: StepStatus;
}

// ─── Session ──────────────────────────────────────────────────────────────

export interface Session {
  id: number;
  backendId?: string;
  query: string;
  plan: ExecutionPlan | null;
  executedSteps: StepResult[];
  currentStep: number;
  progress: number;
  status: SessionStatus;
  simulation?: SimulationResult;
  decisionScore?: DecisionScore;
}

// ─── Data Source ──────────────────────────────────────────────────────────

export interface DataSource {
  name: string;
  type: string;
  records: string;
  status: 'Connected' | 'Syncing' | 'Error' | 'Disconnected';
  health: number;
  lastSync: string;
  region: string;
}

// ─── ML Model ─────────────────────────────────────────────────────────────

export interface MLModel {
  name: string;
  type: string;
  accuracy: string;
  lastTrained: string;
  status: 'Production' | 'Staging' | 'Archived' | 'Training';
  framework: string;
  version: string;
  predictions: string;
}

// ─── Industry Suite ───────────────────────────────────────────────────────

export interface IndustrySuite {
  name: string;
  color: string;
  icon: string;
  apps: string[];
  description: string;
}

// ─── Architecture ─────────────────────────────────────────────────────────

export interface ArchSection {
  title: string;
  items: string[];
  color?: string;
}

// ─── Agent Mode ───────────────────────────────────────────────────────────

export type AgentMode =
  | 'All Agents'
  | 'ML Insight Agent'
  | 'Information Retrieval Agent'
  | 'Dashboard Agent'
  | 'Optimizer Agent'
  | 'Action Execution Agent';

// ─── WebSocket Stream Events ──────────────────────────────────────────────

export type StreamEventType =
  | 'plan_ready'
  | 'step_start'
  | 'step_result'
  | 'step_done'
  | 'session_done'
  | 'error';

export interface StreamEvent {
  type: StreamEventType;
  sessionId: string;
  data: Record<string, unknown>;
  timestamp: number;
}

// ─── Environment ──────────────────────────────────────────────────────────

export type Environment = 'default' | 'production' | 'staging' | 'development';

// ─── Navigation ───────────────────────────────────────────────────────────

export type PageId =
  | 'home'
  | 'session'
  | 'data'
  | 'models'
  | 'manage'
  | 'arch'
  | 'help'
  | 'theme';
