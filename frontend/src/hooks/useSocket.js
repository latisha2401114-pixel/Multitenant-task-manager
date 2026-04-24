import { useEffect } from 'react';
import { io } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';

export const useSocket = () => {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isAuthenticated) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    // Connect to Socket.IO backend server
    const socket = io('/', {
      auth: { token },
      // Optional fallback configs
      transports: ['websocket', 'polling']
    });

    socket.on('connect', () => {
      console.log('Connected to real-time task updates');
    });

    // Real-time task creation
    socket.on('task_created', (newTask) => {
      console.log('Real-time event: task_created', newTask);
      
      // Instantly update the React Query cache without refetching
      queryClient.setQueryData(['tasks'], (oldTasks) => {
        if (!oldTasks) return [newTask];
        // Prevent duplicates
        if (oldTasks.some(t => t.id === newTask.id)) return oldTasks;
        return [newTask, ...oldTasks];
      });
      
      // Invalidate workload insights to ensure stats stay accurate
      queryClient.invalidateQueries({ queryKey: ['insights'] });
    });

    // Real-time task updates
    socket.on('task_updated', (updatedTask) => {
      console.log('Real-time event: task_updated', updatedTask);
      
      // Instantly update the React Query cache without refetching
      queryClient.setQueryData(['tasks'], (oldTasks) => {
        if (!oldTasks) return oldTasks;
        return oldTasks.map(t => t.id === updatedTask.id ? { ...t, ...updatedTask } : t);
      });
      
      // Invalidate workload insights to ensure stats stay accurate
      queryClient.invalidateQueries({ queryKey: ['insights'] });
    });

    // Cleanup on unmount or logout
    return () => {
      socket.disconnect();
    };
  }, [isAuthenticated, queryClient]);
};
