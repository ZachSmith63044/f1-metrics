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
        for (let i = 0; i < length; i++) {
            speeds.push(binToInt(boolList.splice(0, 9)));
        }
        let gears = [];
        for (let i = 0; i < length; i++) {
            gears.push(binToInt(boolList.splice(0, 3)) + 1);
        }
        let throttles = [];
        for (let i = 0; i < length; i++) {
            throttles.push(binToInt(boolList.splice(0, 7)));
        }
        let brakes = [];
        for (let i = 0; i < length; i++) {
            brakes.push(boolList.splice(0, 1)[0]);
        }
        let drs = [];
        for (let i = 0; i < length; i++) {
            drs.push(boolList.splice(0, 1)[0]);
        }
        let x = [];
        for (let i = 0; i < length; i++) {
            x.push(binToInt(boolList.splice(0, 16), true));
        }
        let y = [];
        for (let i = 0; i < length; i++) {
            y.push(binToInt(boolList.splice(0, 16), true));
        }
        let times: number[] = [];
        for (let i = 0; i < length; i++) {
            let time = binToInt(boolList.splice(0, 10)) / 1000;
            if (i == 0) {
                times.push(time);
            }
            else {
                times.push(time + times[times.length - 1]);
            }
        }
        // if (lapTime != -1) {
        //     const multi = lapTime / times[times.length - 1];
        //     for (let i = 0; i < times.length; i++) {
        //         times[i] = multi * times[i];
        //     }
        // }
        let fullDistances: number[] = [speeds[0] * times[0]];
        for (let i = 1; i < speeds.length; i++) {
            let distance = (speeds[i] + speeds[i - 1]) / 2 * (times[i] - times[i - 1]);
            fullDistances.push(distance + fullDistances[fullDistances.length - 1]);
        }
        let totalDistance = fullDistances[fullDistances.length - 1] * (lapTime / times[times.length - 1]);
        if (lapTime == 9999) {
            totalDistance = fullDistances[fullDistances.length - 1]
        }
        let relativeDistances: number[] = [];
        for (let i = 0; i < fullDistances.length; i++) {
            relativeDistances.push(fullDistances[i] / totalDistance);
        }
        // const multiple = 2 ** 14;
        // for (let i = 0; i < length; i++) {
        //     let relativeDistance = binToInt(boolList.splice(0, 14)) / multiple * 0.02;
        //     if (i == 0) {
        //         relativeDistances.push(relativeDistance);
        //     }
        //     else {
        //         relativeDistances.push(relativeDistance + relativeDistances[relativeDistances.length - 1]);
        //     }
        // }

        return TelemetryFrame.fromList([speeds, gears, throttles, brakes, drs, x, y, times, relativeDistances]);

    } catch (error) {
        console.error("Error fetching session data:", error);
        return [];
    }
}



export async function fetchLiveTelemetryData(driver: string, lapNumber: number, lapTime: number): Promise<TelemetryFrame[]> {
    try {
        const sessionRef: StorageReference = ref(storage, `LiveSession/${driver}/${lapNumber}.lt`);
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

        const length = binToInt(boolList.splice(0, 16));

        let speeds: number[] = [];
        let gears: number[] = [];
        let throttles: number[] = [];
        let brakes: boolean[] = [];
        let drs: boolean[] = [];
        let x: number[] = [];
        let y: number[] = [];
        let times: number[] = [];

        for (let i = 0; i < length; i++) {
            speeds.push(binToInt(boolList.splice(0, 9)));
            throttles.push(binToInt(boolList.splice(0, 7)));
            brakes.push(boolList.splice(0, 1)[0]);
            drs.push(boolList.splice(0, 1)[0]);
            gears.push(binToInt(boolList.splice(0, 3)) + 1);
            x.push(binToInt(boolList.splice(0, 16), true));
            y.push(binToInt(boolList.splice(0, 16), true));
            if (i == 0) {
                times.push(binToInt(boolList.splice(0, 11)) / 1000);
            }
            else {
                times.push(binToInt(boolList.splice(0, 11)) / 1000 + times[i - 1]);
            }
        }

        let fullDistances: number[] = [speeds[0] * times[0]];
        for (let i = 1; i < speeds.length; i++) {
            let distance = (speeds[i] + speeds[i - 1]) / 2 * (times[i] - times[i - 1]);
            fullDistances.push(distance + fullDistances[fullDistances.length - 1]);
        }
        let totalDistance = fullDistances[fullDistances.length - 1] * (lapTime / times[times.length - 1]);
        if (lapTime == 9999) {
            totalDistance = fullDistances[fullDistances.length - 1]
        }
        let relativeDistances: number[] = [];
        for (let i = 0; i < fullDistances.length; i++) {
            relativeDistances.push(fullDistances[i] / totalDistance);
        }



        return TelemetryFrame.fromList([speeds, gears, throttles, brakes, drs, x, y, times, relativeDistances]);

    } catch (error) {
        console.error("Error fetching session data:", error);
        return [];
    }
}