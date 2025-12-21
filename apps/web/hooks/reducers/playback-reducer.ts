import { useReducer } from 'react'

// Estado de playback
export interface PlaybackState {
  isPlaying: boolean
  playbackSpeed: number
  isLooping: boolean
  isMuted: boolean
  volume: number
}

// Estado de UI
export interface UIState {
  isFullscreen: boolean
  showTooltip: boolean
  tooltipPosition: { x: number; y: number }
  showHotspot: boolean
  hotspotPosition: { x: number; y: number } | null
}

// Estado de navegação
export interface NavigationState {
  focusedMarkerIndex: number
  keyboardNavigationActive: boolean
}

// Ações de playback
type PlaybackAction =
  | { type: 'SET_PLAYING'; payload: boolean }
  | { type: 'SET_SPEED'; payload: number }
  | { type: 'SET_LOOPING'; payload: boolean }
  | { type: 'SET_MUTED'; payload: boolean }
  | { type: 'SET_VOLUME'; payload: number }
  | { type: 'TOGGLE_PLAYING' }
  | { type: 'TOGGLE_LOOPING' }
  | { type: 'TOGGLE_MUTED' }
  | { type: 'RESET_PLAYBACK' }

// Ações de UI
type UIAction =
  | { type: 'SET_FULLSCREEN'; payload: boolean }
  | { type: 'SET_SHOW_TOOLTIP'; payload: boolean }
  | { type: 'SET_TOOLTIP_POSITION'; payload: { x: number; y: number } }
  | { type: 'SET_SHOW_HOTSPOT'; payload: boolean }
  | { type: 'SET_HOTSPOT_POSITION'; payload: { x: number; y: number } | null }
  | { type: 'TOGGLE_FULLSCREEN' }
  | { type: 'RESET_UI' }

// Ações de navegação
type NavigationAction =
  | { type: 'SET_FOCUSED_MARKER'; payload: number }
  | { type: 'SET_KEYBOARD_NAV_ACTIVE'; payload: boolean }
  | { type: 'RESET_NAVIGATION' }

const initialPlaybackState: PlaybackState = {
  isPlaying: false,
  playbackSpeed: 1,
  isLooping: false,
  isMuted: false,
  volume: 80,
}

const initialUIState: UIState = {
  isFullscreen: false,
  showTooltip: false,
  tooltipPosition: { x: 0, y: 0 },
  showHotspot: false,
  hotspotPosition: null,
}

const initialNavigationState: NavigationState = {
  focusedMarkerIndex: -1,
  keyboardNavigationActive: false,
}

function playbackReducer(state: PlaybackState, action: PlaybackAction): PlaybackState {
  switch (action.type) {
    case 'SET_PLAYING':
      return { ...state, isPlaying: action.payload }
    case 'SET_SPEED':
      return { ...state, playbackSpeed: action.payload }
    case 'SET_LOOPING':
      return { ...state, isLooping: action.payload }
    case 'SET_MUTED':
      return { ...state, isMuted: action.payload }
    case 'SET_VOLUME':
      return { ...state, volume: action.payload }
    case 'TOGGLE_PLAYING':
      return { ...state, isPlaying: !state.isPlaying }
    case 'TOGGLE_LOOPING':
      return { ...state, isLooping: !state.isLooping }
    case 'TOGGLE_MUTED':
      return { ...state, isMuted: !state.isMuted }
    case 'RESET_PLAYBACK':
      return initialPlaybackState
    default:
      return state
  }
}

function uiReducer(state: UIState, action: UIAction): UIState {
  switch (action.type) {
    case 'SET_FULLSCREEN':
      return { ...state, isFullscreen: action.payload }
    case 'SET_SHOW_TOOLTIP':
      return { ...state, showTooltip: action.payload }
    case 'SET_TOOLTIP_POSITION':
      return { ...state, tooltipPosition: action.payload }
    case 'SET_SHOW_HOTSPOT':
      return { ...state, showHotspot: action.payload }
    case 'SET_HOTSPOT_POSITION':
      return { ...state, hotspotPosition: action.payload }
    case 'TOGGLE_FULLSCREEN':
      return { ...state, isFullscreen: !state.isFullscreen }
    case 'RESET_UI':
      return initialUIState
    default:
      return state
  }
}

function navigationReducer(state: NavigationState, action: NavigationAction): NavigationState {
  switch (action.type) {
    case 'SET_FOCUSED_MARKER':
      return { ...state, focusedMarkerIndex: action.payload }
    case 'SET_KEYBOARD_NAV_ACTIVE':
      return { ...state, keyboardNavigationActive: action.payload }
    case 'RESET_NAVIGATION':
      return initialNavigationState
    default:
      return state
  }
}

export function usePlaybackReducer() {
  return useReducer(playbackReducer, initialPlaybackState)
}

export function useUIReducer() {
  return useReducer(uiReducer, initialUIState)
}

export function useNavigationReducer() {
  return useReducer(navigationReducer, initialNavigationState)
}

