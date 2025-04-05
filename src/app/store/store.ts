import { create } from 'zustand';
import { FullLapData, LapMetadata } from "../classes/telemetryData";

interface Store {
    fullLapData: FullLapData[];
    lapLoad: LapMetadata[];
    setFullLapData: (data: FullLapData[]) => void;
    setLapLoadData: (data: LapMetadata[]) => void;
}
  
export const useStore = create<Store>((set) => ({
    fullLapData: [],
    lapLoad: [],
    setFullLapData: (data: FullLapData[]) => set({ fullLapData: data }),
    setLapLoadData: (data: LapMetadata[]) => set({ lapLoad: data }),
}));