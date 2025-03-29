export class LapData {
    time: number;
    lapTime: number;
    lapNumber: number;
    sector1Time: number;
    sector2Time: number;
    sector3Time: number;
    compound: string;
    tyreLife: number;
    freshTyre: boolean;
    deleted: boolean;
    isAccurate: boolean;
    stint: number;
    position: number;
    minSpeed: number;
    maxSpeed: number;
    maxDrs: boolean;
    pitInTime: number;
    pitOutTime: number;
    throttle: number;
  
    // Constructor
    constructor(
      time: number,
      lapTime: number,
      lapNumber: number,
      sector1Time: number,
      sector2Time: number,
      sector3Time: number,
      compound: string,
      tyreLife: number,
      freshTyre: boolean,
      deleted: boolean,
      isAccurate: boolean,
      stint: number,
      position: number,
      minSpeed: number,
      maxSpeed: number,
      maxDrs: boolean,
      pitInTime: number,
      pitOutTime: number,
      throttle: number
    ) {
      this.time = time;
      this.lapTime = lapTime;
      this.lapNumber = lapNumber;
      this.sector1Time = sector1Time;
      this.sector2Time = sector2Time;
      this.sector3Time = sector3Time;
      this.compound = compound;
      this.tyreLife = tyreLife;
      this.freshTyre = freshTyre;
      this.deleted = deleted;
      this.isAccurate = isAccurate;
      this.stint = stint;
      this.position = position;
      this.minSpeed = minSpeed;
      this.maxSpeed = maxSpeed;
      this.maxDrs = maxDrs;
      this.pitInTime = pitInTime;
      this.pitOutTime = pitOutTime;
      this.throttle = throttle;
    }
  
    // Convert from an array (similar to the Dart fromList constructor)
    static fromList(list: any[]): LapData {
        return new LapData(
          list[0],
          list[1],
          list[2],
          list[3],
          list[4],
          list[5],
          list[6],
          list[7],
          list[8],
          list[9],
          list[10],
          list[11],
          list[12],
          list[13],
          list[14],
          list[15],
          list[16],
          list[17],
          list[18]
        );
      }

      static fromJsonMap(map: any[][]): Array<LapData> {
        let laps = [];
        for (let i = 0; i < map.length; i++)
        {
            laps.push(LapData.fromList(map[i]));
        }
        return laps;
      }
  
    // Convert back to a list
    toList(): any[] {
      return [
        this.time,
        this.lapTime,
        this.lapNumber,
        this.sector1Time,
        this.sector2Time,
        this.sector3Time,
        this.compound,
        this.tyreLife,
        this.freshTyre,
        this.deleted,
        this.isAccurate,
        this.stint,
        this.position,
        this.minSpeed,
        this.maxSpeed,
        this.maxDrs,
        this.pitInTime,
        this.pitOutTime,
        this.throttle,
      ];
    }
  

    toString(): string {
      return `LapData(time: ${this.time}, lapTime: ${this.lapTime}, lapNumber: ${this.lapNumber}, sector1Time: ${this.sector1Time}, sector2Time: ${this.sector2Time}, sector3Time: ${this.sector3Time}, compound: ${this.compound}, tyreLife: ${this.tyreLife}, freshTyre: ${this.freshTyre}, deleted: ${this.deleted}, isAccurate: ${this.isAccurate}, stint: ${this.stint}, position: ${this.position})`;
    }
}