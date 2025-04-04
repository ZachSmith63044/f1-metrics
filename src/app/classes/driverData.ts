export class DriverData {
    firstName: string;
    lastName: string;
    teamName: string;
    teamColour: string;
    position: number;
    Q1: number;
    Q2: number;
    Q3: number;
    time: number;
    gridPosition: number;
    points: number;
    status: string;
  
    // Constructor
    constructor(
        firstName: string,
        lastName: string,
        teamName: string,
        teamColour: string,
        position: number,
        Q1: number,
        Q2: number,
        Q3: number,
        time: number,
        gridPosition: number,
        points: number,
        status: string,
    ) {
      this.firstName = firstName;
      this.lastName = lastName;
      this.teamName = teamName;
      this.teamColour = teamColour;
      this.position = position;
      this.Q1 = Q1;
      this.Q2 = Q2;
      this.Q3 = Q3;
      this.time = time;
      this.gridPosition = gridPosition;
      this.points = points;
      this.status = status;
    }
  
    // Convert from an array (similar to the Dart fromList constructor)
    static fromList(list: any[]): DriverData {
      return new DriverData(
        list[0],
        list[1],
        list[2],
        "#" + list[3],
        list[4],
        list[5],
        list[6],
        list[7],
        list[8],
        list[9],
        list[10],
        list[11]
      );
    }

    // static fromJsonMap(map: any[][]): Array<DriverData> {
    //     let laps = [];
    //     for (let i = 0; i < map.length; i++)
    //     {
    //         laps.push(DriverData.fromList(map[i]));
    //     }
    //     return laps;
    // }
}