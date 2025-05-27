import { getStorage, ref, getBytes, StorageReference, getBlob } from "firebase/storage";
import { storage } from "../firebaseConfig";
import { binToInt } from "./binaryHandling";

export class LiveSession {
	session: string;
	name: string;
	rotation: number;
	country: string;
	laps: number;
	marshalSectors: number[];
	startDate: Date;

	constructor(session: string, name: string, rotation: number, country: string, laps: number, marshalSectors: number[], date: Date) {
		this.session = session;
		this.name = name;
		this.rotation = rotation;
		this.country = country;
		this.laps = laps;
		this.marshalSectors = marshalSectors;
		const offsetMilliseconds = date.getTimezoneOffset() * 60 * 1000;
		const normalizedDate = new Date(date.getTime() + offsetMilliseconds);
		this.startDate = normalizedDate;
	}

	toString(): string {
		return `LiveSession(session: ${this.session}, name: ${this.name}, country: ${this.country}, laps: ${this.laps})`;
	}
}

export async function getLiveSession(year: String, eventName: String, sessionName: String): Promise<LiveSession> {
	const storage = getStorage();
	const sessionRef = ref(storage, `LiveData/${year}/${eventName}/${sessionName}/session.json`);
	const data = await getBytes(sessionRef);

	const jsonStr = new TextDecoder("utf-8").decode(data);
	const jsonData = JSON.parse(jsonStr);

	return new LiveSession(
		jsonData["session"],
		jsonData["event"],
		jsonData["rotation"],
		jsonData["country"],
		jsonData["laps"],
		jsonData["marshals"],
		new Date(new Date(jsonData["start"]).getTime() + 550000)
	);
}

export class LiveDriver {
	driver: string;
	teamColour: string;
	driverNumber: number;
	selected: boolean;

	constructor(driver: string, teamColour: string, driverNumber: number) {
		this.driver = driver;
		this.teamColour = "#" + teamColour;
		this.driverNumber = driverNumber;
		this.selected = false;
	}

	toString(): string {
		return `LiveDriver(driver: ${this.driver}, teamColour: ${this.teamColour}, driverNumber: ${this.driverNumber})`;
	}
}

export async function getLiveDrivers(year: String, eventName: String, sessionName: String): Promise<LiveDriver[]> {
	const storage = getStorage();
	const sessionRef = ref(storage, `LiveData/${year}/${eventName}/${sessionName}/drivers.json`);
	const data = await getBytes(sessionRef);

	const jsonStr = new TextDecoder("utf-8").decode(data);
	const jsonData = JSON.parse(jsonStr);

	let drivers: LiveDriver[] = [];
	for (let i = 0; i < jsonData.length; i++) {
		drivers.push(new LiveDriver(jsonData[i][0], jsonData[i][1], jsonData[i][2]));
	}

	return drivers;
}

export interface LiveTelemetry {
	speed: number;
	throttle: number;
	brake: boolean;
	drs: number;
	gear: number;
	time: Date;
	driverNum: number;
}

export interface LivePosition {
	x: number;
	y: number;
	time: Date;
	driverNum: number;
}

export interface LiveDriverPosition {
	driverNums: number[];
	time: Date;
}

export interface LiveDriverInterval {
	driverNum: number;
	gapToLeader: string;
	interval: string;
	time: Date;
}

export interface LiveDriverSector {
	driverNum: number;
	duration: number;
	pbDuration: number;
	sectorNum: number;
	time: Date;
}

export interface LiveDriverTyre {
	driverNum: number;
	tyreAge: number;
	compound: string;
	time: Date;
}

// export interface LiveMarshalSectors {
// 	sectorStates: number[];
// 	time: Date;
// }

export interface LiveData {
	telemetry: LiveTelemetry[];
	positions: LivePosition[];
	driverPositions: LiveDriverPosition[];
	driverIntervals: LiveDriverInterval[];
	driverSectors: LiveDriverSector[];
	driverTyres: LiveDriverTyre[];
	lapNumber: number;
	trackState: number;
	// marshalSectors: LiveMarshalSectors[];
}

function formatDateCustom(date: Date): string {
	const pad = (n: number, z = 2) => n.toString().padStart(z, '0');

	const year = date.getUTCFullYear();
	const month = pad(date.getUTCMonth() + 1);
	const day = pad(date.getUTCDate());
	const hours = pad(date.getUTCHours());
	const minutes = pad(date.getUTCMinutes());
	const seconds = pad(date.getUTCSeconds());
	const milliseconds = date.getUTCMilliseconds();

	// Convert milliseconds to microseconds string (3 digits + 000)
	let microseconds = "." + pad(milliseconds, 3) + '000';

	if (milliseconds == 0) {
		microseconds = "";
	}

	return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${microseconds}+00:00.ld`;
}



const formatTime = (value: number) => `+${value.toFixed(3)}`;



export async function getLiveData(time: Date, marshalSectorsNum: number, year: String, eventName: String, sessionName: String): Promise<LiveData> {
	const sessionRef: StorageReference = ref(storage, `LiveData/${year}/${eventName}/${sessionName}/${formatDateCustom(time)}`);
	const blob = await getBlob(sessionRef);
	const arrayBuffer = await blob.arrayBuffer();
	const uint8Array = new Uint8Array(arrayBuffer);

	let boolList: boolean[] = [];

	for (const byte of uint8Array) {
		for (let bit = 7; bit >= 0; bit--) {
			boolList.push((byte & (1 << bit)) !== 0);
		}
	}

	let length = binToInt(boolList.splice(0, 12));

	let telem: LiveTelemetry[] = [];

	for (let i = 0; i < length; i++) {
		const driverNum = binToInt(boolList.splice(0, 7));
		const speed = binToInt(boolList.splice(0, 9));
		const throttle = binToInt(boolList.splice(0, 7));
		const brake = boolList.splice(0, 1)[0];
		const drs = binToInt(boolList.splice(0, 2));
		const gear = binToInt(boolList.splice(0, 3)) + 1;
		const timeAdd = binToInt(boolList.splice(0, 12));
		const timeSplit = new Date(time.getTime() + timeAdd);
		telem.push({ driverNum: driverNum, speed: speed, throttle: throttle, brake: brake, drs: drs, gear: gear, time: timeSplit });
	}

	length = binToInt(boolList.splice(0, 12));

	let positions: LivePosition[] = [];

	for (let i = 0; i < length; i++) {
		const driverNum = binToInt(boolList.splice(0, 7))
		const x = binToInt(boolList.splice(0, 16), true);
		const y = binToInt(boolList.splice(0, 16), true);
		const timeAdd = binToInt(boolList.splice(0, 12));
		const timeSplit = new Date(time.getTime() + timeAdd);
		if (driverNum >= 100) {
			console.log(`driverNum: ${driverNum}`);
		}
		positions.push({ driverNum: driverNum, x: -x, y: y, time: timeSplit });
	}

	if (positions.length != length) {
		console.log("ERROR DEBUG")
	}

	length = binToInt(boolList.splice(0, 7));

	let driverPositions: LiveDriverPosition[] = [];

	for (let i = 0; i < length; i++) {
		const timeAdd = binToInt(boolList.splice(0, 12));
		let driverCount = binToInt(boolList.splice(0, 5));
		let nums: number[] = [];
		for (let j = 0; j < driverCount; j++) {
			const driverNum = binToInt(boolList.splice(0, 7));
			nums.push(driverNum);
		}
		driverPositions.push({ driverNums: nums, time: new Date(time.getTime() + timeAdd) });
	}

	let driverIntervals: LiveDriverInterval[] = [];
	length = binToInt(boolList.splice(0, 8));

	for (let i = 0; i < length; i++) {
		let driverNum = binToInt(boolList.splice(0, 7));
		let leaderLapped = boolList.splice(0, 1)[0];
		let gapToLeader: string = "0";
		let interval: string = "0";
		if (leaderLapped) {
			gapToLeader = `${binToInt(boolList.splice(0, 8))}L`;
		}
		else {
			gapToLeader = formatTime(binToInt(boolList.splice(0, 20)) / 1000);
		}
		let intervalLapped = boolList.splice(0, 1)[0];
		if (intervalLapped) {
			gapToLeader = `${binToInt(boolList.splice(0, 8))}L`;
		}
		else {
			interval = formatTime(binToInt(boolList.splice(0, 20)) / 1000);
		}
		const timeAdd = binToInt(boolList.splice(0, 12));
		let timestamp = new Date(time.getTime() + timeAdd);
		driverIntervals.push({ driverNum: driverNum, gapToLeader: gapToLeader.toString(), interval: interval.toString(), time: timestamp });
	}

	let driverSectors: LiveDriverSector[] = [];
	length = binToInt(boolList.splice(0, 8));
	console.log(length);
	console.log("LENGTHSS driverSectors");

	for (let i = 0; i < length; i++) {
		let driverNum = binToInt(boolList.splice(0, 7));
		let duration = binToInt(boolList.splice(0, 24)) / 1000;
		let pbDuration = binToInt(boolList.splice(0, 24)) / 1000;
		let sectorNum = binToInt(boolList.splice(0, 2));
		const timeAdd = binToInt(boolList.splice(0, 12));
		let timestamp = new Date(time.getTime() + timeAdd);
		driverSectors.push({ driverNum: driverNum, duration: duration, pbDuration: pbDuration, sectorNum: sectorNum, time: timestamp });
	}

	console.log(driverSectors.length);

	let driverTyres: LiveDriverTyre[] = [];
	length = binToInt(boolList.splice(0, 5));
	let compounds = ["SOFT", "MEDIUM", "HARD", "INTERMEDIATE", "WET", "UNKNOWN"];

	console.log(length);
	console.log("LENGTHSS");

	for (let i = 0; i < length; i++) {
		let driverNum = binToInt(boolList.splice(0, 7));
		let compound = compounds[binToInt(boolList.splice(0, 3))];
		let tyreAge = binToInt(boolList.splice(0, 7));
		driverTyres.push({ driverNum: driverNum, compound: compound, tyreAge: tyreAge, time: time });
	}

	let lapNumber = binToInt(boolList.splice(0, 8));

	let trackState = binToInt(boolList.splice(0, 3));

	if (lapNumber != 250) {
		console.log(`ERROR LAP NUM ${boolList.length}`);
	}
	else {
		console.log(`ERROR LAP NUM NONE ${boolList.length}`);
	}
	console.log(lapNumber);
	console.log(trackState);
	console.log(boolList.length);

	// let marshalSectorsFull: LiveMarshalSectors[] = [];

	// length = binToInt(boolList.splice(0, 3));
	// for (let i = 0; i < length; i++)
	// {
	// 	let timeSeconds = binToInt(boolList.splice(0, 2));
	// 	let marshalSectors = [];
	// 	for (let j = 0; j < marshalSectorsNum; j++)
	// 	{
	// 		marshalSectors.push(binToInt(boolList.splice(0, 3)));
	// 	}
	// 	marshalSectorsFull.push({ sectorStates: marshalSectors, time: new Date(time.getTime() + timeSeconds * 1000) });
	// }


	// bits.extend(integer(telem.driverNumber, 7))
	//     bits.extend(integer(telem.speed, 9))
	//     bits.extend(integer(telem.throttle, 7))
	//     bits.append(telem.brake)
	//     bits.append(telem.drs == 1)
	//     bits.extend(integer(telem.gear - 1, 3))
	//     bits.extend(integer(datetime_to_milliseconds_of_day(telem.time) % (delta * 1000), 12))

	return { telemetry: telem, positions: positions, driverPositions: driverPositions, driverIntervals: driverIntervals, driverSectors: driverSectors, driverTyres: driverTyres, lapNumber: lapNumber, trackState: trackState };
}

export interface Pos {
	x: number;
	y: number;
}

export async function getTrackMap(year: String, eventName: String, sessionName: String): Promise<Pos[]> {
	const sessionRef: StorageReference = ref(storage, `LiveData/${year}/${eventName}/${sessionName}/map.tm`);
	const blob = await getBlob(sessionRef);
	const arrayBuffer = await blob.arrayBuffer();
	const uint8Array = new Uint8Array(arrayBuffer);

	let boolList: boolean[] = [];

	for (const byte of uint8Array) {
		for (let bit = 7; bit >= 0; bit--) {
			boolList.push((byte & (1 << bit)) !== 0);
		}
	}

	let trackMap: Pos[] = [];


	while (boolList.length > 0) {
		const x = binToInt(boolList.splice(0, 16), true) * -1;
		const y = binToInt(boolList.splice(0, 16), true);
		trackMap.push({ x: x, y: y });
	}


	return trackMap;
}


export interface LiveLapData {
	lapTime: number;
	lapNumber: number;
	s1: number;
	s2: number;
	s3: number;
	compound: string;
	tyreAge: number;
	stint: number;
	time: number;
	isChecked: boolean;
	isLoaded: boolean;
}

async function getLaps(driverNumber: number): Promise<LiveLapData[]> {
	let laps: LiveLapData[] = [];

	try {
		const sessionRef: StorageReference = ref(storage, `LiveSession/${driverNumber}/laps.json`);
		const blob: Blob = await getBlob(sessionRef);
		const text: string = await blob.text();
		const jsonData: any = JSON.parse(text);

		for (let i = 0; i < jsonData.length; i++) {
			laps.push({ lapNumber: jsonData[i][0], lapTime: jsonData[i][1], s1: jsonData[i][2], s2: jsonData[i][3], s3: jsonData[i][4], compound: jsonData[i][5], tyreAge: jsonData[i][6], stint: jsonData[i][7], time: jsonData[i][8], isChecked: false, isLoaded: false });
		}

		const sortedList = Array.from(new Set<number>(laps.map((x) => x.stint))).sort((a, b) => a - b);

		for (let i = 0; i < laps.length; i++) {
			laps[i].stint = sortedList.indexOf(laps[i].stint) + 1;
		}
	}
	catch (e) {

	}

	return laps;
}

export async function getAllLaps(driverNumbers: number[]): Promise<Record<number, LiveLapData[]>> {
	const lapDataArray = await Promise.all(
		driverNumbers.map(async (driverNumber) => {
			const laps = await getLaps(driverNumber);
			return { driverNumber, laps };
		})
	);

	const result: Record<number, LiveLapData[]> = {};
	for (const entry of lapDataArray) {
		result[entry.driverNumber] = entry.laps;
	}

	return result;
}
