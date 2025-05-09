import { getStorage, ref, getBytes, StorageReference, getBlob } from "firebase/storage";
import { storage } from "../firebaseConfig";
import { binToInt } from "./binaryHandling";

export class LiveSession {
	session: string;
	name: string;
	rotation: number;
	country: string;
	laps: number;

	constructor(session: string, name: string, rotation: number, country: string, laps: number) {
		this.session = session;
		this.name = name;
		this.rotation = rotation;
		this.country = country;
		this.laps = laps;
	}

	toString(): string {
		return `LiveSession(session: ${this.session}, name: ${this.name}, country: ${this.country}, laps: ${this.laps})`;
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
		jsonData["rotation"],
		jsonData["country"],
		jsonData["laps"]
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

export interface LiveDriverPosition {
	driverNums: number[];
	time: Date;
}

export interface LiveDriverInterval {
	driverNum: number;
	gapToLeader: number;
	interval: number;
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

export interface LiveData {
	telemetry: LiveTelemetry[];
	positions: LivePosition[];
	driverPositions: LiveDriverPosition[];
	driverIntervals: LiveDriverInterval[];
	driverSectors: LiveDriverSector[];
	driverTyres: LiveDriverTyre[];
	lapNumber: number;
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

	length = binToInt(boolList.splice(0, 7));

	let driverPositions: LiveDriverPosition[] = [];

	for (let i = 0; i < length; i++)
	{
		const timeAdd = binToInt(boolList.splice(0, 12));
		let driverCount = binToInt(boolList.splice(0, 5));
		let nums: number[] = [];
		for (let j = 0; j < driverCount; j++)
		{
			const driverNum = binToInt(boolList.splice(0, 7));
			nums.push(driverNum);
		}
		driverPositions.push({ driverNums: nums, time: new Date(time.getTime() + timeAdd) });
	}

	let driverIntervals: LiveDriverInterval[] = [];
	length = binToInt(boolList.splice(0, 8));

	for (let i = 0; i < length; i++)
	{
		let driverNum = binToInt(boolList.splice(0, 7));
		let gapToLeader = binToInt(boolList.splice(0, 20))/1000;
		let interval = binToInt(boolList.splice(0, 20))/1000;
		const timeAdd = binToInt(boolList.splice(0, 12));
		let timestamp = new Date(time.getTime() + timeAdd);
		driverIntervals.push({ driverNum: driverNum, gapToLeader: gapToLeader, interval: interval, time: timestamp });
	}

	let driverSectors: LiveDriverSector[] = [];
	length = binToInt(boolList.splice(0, 8));

	for (let i = 0; i < length; i++)
	{
		let driverNum = binToInt(boolList.splice(0, 7));
		let duration = binToInt(boolList.splice(0, 24))/1000;
		let pbDuration = binToInt(boolList.splice(0, 24))/1000;
		let sectorNum = binToInt(boolList.splice(0, 2));
		const timeAdd = binToInt(boolList.splice(0, 12));
		let timestamp = new Date(time.getTime() + timeAdd);
		driverSectors.push({ driverNum: driverNum, duration: duration, pbDuration: pbDuration, sectorNum: sectorNum, time: timestamp });
	}

	let driverTyres: LiveDriverTyre[] = [];
	length = binToInt(boolList.splice(0, 5));
	let compounds = ["SOFT", "MEDIUM", "HARD", "INTERMEDIATE", "WET", "UNKNOWN"]

	for (let i = 0; i < length; i++)
	{
		let driverNum = binToInt(boolList.splice(0, 7));
		let compound = compounds[binToInt(boolList.splice(0, 3))];
		let tyreAge = binToInt(boolList.splice(0, 7));
		driverTyres.push({ driverNum: driverNum, compound: compound, tyreAge: tyreAge, time: time });
	}


	let lapNumber = binToInt(boolList.splice(0, 8));


	// bits.extend(integer(telem.driverNumber, 7))
	//     bits.extend(integer(telem.speed, 9))
	//     bits.extend(integer(telem.throttle, 7))
	//     bits.append(telem.brake)
	//     bits.append(telem.drs == 1)
	//     bits.extend(integer(telem.gear - 1, 3))
	//     bits.extend(integer(datetime_to_milliseconds_of_day(telem.time) % (delta * 1000), 12))

	console.log(driverTyres);
	console.log("LOADED UP");

	return { telemetry: telem, positions: positions, driverPositions: driverPositions, driverIntervals: driverIntervals, driverSectors: driverSectors, driverTyres: driverTyres, lapNumber: lapNumber };
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