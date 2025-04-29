import { getStorage, ref, getBytes, StorageReference, getBlob } from "firebase/storage";
import { storage } from "../firebaseConfig";
import { binToInt } from "./binaryHandling";

export class LiveSession {
	session: string;
	name: string;
	rotation: number;

	constructor(session: string, name: string, rotation: number) {
		this.session = session;
		this.name = name;
		this.rotation = rotation;
	}

	toString(): string {
		return `LiveSession(session: ${this.session}, name: ${this.name})`;
	}
}

export async function getLiveSession(): Promise<LiveSession> {
	const storage = getStorage();
	const sessionRef = ref(storage, "LiveData/session.json");
	const data = await getBytes(sessionRef);

	const jsonStr = new TextDecoder("utf-8").decode(data);
	const jsonData = JSON.parse(jsonStr);

	return new LiveSession(
		jsonData["session"],
		jsonData["event"],
		jsonData["rotation"]
	);
}

export class LiveDriver {
	driver: string;
	teamColour: string;
	driverNumber: number;

	constructor(driver: string, teamColour: string, driverNumber: number) {
		this.driver = driver;
		this.teamColour = "#" + teamColour;
		this.driverNumber = driverNumber;
	}

	toString(): string {
		return `LiveDriver(driver: ${this.driver}, teamColour: ${this.teamColour}, driverNumber: ${this.driverNumber})`;
	}
}

export async function getLiveDrivers(): Promise<LiveDriver[]> {
	const storage = getStorage();
	const sessionRef = ref(storage, "LiveData/drivers.json");
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

export interface LiveData {
	telemetry: LiveTelemetry[];
	positions: LivePosition[];
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

	return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${microseconds}+00:00.l`;
}

export async function getLiveData(time: Date): Promise<LiveData> {
	const sessionRef: StorageReference = ref(storage, `LiveData/${formatDateCustom(time)}`);
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
		const driverNum = binToInt(boolList.splice(0, 7))
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
		positions.push({ driverNum: driverNum, x: -x, y: y, time: timeSplit });
	}


	// bits.extend(integer(telem.driverNumber, 7))
	//     bits.extend(integer(telem.speed, 9))
	//     bits.extend(integer(telem.throttle, 7))
	//     bits.append(telem.brake)
	//     bits.append(telem.drs == 1)
	//     bits.extend(integer(telem.gear - 1, 3))
	//     bits.extend(integer(datetime_to_milliseconds_of_day(telem.time) % (delta * 1000), 12))



	return { telemetry: telem, positions: positions };
}

export interface Pos {
	x: number;
	y: number;
}

export async function getTrackMap(): Promise<Pos[]> {
	const sessionRef: StorageReference = ref(storage, `LiveData/map.tm`);
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

	console.log(boolList);

	while (boolList.length > 0) {
		const x = binToInt(boolList.splice(0, 16), true) * -1;
		const y = binToInt(boolList.splice(0, 16), true);
		trackMap.push({ x: x, y: y });
	}


	return trackMap;
}