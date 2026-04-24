import React, { useMemo, useCallback } from 'react';
import ReactFlow, { Background, Controls, MarkerType, applyNodeChanges, applyEdgeChanges } from 'reactflow';
import 'reactflow/dist/style.css';

const DependencyGraph = ({ tasks }) => {
  // Calculate nodes and edges based on tasks
  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    const nodes = [];
    const edges = [];
    
    if (!tasks || tasks.length === 0) return { nodes, edges };

    // Simple layout logic: calculate depth (level) for each task
    const taskLevels = {};
    const getLevel = (taskId, visited = new Set()) => {
      if (visited.has(taskId)) return 0; // Prevent infinite loop in case of bad data
      if (taskLevels[taskId] !== undefined) return taskLevels[taskId];
      
      const task = tasks.find(t => t.id === taskId);
      if (!task || !task.dependencies || task.dependencies.length === 0) {
        taskLevels[taskId] = 0;
        return 0;
      }
      
      visited.add(taskId);
      const depLevels = task.dependencies.map(d => getLevel(d.dependencyTask?.id || d.dependencyId, visited));
      const level = Math.max(...depLevels, -1) + 1;
      taskLevels[taskId] = level;
      return level;
    };
    
    tasks.forEach(t => getLevel(t.id));
    
    // Group tasks by level to distribute them on the Y axis
    const currentLevelCount = {};
    
    tasks.forEach(task => {
      const level = taskLevels[task.id] || 0;
      const count = currentLevelCount[level] || 0;
      currentLevelCount[level] = count + 1;
      
      const isBlocked = task.status === 'BLOCKED';
      const isCritical = task.priority === 'URGENT' || task.priority === 'HIGH';
      const isCompleted = task.status === 'COMPLETED';
      
      // Styling rules for nodes
      let borderStyle = '1px solid rgba(255,255,255,0.1)';
      let bgColor = '#1a1d27'; // Dark background
      
      if (isBlocked) {
        borderStyle = '2px solid #ef4444'; // Red for blocked
        bgColor = 'rgba(239, 68, 68, 0.1)';
      } else if (isCompleted) {
        borderStyle = '1px solid #10b981'; // Green for completed
        bgColor = 'rgba(16, 185, 129, 0.05)';
      } else if (isCritical) {
        borderStyle = '2px solid #f59e0b'; // Orange for critical
      }
      
      nodes.push({
        id: task.id,
        // Calculate X (based on depth) and Y (based on sibling count)
        position: { x: level * 300, y: count * 100 },
        data: { 
          label: (
            <div style={{ textAlign: 'left', padding: '4px' }}>
              <div style={{ fontWeight: '600', fontSize: '12px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{task.title}</div>
              <div style={{ fontSize: '10px', marginTop: '6px', display: 'flex', gap: '6px' }}>
                <span style={{ color: isBlocked ? '#ef4444' : isCompleted ? '#10b981' : '#a0a6bd' }}>{task.status.replace('_', ' ')}</span>
                <span style={{ color: isCritical ? '#f59e0b' : '#a0a6bd' }}>• {task.priority}</span>
              </div>
            </div>
          )
        },
        style: {
          background: bgColor,
          color: '#fff',
          border: borderStyle,
          borderRadius: '8px',
          padding: '8px',
          width: 200,
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.2)'
        }
      });
      
      if (task.dependencies) {
        task.dependencies.forEach(dep => {
          const depId = dep.dependencyTask?.id || dep.dependencyId;
          const isDepCompleted = tasks.find(t => t.id === depId)?.status === 'COMPLETED';
          
          edges.push({
            id: `e-${depId}-${task.id}`,
            source: depId,
            target: task.id,
            // Animate edge if the dependency is not completed (representing active data flow/wait state)
            animated: !isDepCompleted,
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: isDepCompleted ? '#10b981' : '#6366f1'
            },
            style: { 
              stroke: isDepCompleted ? '#10b981' : '#6366f1',
              strokeWidth: 2
            }
          });
        });
      }
    });
    
    return { nodes, edges };
  }, [tasks]);

  const [nodes, setNodes] = React.useState(initialNodes);
  const [edges, setEdges] = React.useState(initialEdges);

  React.useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges]);

  const onNodesChange = useCallback((changes) => setNodes((nds) => applyNodeChanges(changes, nds)), []);
  const onEdgesChange = useCallback((changes) => setEdges((eds) => applyEdgeChanges(changes, eds)), []);

  return (
    <div style={{ height: '600px', width: '100%', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', background: 'var(--bg-primary)' }}>
      <ReactFlow 
        nodes={nodes} 
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
        attributionPosition="bottom-right"
      >
        <Background color="rgba(255,255,255,0.05)" gap={20} size={1} />
        <Controls />
      </ReactFlow>
    </div>
  );
};

export default DependencyGraph;
