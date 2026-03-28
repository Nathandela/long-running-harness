/**
 * DFS cycle detection for audio routing graph (INV-1).
 * Runs on every routing mutation to prevent feedback loops (R-UNW-05).
 * Insert-only topology is acyclic by construction, but this infrastructure
 * exists for E13 (Advanced Mixer Routing) with sends and aux buses.
 */

export class RoutingGraph {
  private readonly adjacency = new Map<string, Set<string>>();

  addNode(id: string): void {
    if (!this.adjacency.has(id)) {
      this.adjacency.set(id, new Set());
    }
  }

  removeNode(id: string): void {
    this.adjacency.delete(id);
    for (const edges of this.adjacency.values()) {
      edges.delete(id);
    }
  }

  addEdge(from: string, to: string): void {
    this.addNode(from);
    this.addNode(to);
    const edges = this.adjacency.get(from);
    if (edges) edges.add(to);
  }

  removeEdge(from: string, to: string): void {
    this.adjacency.get(from)?.delete(to);
  }

  getNodes(): readonly string[] {
    return [...this.adjacency.keys()];
  }

  getEdges(from: string): ReadonlySet<string> {
    return this.adjacency.get(from) ?? new Set();
  }

  /** Check if adding edge from->to would create a cycle without actually adding it */
  wouldCauseCycle(from: string, to: string): boolean {
    // Adding from->to creates a cycle iff there's already a path from to->from
    return hasPath(this, to, from);
  }
}

/** Standard DFS cycle detection using three-color marking */
export function hasCycle(graph: RoutingGraph): boolean {
  const WHITE = 0;
  const GRAY = 1;
  const BLACK = 2;
  const color = new Map<string, number>();

  for (const node of graph.getNodes()) {
    color.set(node, WHITE);
  }

  function dfs(node: string): boolean {
    color.set(node, GRAY);
    for (const neighbor of graph.getEdges(node)) {
      const c = color.get(neighbor);
      if (c === GRAY) return true; // back edge = cycle
      if (c === WHITE && dfs(neighbor)) return true;
    }
    color.set(node, BLACK);
    return false;
  }

  for (const node of graph.getNodes()) {
    if (color.get(node) === WHITE && dfs(node)) {
      return true;
    }
  }

  return false;
}

/** BFS reachability check: is there a path from `start` to `target`? */
function hasPath(graph: RoutingGraph, start: string, target: string): boolean {
  if (start === target) return true;
  const visited = new Set<string>();
  const queue = [start];
  visited.add(start);

  while (queue.length > 0) {
    const current = queue.shift();
    if (current === undefined) break;
    for (const neighbor of graph.getEdges(current)) {
      if (neighbor === target) return true;
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push(neighbor);
      }
    }
  }

  return false;
}
