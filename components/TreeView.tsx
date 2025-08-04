
import React, { useMemo, useEffect } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
  Node,
  Edge,
  Position,
  BackgroundVariant,
} from 'reactflow';
import { type Task } from '../types';
import { UserIcon } from './icons/UserIcon';

const NODE_WIDTH = 220;
const NODE_HEIGHT = 80;
const HORIZONTAL_SPACING = 80; // Space between levels
const VERTICAL_SPACING = 40;   // Space between siblings

interface CustomNodeData {
  label: string;
  assignee?: string;
  isRoot?: boolean;
  status?: string;
  completionDate?: string;
}

const CustomTaskNode = ({ data }: { data: Node<CustomNodeData>['data'] }) => {
    const isRoot = data.isRoot;
    const isDone = !isRoot && !!data.completionDate;

    let containerClasses = `p-4 rounded-xl shadow-md border-2 w-[${NODE_WIDTH}px] min-h-[${NODE_HEIGHT}px] flex flex-col justify-center items-center text-center transition-colors duration-300`;
    let titleClasses = `font-bold break-words ${isRoot ? 'text-lg' : 'text-md'}`;
    let assigneeClasses = `flex items-center gap-1.5 mt-2 text-xs`;

    if (isRoot) {
        containerClasses += ' bg-sky-500 text-white border-sky-600';
        assigneeClasses += ' text-sky-200';
    } else if (isDone) {
        containerClasses += ' bg-emerald-100 dark:bg-emerald-900/60 border-emerald-500';
        titleClasses += ' text-emerald-900 dark:text-emerald-100';
        assigneeClasses += ' text-emerald-700 dark:text-emerald-300';
    } else {
        containerClasses += ' bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600';
        titleClasses += ' text-slate-800 dark:text-slate-100';
        assigneeClasses += ' text-slate-500 dark:text-slate-400';
    }
    
    return (
        <div className={containerClasses}>
            <h3 className={titleClasses}>
                {data.label}
            </h3>
            {data.assignee && (
                <div className={assigneeClasses}>
                    <UserIcon />
                    <span>{data.assignee}</span>
                </div>
            )}
        </div>
    );
};


const nodeTypes = { custom: CustomTaskNode };

// Generates a robust right-to-left tree layout.
const generateRtlLayout = (tasks: Task[], projectName: string): { initialNodes: Node<CustomNodeData>[], initialEdges: Edge[] } => {
    if (tasks.length === 0) {
      return {
        initialNodes: [{
            id: 'project-root',
            type: 'custom',
            data: { label: projectName, isRoot: true },
            position: { x: 0, y: 0 },
        }],
        initialEdges: [],
      }
    }

    const tasksById = new Map<string, Task>(tasks.map(t => [t.id, t]));
    const childrenByParentId = new Map<string, string[]>();
    tasks.forEach(t => {
        const parentId = t.parentId && tasksById.has(t.parentId) ? t.parentId : 'project-root';
        if (!childrenByParentId.has(parentId)) childrenByParentId.set(parentId, []);
        childrenByParentId.get(parentId)!.push(t.id);
    });

    const subtreeHeightMap = new Map<string, number>();

    // Pass 1: Post-order traversal to calculate subtree heights.
    const calculateSubtreeHeight = (nodeId: string): number => {
        if (subtreeHeightMap.has(nodeId)) return subtreeHeightMap.get(nodeId)!;

        const children = childrenByParentId.get(nodeId) || [];
        if (children.length === 0) {
            subtreeHeightMap.set(nodeId, NODE_HEIGHT);
            return NODE_HEIGHT;
        }

        let height = 0;
        children.forEach(childId => {
            height += calculateSubtreeHeight(childId);
        });
        height += (children.length - 1) * VERTICAL_SPACING;

        subtreeHeightMap.set(nodeId, height);
        return height;
    };
    
    calculateSubtreeHeight('project-root');

    // Pass 2: Pre-order traversal to assign final positions.
    const finalNodes: Node<CustomNodeData>[] = [];
    const finalEdges: Edge[] = [];

    const layoutNodes = (nodeId: string, depth: number, startY: number) => {
        const task = tasksById.get(nodeId);
        const isRoot = nodeId === 'project-root';
        const children = childrenByParentId.get(nodeId) || [];
        
        const totalHeight = subtreeHeightMap.get(nodeId)!;
        const x = depth * (NODE_WIDTH + HORIZONTAL_SPACING);
        const y = startY + (totalHeight / 2) - (NODE_HEIGHT / 2);

        finalNodes.push({
            id: nodeId,
            type: 'custom',
            data: isRoot ? { label: projectName, isRoot: true } : { label: task!.title, assignee: task!.assignee, status: task!.status, completionDate: task!.completionDate },
            position: { x, y },
            sourcePosition: Position.Left,
            targetPosition: Position.Right,
        });

        let childStartY = startY;
        children.forEach(childId => {
            layoutNodes(childId, depth + 1, childStartY);
            finalEdges.push({
                id: `e-${nodeId}-${childId}`,
                source: nodeId,
                target: childId,
            });
            childStartY += subtreeHeightMap.get(childId)! + VERTICAL_SPACING;
        });
    };
    
    layoutNodes('project-root', 0, 0);

    // RTL Flip
    const maxX = Math.max(...finalNodes.map(n => n.position.x));
    finalNodes.forEach(n => {
        n.position.x = maxX - n.position.x;
    });

    return { initialNodes: finalNodes, initialEdges: finalEdges };
};


interface TreeViewProps {
    tasks: Task[];
    projectName: string;
}

const TreeView: React.FC<TreeViewProps> = ({ tasks, projectName }) => {
    
    const { initialNodes, initialEdges } = useMemo(() => generateRtlLayout(tasks, projectName), [tasks, projectName]);
    
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

    useEffect(() => {
        setNodes(initialNodes);
        setEdges(initialEdges);
    }, [initialNodes, initialEdges, setNodes, setEdges]);

    if (tasks.length === 0) {
        return (
          <div className="flex justify-center items-center h-[50vh] bg-slate-100 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800">
            <p className="text-xl text-slate-600 dark:text-slate-400">هیچ تسکی برای نمایش در نمای درختی وجود ندارد.</p>
          </div>
        );
    }
    
    return (
        <div style={{ height: 'calc(100vh - 5rem)' }} className="bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-lg">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                nodeTypes={nodeTypes}
                fitView
                fitViewOptions={{ padding: 0.2, maxZoom: 1.2 }}
                defaultEdgeOptions={{
                    type: 'smoothstep',
                    markerEnd: {
                        type: MarkerType.ArrowClosed,
                        width: 20,
                        height: 20,
                        color: '#64748b', // slate-500
                    },
                    style: {
                        strokeWidth: 2.5,
                        stroke: '#64748b', // slate-500
                    },
                }}
                nodesDraggable={false}
                nodesConnectable={false}
                proOptions={{ hideAttribution: true }}
            >
                <Controls showInteractive={false} />
                <MiniMap nodeStrokeWidth={3} zoomable pannable />
                <Background variant={BackgroundVariant.Dots} gap={24} size={1} className="dark:opacity-30" />
            </ReactFlow>
        </div>
    );
};

export default TreeView;