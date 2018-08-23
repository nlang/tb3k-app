import {EventEmitter, Injectable} from "@angular/core";
import {ConnectionStatus, Tb3kBleConnectionProvider} from "./tb3k-ble-connection";
import {TrashOutDate} from "../models/trash-out-date";
import * as moment from "moment";

@Injectable()
export class Tb3kCommunicationProvider {

  public tb3kConnectionStatusChanged: EventEmitter<ConnectionStatus> = new EventEmitter();

  public constructor(private tb3k: Tb3kBleConnectionProvider) {
    this.tb3k.tb3kConnectionStatusChanged.subscribe((status) => {
      this.tb3kConnectionStatusChanged.emit(status);
      if (status === ConnectionStatus.DISCONNECTED) {
        this.tb3k.scan();
      }
    });
  }

  public async establishConnection(): Promise<void> {
    this.tb3k.scan();
  }

  public async getDates(): Promise<TrashOutDate[]> {
    const response = await this.tb3k.sendRequest("TB+EVENTS?");
    const dates = [];
    for (let c = 0; c < response.length; c += 7) {
      // YYMMDDC
      const nextDate = response.substr(c, 7);
      const year = nextDate.slice(0, 2);
      const month = nextDate.slice(2, 4);
      const day = nextDate.slice(4, 6);
      const channelId = parseInt(nextDate.charAt(6));
      dates.push(new TrashOutDate(year, month, day, channelId));
    }
    return dates;
  }

  public async getAckDates(): Promise<TrashOutDate[]> {
    const response = await this.tb3k.sendRequest("TB+ACKEVENTS?");
    const dates = [];
    for (let c = 0; c < response.length; c += 7) {
      // YYMMDDC
      const nextDate = response.substr(c, 7);
      const year = nextDate.slice(0, 2);
      const month = nextDate.slice(2, 4);
      const day = nextDate.slice(4, 6);
      const channelId = parseInt(nextDate.charAt(6));
      dates.push(new TrashOutDate(year, month, day, channelId));
    }
    return dates;
  }

  public async setDeviceDateTime(): Promise<void> {
    await this.tb3k.sendRequest(`TB+DATETIME=${moment().format("YYMMDDHHmmss")}`)
  }

  public async ack(date: TrashOutDate): Promise<void> {
    await this.tb3k.sendRequest(`TB+ACK=${date.id}`);
  }

}
