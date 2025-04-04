import { ref, listAll, getBlob, StorageReference } from "firebase/storage";
import { storage } from "../firebaseConfig";
import { DriverData } from "../classes/driverData";

export async function fetchDriverData(year: string, round: string, session: string, driver: string): Promise<DriverData> {
    try {
        const sessionRef: StorageReference = ref(storage, `F1DataN/${year}/${round}/${session}/${driver}/driverData.json`);
        const blob: Blob = await getBlob(sessionRef);
        const text: string = await blob.text();
        const jsonData: any = JSON.parse(text);

        const driverData = DriverData.fromList(jsonData);


        return driverData;
    } catch (error) {
        console.error("Error fetching session data:", error);
        throw error;
    }
}