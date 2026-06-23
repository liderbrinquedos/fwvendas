import { create } from 'zustand'

interface AppState {
  currentPage: string
  sidebarCollapsed: boolean
  mobileSidebarOpen: boolean
  setCurrentPage: (page: string) => void
  toggleSidebar: () => void
  setMobileSidebarOpen: (open: boolean) => void
}

export const useAppStore = create<AppState>()((set) => ({
  currentPage: 'dashboard',
  sidebarCollapsed: false,
  mobileSidebarOpen: false,

  setCurrentPage: (page: string) => {
    set({ currentPage: page })
  },

  toggleSidebar: () => {
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed }))
  },

  setMobileSidebarOpen: (open: boolean) => {
    set({ mobileSidebarOpen: open })
  },
}))
