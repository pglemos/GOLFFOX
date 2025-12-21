import { create } from "zustand"

export interface MapPlaybackState {
  mode: 'live' | 'history'
  isPlaying: boolean
  playbackFrom: Date
  playbackTo: Date
  playbackSpeed: 1 | 2 | 4
  playbackProgress: number
  showTrajectories: boolean
  showHeatmap: boolean
  showTrajectoryAnalysis: boolean
  // Métodos para atualizar
  setMode: (mode: 'live' | 'history') => void
  setIsPlaying: (isPlaying: boolean) => void
  setPlaybackFrom: (from: Date) => void
  setPlaybackTo: (to: Date) => void
  setPlaybackSpeed: (speed: 1 | 2 | 4) => void
  setPlaybackProgress: (progress: number) => void
  setShowTrajectories: (show: boolean) => void
  setShowHeatmap: (show: boolean) => void
  setShowTrajectoryAnalysis: (show: boolean) => void
  resetPlayback: () => void
}

const defaultPlaybackFrom = new Date(Date.now() - 2 * 60 * 60 * 1000) // Últimas 2h
const defaultPlaybackTo = new Date()

export const useMapPlayback = create<MapPlaybackState>((set) => ({
  mode: 'live',
  isPlaying: false,
  playbackFrom: defaultPlaybackFrom,
  playbackTo: defaultPlaybackTo,
  playbackSpeed: 1,
  playbackProgress: 0,
  showTrajectories: false,
  showHeatmap: false,
  showTrajectoryAnalysis: false,
  setMode: (mode) => set({ mode }),
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setPlaybackFrom: (from) => set({ playbackFrom: from }),
  setPlaybackTo: (to) => set({ playbackTo: to }),
  setPlaybackSpeed: (speed) => set({ playbackSpeed: speed }),
  setPlaybackProgress: (progress) => set({ playbackProgress: progress }),
  setShowTrajectories: (show) => set({ showTrajectories: show }),
  setShowHeatmap: (show) => set({ showHeatmap: show }),
  setShowTrajectoryAnalysis: (show) => set({ showTrajectoryAnalysis: show }),
  resetPlayback: () => set({
    mode: 'live',
    isPlaying: false,
    playbackFrom: defaultPlaybackFrom,
    playbackTo: defaultPlaybackTo,
    playbackSpeed: 1,
    playbackProgress: 0,
    showTrajectories: false,
    showHeatmap: false,
    showTrajectoryAnalysis: false,
  }),
}))

