import { ref, getBlob, StorageReference } from "firebase/storage";
import { storage } from "../firebaseConfig";

export interface RaceResult {
    name: string;
    points: number;
    time: number; // time/gap
    fastestLap: number;
    gridPos: number;
    status: string;
    lapsCompleted: number;
    position: number;
    team: string;
}

export interface QualiResult {
    name: string;
    team: string;
    q1: number;
    q2: number;
    q3: number;
    laps: number;
    position: number;
}

export interface PracticeResult {
    name: string;
    team: string;
    fastestLap: number;
    laps: number;
    position: number;
}

export async function fetchRaceResult(year: string, round: string, session: string): Promise<RaceResult[]> {
    try {
        const sessionRef: StorageReference = ref(storage, `F1DataN/${year}/${round}/${session}/results.json`);
        const blob: Blob = await getBlob(sessionRef);
        const text: string = await blob.text();
        const jsonData: any = JSON.parse(text);

        let results: RaceResult[] = [];
        
        for (let i = 0; i < jsonData.length; i++)
        {
            const arr = jsonData[i];
            results.push({ name: arr[0], points: arr[1], time: arr[2], fastestLap: arr[3], gridPos: arr[4], status: arr[5], lapsCompleted: arr[6], team: arr[7], position: i + 1 });
        }

        return results;
    } catch (error) {
        console.error("Error fetching session data:", error);
        throw error;
    }
}

export async function fetchQualiResult(year: string, round: string, session: string): Promise<QualiResult[]> {
    try {
        const sessionRef: StorageReference = ref(storage, `F1DataN/${year}/${round}/${session}/results.json`);
        const blob: Blob = await getBlob(sessionRef);
        const text: string = await blob.text();
        const jsonData: any = JSON.parse(text);

        let results: QualiResult[] = [];
        
        for (let i = 0; i < jsonData.length; i++)
        {
            const arr = jsonData[i];
            results.push({ name: arr[0], team: arr[1], q1: arr[2], q2: arr[3], q3: arr[4], laps: arr[5], position: i + 1 });
        }

        return results;
    } catch (error) {
        console.error("Error fetching session data:", error);
        throw error;
    }
}

export async function fetchPracticeResult(year: string, round: string, session: string): Promise<PracticeResult[]> {
    try {
        const sessionRef: StorageReference = ref(storage, `F1DataN/${year}/${round}/${session}/results.json`);
        const blob: Blob = await getBlob(sessionRef);
        const text: string = await blob.text();
        const jsonData: any = JSON.parse(text);

        let results: PracticeResult[] = [];
        
        for (let i = 0; i < jsonData.length; i++)
        {
            const arr = jsonData[i];
            results.push({ name: arr[0], team: arr[1], fastestLap: arr[2], laps: arr[3], position: i + 1 });
        }

        return results;
    } catch (error) {
        console.error("Error fetching session data:", error);
        throw error;
    }
}