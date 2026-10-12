"use client";
import "@xyflow/react/dist/style.css";
import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Background, Controls, Handle, Position, ReactFlow, type Edge, type Node, type NodeProps } from "@xyflow/react";
import { layout, NODE_H, NODE_W, type Relation } from "@/lib/tree";

type P = { id: string; slug: string; name: string; epithet: string; born: string | null; died: string | null };
type PersonNode = Node<{ p: P; active: boolean }, "person">;

const hidden = { opacity: 0, width: 1, height: 1, minWidth: 0, minHeight: 0, border: 0 };

function PersonCard({ data }: NodeProps<PersonNode>) {
  const { p, active } = data;
  const life = [p.born, p.died].filter(Boolean).join(" – ");
  return (
    <div
      style={{ width: NODE_W, height: NODE_H }}
      className={`flex cursor-pointer flex-col justify-center rounded-lg border px-3 text-left transition-colors ${
        active ? "border-link bg-link-soft" : "border-line bg-card hover:border-ink"
      }`}
    >
      <Handle type="target" position={Position.Top} id="top" style={hidden} isConnectable={false} />
      <Handle type="source" position={Position.Bottom} id="bottom" style={hidden} isConnectable={false} />
      <Handle type="source" position={Position.Right} id="right" style={hidden} isConnectable={false} />
      <Handle type="target" position={Position.Left} id="left" style={hidden} isConnectable={false} />
      <span className="truncate font-display text-[15px] leading-tight text-ink">{p.name}</span>
      <span className="truncate text-[11px] text-muted">{p.epithet || life || " "}</span>
    </div>
  );
}

const nodeTypes = { person: PersonCard };

/** Interactive family tree. Click a person to open their page. */
export function FamilyTree({ worldSlug, people, relations, focus }: { worldSlug: string; people: P[]; relations: Relation[]; focus?: string }) {
  const router = useRouter();
  const { nodes, edges } = useMemo(() => {
    const pos = new Map(layout(people, relations).map((p) => [p.id, p]));
    const nodes: PersonNode[] = people.map((p) => ({
      id: p.id,
      type: "person",
      position: { x: pos.get(p.id)!.x, y: pos.get(p.id)!.y },
      data: { p, active: p.slug === focus },
      draggable: false,
      connectable: false,
    }));
    const edges: Edge[] = relations.map((r, i) => {
      if (r.kind === "spouse") {
        // Draw left → right so the dashed line sits between the two cards.
        const [a, b] = (pos.get(r.from_id)?.x ?? 0) <= (pos.get(r.to_id)?.x ?? 0) ? [r.from_id, r.to_id] : [r.to_id, r.from_id];
        return { id: `s${i}`, source: a, target: b, sourceHandle: "right", targetHandle: "left", type: "straight",
          style: { stroke: "var(--link)", strokeWidth: 1.5, strokeDasharray: "4 3" } };
      }
      return { id: `p${i}`, source: r.from_id, target: r.to_id, sourceHandle: "bottom", targetHandle: "top", type: "smoothstep",
        style: { stroke: "#8a9087", strokeWidth: 1.25 } };
    });
    return { nodes, edges };
  }, [people, relations, focus]);

  if (!people.length) return <p className="text-muted">No characters yet.</p>;
  return (
    <div className="h-[460px] w-full overflow-hidden rounded-xl border border-line bg-card" role="figure" aria-label="Family tree">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        minZoom={0.3}
        nodesConnectable={false}
        proOptions={{ hideAttribution: true }}
        onNodeClick={(_, n) => {
          const p = people.find((x) => x.id === n.id);
          if (p) router.push(`/w/${worldSlug}/${p.slug}`);
        }}
      >
        <Background gap={24} color="#e3e6df" />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}
