import React, { useMemo, useState } from "react";
import { LiveDriverData } from "../../liveDash/page";
import { AnimatedDriverDot } from "./TrackMapDriver";

export interface Pos {
	x: number;
	y: number;
}

interface TrackMapDisplayProps {
	points: Pos[];
	width?: number;
	height?: number;
	outerStroke?: number; // black thickness
	innerStroke?: number; // white thickness
	rotationDeg?: number; // rotation in degrees
	driversData: { [key: string]: LiveDriverData };
	positions: number[];
}

const rotatePoint = (p: Pos, center: Pos, angleRad: number): Pos => {
	const cos = Math.cos(angleRad);
	const sin = Math.sin(angleRad);
	const dx = p.x - center.x;
	const dy = p.y - center.y;
	return {
		x: center.x + dx * cos - dy * sin,
		y: center.y + dx * sin + dy * cos,
	};
};



export const TrackMapDisplay: React.FC<TrackMapDisplayProps> = ({
	points,
	width = 1200,
	height = 800,
	outerStroke = 50,
	innerStroke = 5,
	rotationDeg = 0,
	driversData,
	positions
}) => {

	const [rotatedMinXStored, setRotatedMinX] = useState<number>(0);
	const [rotatedMinYStored, setRotatedMinY] = useState<number>(0);
	const [rotatedMaxXStored, setRotatedMaxX] = useState<number>(0);
	const [rotatedMaxYStored, setRotatedMaxY] = useState<number>(0);
	const [scaleStored, setScale] = useState<number>(1);
	const [offsetXStored, setOffsetX] = useState<number>(1);
	const [offsetYStored, setOffsetY] = useState<number>(1);
	const [centre, setCentre] = useState<Pos>({ x: 0, y: 0 });

	let selected = false;

	const rotatePointNew = (point: Pos) => {
		const angleRad = (rotationDeg * Math.PI) / 180;
		let rotatedPoint = rotatePoint(point, centre, angleRad);

		return {
			x: (rotatedPoint.x - rotatedMinXStored) * scaleStored + offsetXStored,
			y: (rotatedPoint.y - rotatedMinYStored) * scaleStored + offsetYStored,
		};
	}


	const fitTrackToBox = (
		trackMap: Pos[],
		boxWidth: number,
		boxHeight: number,
		rotationDeg: number = 0,
		padding: number = 30 // Add padding around the track (in pixels)
	): Pos[] => {
		if (trackMap.length === 0) return [];

		const minX = Math.min(...trackMap.map(p => p.x));
		const maxX = Math.max(...trackMap.map(p => p.x));
		const minY = Math.min(...trackMap.map(p => p.y));
		const maxY = Math.max(...trackMap.map(p => p.y));

		const center: Pos = {
			x: (minX + maxX) / 2,
			y: (minY + maxY) / 2,
		};

		setCentre(center);

		const angleRad = (rotationDeg * Math.PI) / 180;

		const rotated = trackMap.map(p => rotatePoint(p, center, angleRad));

		const rotatedMinX = Math.min(...rotated.map(p => p.x));
		const rotatedMaxX = Math.max(...rotated.map(p => p.x));
		const rotatedMinY = Math.min(...rotated.map(p => p.y));
		const rotatedMaxY = Math.max(...rotated.map(p => p.y));

		const mapWidth = rotatedMaxX - rotatedMinX;
		const mapHeight = rotatedMaxY - rotatedMinY;

		const usableWidth = boxWidth - 2 * padding;
		const usableHeight = boxHeight - 2 * padding;

		const scale = Math.min(usableWidth / mapWidth, usableHeight / mapHeight);

		const offsetX = padding + (usableWidth - mapWidth * scale) / 2;
		const offsetY = padding + (usableHeight - mapHeight * scale) / 2;

		setOffsetX(offsetX);
		setOffsetY(offsetY);
		setRotatedMinX(rotatedMinX);
		setRotatedMinY(rotatedMinY);
		setRotatedMaxX(rotatedMaxX);
		setRotatedMaxY(rotatedMaxY);
		setScale(scale);

		return rotated.map(p => ({
			x: (p.x - rotatedMinX) * scale + offsetX,
			y: (p.y - rotatedMinY) * scale + offsetY,
		}));
	};





	const fittedPoints = useMemo(() => fitTrackToBox(points, width, height, rotationDeg), [
		points, width, height, rotationDeg
	]);

	if (fittedPoints.length === 0) return null;

	const loopedPoints = [...fittedPoints, fittedPoints[0]];
	const polyline = loopedPoints.map((p) => `${p.x},${p.y}`).join(" ");

	return (
		<svg width={width} height={height} style={{ display: "block" }}>
			<polyline
				points={polyline}
				stroke="black"
				strokeWidth={outerStroke}
				fill="none"
				strokeLinejoin="round"
				strokeLinecap="round"
			/>
			<polyline
				points={polyline}
				stroke="white"
				strokeWidth={innerStroke}
				fill="none"
				strokeLinejoin="round"
				strokeLinecap="round"
			/>

			{
				Object.entries(driversData)
					.sort(([, a], [, b]) => {
						const aSelected = a?.driver?.selected ?? false;
						const bSelected = b?.driver?.selected ?? false;
						return Number(aSelected) - Number(bSelected); // false < true
					})
					.map(([driverId, data]) => {
						if (!data) return null;

						const isSC = data.driver === undefined;
						const isSelected = data.driver?.selected ?? false;

						return (
							<AnimatedDriverDot
								key={driverId}
								name={isSC ? "SC" : data.driver.driver}
								colour={isSC ? "#DDDD00" : data.driver.teamColour}
								telemetry={data}
								rotationDeg={rotationDeg}
								rotatedMinX={rotatedMinXStored}
								rotatedMinY={rotatedMinYStored}
								rotatedMaxX={rotatedMaxXStored}
								rotatedMaxY={rotatedMaxYStored}
								centre={centre}
								offsetX={offsetXStored}
								offsetY={offsetYStored}
								scale={scaleStored}
								position={isSC ? 0 : positions.indexOf(data.driver.driverNumber) + 1}
								onSelected={(selected: boolean) => {
									if (!isSC) data.driver.selected = selected;
								}}
							/>
						);
					})
			}






		</svg>
	);
};
