import { create } from 'zustand';
import { Message, ChatSession } from '../../types';

interface ChatStore {
  currentSession: ChatSession | null;
  sessions: ChatSession[];
  isLoading: boolean;
  
  // Actions
  createNewSession: () => void;
  addMessage: (message: Message) => void;
  setLoading: (loading: boolean) => void;
  clearSession: () => void;
  loadSession: (sessionId: string) => void;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  currentSession: null,
  sessions: [],
  isLoading: false,
  
  createNewSession: () => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    set((state) => ({
      currentSession: newSession,
      sessions: [...state.sessions, newSession],
    }));
  },
  
  addMessage: (message: Message) => {
    set((state) => {
      if (!state.currentSession) {
        // 세션이 없으면 새로 생성
        const newSession: ChatSession = {
          id: Date.now().toString(),
          messages: [message],
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        return {
          currentSession: newSession,
          sessions: [...state.sessions, newSession],
        };
      }
      
      // 기존 세션에 메시지 추가
      const updatedSession = {
        ...state.currentSession,
        messages: [...state.currentSession.messages, message],
        updatedAt: new Date(),
      };
      
      const updatedSessions = state.sessions.map((session) =>
        session.id === updatedSession.id ? updatedSession : session
      );
      
      return {
        currentSession: updatedSession,
        sessions: updatedSessions,
      };
    });
  },
  
  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },
  
  clearSession: () => {
    set({ currentSession: null });
  },
  
  loadSession: (sessionId: string) => {
    set((state) => {
      const session = state.sessions.find((s) => s.id === sessionId);
      return { currentSession: session || null };
    });
  },
}));