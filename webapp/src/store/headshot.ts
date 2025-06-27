import { create } from 'zustand'

interface HeadshotInfo {
  styleCount: number
  totalHeadshots: number
  headshotsPerStyle: number
  tier: string
  price: number
}

interface HeadshotState {
  headshotInfo: HeadshotInfo
  setHeadshotInfo: (info: HeadshotInfo) => void
}

const initialHeadshotInfo: HeadshotInfo = {
  styleCount: 0,
  totalHeadshots: 0,
  headshotsPerStyle: 0,
  tier: 'none',
  price: 0
}

export const useHeadshotStore = create<HeadshotState>((set) => ({
  headshotInfo: initialHeadshotInfo,
  setHeadshotInfo: (info) => set({ headshotInfo: info })
})) 