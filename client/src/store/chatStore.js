import { create } from 'zustand';

export const useChatStore = create((set) => ({
  activeRoomId: null,
  unreadCount: 0,
  unreadByRoom: {},

  setActiveRoomId: (id) => set({ activeRoomId: id }),
  setUnreadCount: (count) => set({ unreadCount: count }),
  setUnreadForRoom: (roomId, count) => set((state) => ({
    unreadByRoom: { ...state.unreadByRoom, [roomId]: count },
  })),
}));
