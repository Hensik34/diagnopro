import { io, type Socket } from 'socket.io-client';
import api from './client';
import type { ApiResponse } from '../types';

export type WhatsAppConnectionStatus =
  | 'disconnected'
  | 'connecting'
  | 'qr_ready'
  | 'connected'
  | 'session_expired'
  | 'error';

export interface WhatsAppSession {
  id: string;
  branch_id: string;
  status: WhatsAppConnectionStatus;
  phone_number?: string | null;
  wa_jid?: string | null;
  qr_expires_at?: string | null;
  last_connected_at?: string | null;
  last_disconnected_at?: string | null;
  failure_reason?: string | null;
  session_metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  branch?: {
    id: string;
    name: string;
    location?: string;
  };
}

export interface WhatsAppTemplate {
  id: string;
  branch_id: string | null;
  event_key: string;
  template_name: string;
  template_body: string;
  is_enabled: boolean;
  is_system: boolean;
}

export interface WhatsAppMessageLog {
  id: string;
  branch_id: string;
  recipient_phone: string;
  recipient_name?: string | null;
  message_content: string;
  wa_message_id?: string | null;
  delivery_status: 'Pending' | 'Sent' | 'Delivered' | 'Failed' | 'Read';
  created_at: string;
  error_message?: string | null;
}

export interface ConnectResponse {
  session: WhatsAppSession | null;
  qr: {
    qr: string;
    expires_at: string;
  } | null;
}

const API_URL = (import.meta as any).env.VITE_API_URL || 'http://localhost:5000/api';
const SOCKET_URL = API_URL.replace(/\/api$/, '');

let socketRef: Socket | null = null;

export function getWhatsAppSocket(token: string): Socket {
  if (socketRef) {
    socketRef.auth = { token };
    if (!socketRef.connected) {
      socketRef.connect();
    }
    return socketRef;
  }

  socketRef = io(SOCKET_URL, {
    path: '/socket.io',
    transports: ['websocket', 'polling'],
    auth: { token },
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    timeout: 10000,
  });

  return socketRef;
}

export function closeWhatsAppSocket() {
  if (socketRef) {
    socketRef.close();
    socketRef = null;
  }
}

export const whatsappApi = {
  listConnections: async (): Promise<ApiResponse<WhatsAppSession[]>> => {
    const response = await api.get<ApiResponse<WhatsAppSession[]>>('/whatsapp/connections');
    return response.data;
  },

  connect: async (branchId: string): Promise<ApiResponse<ConnectResponse>> => {
    const response = await api.post<ApiResponse<ConnectResponse>>('/whatsapp/connect', { branch_id: branchId });
    return response.data;
  },

  getQr: async (branchId: string): Promise<ApiResponse<{ qr: string; expires_at: string } | null>> => {
    const response = await api.get<ApiResponse<{ qr: string; expires_at: string } | null>>('/whatsapp/qr', {
      params: { branch_id: branchId },
    });
    return response.data;
  },

  getStatus: async (branchId: string): Promise<ApiResponse<{ session: WhatsAppSession | null; qr: any }>> => {
    const response = await api.get<ApiResponse<{ session: WhatsAppSession | null; qr: any }>>('/whatsapp/status', {
      params: { branch_id: branchId },
    });
    return response.data;
  },

  disconnect: async (branchId: string): Promise<ApiResponse<WhatsAppSession>> => {
    const response = await api.post<ApiResponse<WhatsAppSession>>('/whatsapp/disconnect', { branch_id: branchId });
    return response.data;
  },

  sendMessage: async (branchId: string, to: string, message: string): Promise<ApiResponse<WhatsAppMessageLog>> => {
    const response = await api.post<ApiResponse<WhatsAppMessageLog>>('/whatsapp/send', {
      branch_id: branchId,
      to,
      message,
    });
    return response.data;
  },

  listTemplates: async (branchId: string): Promise<ApiResponse<WhatsAppTemplate[]>> => {
    const response = await api.get<ApiResponse<WhatsAppTemplate[]>>('/whatsapp/templates', {
      params: { branch_id: branchId },
    });
    return response.data;
  },

  saveTemplate: async (payload: {
    branch_id: string;
    event_key: string;
    template_name: string;
    template_body: string;
    is_enabled: boolean;
  }): Promise<ApiResponse<WhatsAppTemplate>> => {
    const response = await api.post<ApiResponse<WhatsAppTemplate>>('/whatsapp/templates', payload);
    return response.data;
  },

  deleteTemplate: async (branchId: string, eventKey: string): Promise<ApiResponse<null>> => {
    const response = await api.delete<ApiResponse<null>>(`/whatsapp/templates/${eventKey}`, {
      params: { branch_id: branchId },
    });
    return response.data;
  },

  previewTemplate: async (payload: {
    branch_id: string;
    event_key: string;
    variables: Record<string, string>;
  }): Promise<ApiResponse<{ preview: string }>> => {
    const response = await api.post<ApiResponse<{ preview: string }>>('/whatsapp/templates/preview', payload);
    return response.data;
  },

  getNotificationSettings: async (branchId: string): Promise<ApiResponse<Record<string, boolean>>> => {
    const response = await api.get<ApiResponse<Record<string, boolean>>>('/whatsapp/notification-settings', {
      params: { branch_id: branchId },
    });
    return response.data;
  },

  saveNotificationSetting: async (branchId: string, eventKey: string, isEnabled: boolean): Promise<ApiResponse<any>> => {
    const response = await api.post<ApiResponse<any>>('/whatsapp/notification-settings', {
      branch_id: branchId,
      event_key: eventKey,
      is_enabled: isEnabled,
    });
    return response.data;
  },

  getLogs: async (branchId: string, limit = 30): Promise<ApiResponse<WhatsAppMessageLog[]>> => {
    const response = await api.get<ApiResponse<WhatsAppMessageLog[]>>('/whatsapp/logs', {
      params: { branch_id: branchId, limit },
    });
    return response.data;
  },
};
