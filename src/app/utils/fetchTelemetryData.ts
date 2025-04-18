import { ref, listAll, getBlob, StorageReference } from "firebase/storage";
import { storage } from "../firebaseConfig";
import { TelemetryFrame } from "../classes/telemetryData";
import { binToInt } from "../utils/binaryHandling";


export async function fetchTelemetryData(year: string, round: string, session: string, driver: string, lapNumber: number, lapTime: number): Promise<TelemetryFrame[]> {
    try {
        const sessionRef: StorageReference = ref(storage, `F1DataN/${year}/${round}/${session}/${driver}/${lapNumber}.f1`);
        const blob = await getBlob(sessionRef);
        const arrayBuffer = await blob.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);

        let boolList: boolean[] = [];
        
        for (const byte of uint8Array) {
            for (let bit = 7; bit >= 0; bit--) {
                boolList.push((byte & (1 << bit)) !== 0);
            }
        }

        let pointer = 0;

        const length = binToInt(boolList.splice(0, 20));
        
        let speeds = [];
        for (let i = 0; i < length; i++)
        {
            speeds.push(binToInt(boolList.splice(0, 9)));
        }        
        let gears = [];
        for (let i = 0; i < length; i++)
        {
            gears.push(binToInt(boolList.splice(0, 3)) + 1);
        }        
        let throttles = [];
        for (let i = 0; i < length; i++)
        {
            throttles.push(binToInt(boolList.splice(0, 7)));
        }        
        let brakes  = [];
        for (let i = 0; i < length; i++)
        {
            brakes.push(boolList.splice(0, 1)[0]);
        }        
        let drs = [];
        for (let i = 0; i < length; i++)
        {
            drs.push(boolList.splice(0, 1)[0]);
        }        
        let x = [];
        for (let i = 0; i < length; i++)
        {
            x.push(binToInt(boolList.splice(0, 16), true));
        }        
        let y = [];
        for (let i = 0; i < length; i++)
        {
            y.push(binToInt(boolList.splice(0, 16), true));
        }        
        let times: number[] = [];
        for (let i = 0; i < length; i++)
        {
            let time = binToInt(boolList.splice(0, 10))/1000;
            if (i == 0)
            {
                times.push(time);
            }
            else
            {
                times.push(time + times[times.length - 1]);
            }
        }
        const multi = lapTime/times[times.length - 1];
        for (let i = 0; i < times.length; i++)
        {
            times[i] = multi * times[i];
        }
        let relativeDistances: number[] = [];
        const multiple = 2 ** 14;
        for (let i = 0; i < length; i++)
        {
            let relativeDistance = binToInt(boolList.splice(0, 14)) / multiple * 0.02;
            if (i == 0)
            {
                relativeDistances.push(relativeDistance);
            }
            else
            {
                relativeDistances.push(relativeDistance + relativeDistances[relativeDistances.length - 1]);
            }
        }

        return TelemetryFrame.fromList([speeds, gears, throttles, brakes, drs, x, y, times, relativeDistances]);

    } catch (error) {
        console.error("Error fetching session data:", error);
        return [];
    }
}