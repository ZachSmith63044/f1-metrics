import { ref, listAll, getBlob, StorageReference } from "firebase/storage";
import { storage } from "../firebaseConfig";

export async function fetchTelemetryData(year: string, round: string, session: string): Promise<SessionData[]> {
    try {
        const sessionRef: StorageReference = ref(storage, `F1DataN/${year}/${round}/${session}`);

        const drivers = await listAll(sessionRef);
        const prefixesList: string[] = drivers.prefixes.map((prefixRef: StorageReference) => prefixRef.fullPath);

        const jsonDownloads: string[] = [];
        const driverIds: string[] = prefixesList.map((prefix: string) => {
            jsonDownloads.push(`${prefix}/lapsData.json`);
            jsonDownloads.push(`${prefix}/driverData.json`);
            const splitEnd: string[] = prefix.split("/");
            return splitEnd[splitEnd.length - 1];
        });

        const downloadPromises: Promise<any>[] = jsonDownloads.map(async (filePath: string) => {
            const fileRef: StorageReference = ref(storage, filePath);
            const blob: Blob = await getBlob(fileRef);
            const text: string = await blob.text();
            const jsonData: any = JSON.parse(text);
            return jsonData;
        });

        const allJsonData: any[] = await Promise.all(downloadPromises);

        const allLapsData: LapData[][] = [];
        const driversData: DriverData[] = [];
        for (let i = 0; i < allJsonData.length / 2; i++) {
            allLapsData.push(LapData.fromJsonMap(allJsonData[i * 2]));
            driversData.push(DriverData.fromList(allJsonData[i * 2 + 1]));
        }

        return {
            driverIds,
            allLapsData,
            driversData,
        };
    } catch (error) {
        console.error("Error fetching session data:", error);
        throw error;
    }
}