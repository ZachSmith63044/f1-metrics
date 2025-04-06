export class TelemetryFrame {
    speed: number;
    gear: number;
    throttle: number;
    brake: number;
    drs: number;
    x: number;
    y: number;
    time: number;
    relativeDistance: number;
    deltaTime: number;

    constructor(
        speed: number,
        gear: number,
        throttle: number,
        brake: boolean,
        drs: boolean,
        x: number,
        y: number,
        time: number,
        relativeDistance: number,
        deltaTime: number
    ) {
      this.speed = speed;
      this.gear = gear;
      this.throttle = throttle;
      this.brake = brake ? 1 : 0;
      this.drs = drs ? 1 : 0;
      this.x = x;
      this.y = y;
      this.time = time;
      this.relativeDistance = relativeDistance;
      this.deltaTime = deltaTime;
    }

    static fromList(list: any[][]): TelemetryFrame[] {
        let telems = [];
        for (let i = 0; i < list[0].length; i++)
        {
            telems.push(new TelemetryFrame(list[0][i], list[1][i], list[2][i], list[3][i], list[4][i], list[5][i], list[6][i], list[7][i], list[8][i], 0.01));
        }
        return telems;
    }

    toString(): string {
        return `TelemetryFrame(speed: ${this.speed}, gear: ${this.gear}, throttle: ${this.throttle}, brake: ${this.brake}, drs: ${this.drs}, x: ${this.x}, y: ${this.y}, time: ${this.time}, relativeDistance: ${this.relativeDistance})`;
    }
}

export class LapMetadata {
    year: string;
    round: string;
    session: string;
    driver: string;
    lapNumber: number;
    lapTime: number;
    position: number;
    colour: string;

    constructor(
        year: string,
        round: string,
        session: string,
        driver: string,
        lapNumber: number,
        lapTime: number,
        position: number,
        colour: string
    ) {
      this.year = year;
      this.round = round;
      this.session = session;
      this.driver = driver;
      this.lapNumber = lapNumber;
      this.lapTime = lapTime;
      this.position = position;
      this.colour = colour;
    }

    toMap(): Record<string, any> {
        return {
            year: this.year,
            round: this.round,
            session: this.session,
            driver: this.driver,
            lapNumber: this.lapNumber,
            lapTime: this.lapTime,
            position: this.position,
            colour: this.colour,
        };
    }

    static fromMap(data: Record<string, any>): LapMetadata {
        return new LapMetadata(
            data.year,
            data.round,
            data.session,
            data.driver,
            data.lapNumber,
            data.lapTime,
            data.position,
            data.colour
        );
    }
}

export interface FullLapData {
    lapMetadata: LapMetadata;
    lap: TelemetryFrame[];
}