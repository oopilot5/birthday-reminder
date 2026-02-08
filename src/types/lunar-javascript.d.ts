declare module 'lunar-javascript' {
  export class Solar {
    static fromYmd(year: number, month: number, day: number): Solar;
    static fromYmdHms(year: number, month: number, day: number, hour: number, minute: number, second: number): Solar;
    getYear(): number;
    getMonth(): number;
    getDay(): number;
    getHour(): number;
    getMinute(): number;
    getSecond(): number;
    getLunar(): Lunar;
  }

  export class Lunar {
    static fromSolar(year: number, month: number, day: number): Lunar;
    static fromYmd(year: number, month: number, day: number): Lunar;
    static fromYmdHms(year: number, month: number, day: number, hour: number, minute: number, second: number): Lunar;
    getYear(): number;
    getMonth(): number;
    getDay(): number;
    getSolar(): Solar;
  }

  export class LunarYear {
    static fromYear(year: number): LunarYear;
    getMonth(month: number): LunarMonth;
  }

  export class LunarMonth {
    getDayCount(): number;
    getMonth(): number;
    getYear(): number;
  }
}
