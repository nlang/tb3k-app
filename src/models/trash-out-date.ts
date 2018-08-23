import * as moment from "moment";

export class TrashOutDate {

  public date: string;
  public channelId: number;
  public ack: boolean;

  public constructor(year: string, month: string, day: string, channelId: number) {
    this.date = `${2000+parseInt(year)}-${month}-${day}`;
    this.channelId = channelId;
  }

  public get id(): string {
    return this.date.split("-").join("").substr(2) + this.channelId;
  }

  public get daysLeft(): number {
    const today = new Date();
    today.setHours(0);
    today.setMinutes(0);
    today.setSeconds(0);
    today.setMilliseconds(0);
    return moment(`${this.date} 00:00:00`).diff(today, "days");
  }

  public get daysLeftSpeaking(): string {
    return moment(`${this.date} 08:00:00`).fromNow()
  }

  public get shortDate(): string {
    return this.date.split("-").slice(1, 3).join("/");
  }

  public get channel(): string {
    switch (this.channelId) {
      case 1:
        return "Restmüll";
      case 2:
        return "Papier";
      case 3:
        return "Gelber Sack";
      default:
        return "N/A";
    }
  }

  public get isFuture(): boolean {
    return moment(this.date).isSameOrAfter(new Date());
  }

  public get channelColor(): string {
    switch (this.channelId) {
      case 1:
        return "#000000";
      case 2:
        return "#0000FF";
      case 3:
        return "#FFD700";
      default:
        return "#777777";
    }
  }
}
