'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/use-auth';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  joinBranch: (branchId: string) => void;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  joinBranch: () => {},
});

export function useSocket() {
  return useContext(SocketContext);
}

interface SocketProviderProps {
  children: React.ReactNode;
}

export function SocketProvider({ children }: SocketProviderProps) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { user } = useAuth();

  const playNotificationSound = useCallback(() => {
    if (typeof window !== 'undefined') {
      const audio = new Audio('/notification.mp3');
      audio.play().catch(() => {
        // Ignore audio play errors (browser autoplay policy)
      });
    }
  }, []);

  const joinBranch = useCallback(
    (branchId: string) => {
      if (socket && isConnected) {
        socket.emit('join-branch', { branchId });
      }
    },
    [socket, isConnected],
  );

  useEffect(() => {
    if (!user) {
      // Disconnect if user logs out
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    // Get token from localStorage
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

    // Create socket connection
    const newSocket = io(`${backendUrl}/notifications`, {
      auth: {
        token,
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    newSocket.on('connect', () => {
      console.log('Socket connected:', newSocket.id);
      setIsConnected(true);
    });

    newSocket.on('connected', (data) => {
      console.log('Socket authenticated:', data);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setIsConnected(false);
    });

    // Order events
    newSocket.on('order:new', (data) => {
      console.log('New order received:', data);
      playNotificationSound();

      if (user.role === 'KITCHEN') {
        toast.success(`🍳 Yeni Sipariş!`, {
          description: `Masa ${data.tableNumber} - ${data.items?.length || 0} ürün`,
          duration: 5000,
        });
      } else if (user.role === 'OWNER' || user.role === 'MANAGER') {
        toast.info(`📋 Yeni Sipariş`, {
          description: `Masa ${data.tableNumber}`,
          duration: 3000,
        });
      }
    });

    newSocket.on('order:status-changed', (data) => {
      console.log('Order status changed:', data);

      if (user.role === 'KITCHEN') {
        // Kitchen receives all status changes
        const statusLabels: Record<string, string> = {
          PENDING: 'Beklemede',
          CONFIRMED: 'Onaylandı',
          PREPARING: 'Hazırlanıyor',
          READY: 'Hazır',
          SERVED: 'Servis Edildi',
          COMPLETED: 'Tamamlandı',
          CANCELLED: 'İptal',
        };

        toast.info(`📊 Sipariş Durumu Değişti`, {
          description: `Masa ${data.tableNumber} - ${statusLabels[data.status] || data.status}`,
          duration: 3000,
        });
      }
    });

    newSocket.on('order:ready', (data) => {
      console.log('Order ready:', data);

      if (user.role === 'WAITER') {
        playNotificationSound();
        toast.success(`✅ Sipariş Hazır!`, {
          description: `Masa ${data.tableNumber} servise hazır`,
          duration: 8000,
        });
      }
    });

    newSocket.on('payment:completed', (data) => {
      console.log('Payment completed:', data);

      if (user.role === 'OWNER' || user.role === 'MANAGER') {
        toast.success(`💰 Ödeme Alındı`, {
          description: `Fatura No: ${data.invoiceNumber} - ${data.totalAmount.toFixed(2)} TL`,
          duration: 4000,
        });
      }
    });

    newSocket.on('table:status-changed', (data) => {
      console.log('Table status changed:', data);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
      setSocket(null);
      setIsConnected(false);
    };
  }, [user, playNotificationSound]);

  return (
    <SocketContext.Provider value={{ socket, isConnected, joinBranch }}>
      {children}
    </SocketContext.Provider>
  );
}
