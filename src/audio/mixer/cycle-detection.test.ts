import { describe, it, expect } from "vitest";
import { RoutingGraph, hasCycle } from "./cycle-detection";

describe("DFS cycle detection (INV-1)", () => {
  it("empty graph has no cycle", () => {
    const graph = new RoutingGraph();
    expect(hasCycle(graph)).toBe(false);
  });

  it("single node has no cycle", () => {
    const graph = new RoutingGraph();
    graph.addNode("a");
    expect(hasCycle(graph)).toBe(false);
  });

  it("linear chain has no cycle", () => {
    const graph = new RoutingGraph();
    graph.addNode("a");
    graph.addNode("b");
    graph.addNode("c");
    graph.addEdge("a", "b");
    graph.addEdge("b", "c");
    expect(hasCycle(graph)).toBe(false);
  });

  it("detects simple cycle", () => {
    const graph = new RoutingGraph();
    graph.addNode("a");
    graph.addNode("b");
    graph.addEdge("a", "b");
    graph.addEdge("b", "a");
    expect(hasCycle(graph)).toBe(true);
  });

  it("detects cycle in larger graph", () => {
    const graph = new RoutingGraph();
    graph.addNode("a");
    graph.addNode("b");
    graph.addNode("c");
    graph.addNode("d");
    graph.addEdge("a", "b");
    graph.addEdge("b", "c");
    graph.addEdge("c", "d");
    graph.addEdge("d", "b"); // cycle: b -> c -> d -> b
    expect(hasCycle(graph)).toBe(true);
  });

  it("self-loop is a cycle", () => {
    const graph = new RoutingGraph();
    graph.addNode("a");
    graph.addEdge("a", "a");
    expect(hasCycle(graph)).toBe(true);
  });

  it("wouldCauseCycle checks hypothetical edge", () => {
    const graph = new RoutingGraph();
    graph.addNode("a");
    graph.addNode("b");
    graph.addNode("c");
    graph.addEdge("a", "b");
    graph.addEdge("b", "c");

    // Adding c -> a would create cycle
    expect(graph.wouldCauseCycle("c", "a")).toBe(true);
    // Adding a -> c would not (already path a->b->c)
    expect(graph.wouldCauseCycle("a", "c")).toBe(false);
  });

  it("removeEdge breaks cycle", () => {
    const graph = new RoutingGraph();
    graph.addNode("a");
    graph.addNode("b");
    graph.addEdge("a", "b");
    graph.addEdge("b", "a");
    expect(hasCycle(graph)).toBe(true);

    graph.removeEdge("b", "a");
    expect(hasCycle(graph)).toBe(false);
  });

  it("removeNode cleans up edges", () => {
    const graph = new RoutingGraph();
    graph.addNode("a");
    graph.addNode("b");
    graph.addNode("c");
    graph.addEdge("a", "b");
    graph.addEdge("b", "c");
    graph.addEdge("c", "a");
    expect(hasCycle(graph)).toBe(true);

    graph.removeNode("b");
    expect(hasCycle(graph)).toBe(false);
  });
});
