import {Component, NgZone} from '@angular/core';
import {NavController, ToastController} from 'ionic-angular';
import {TrashOutDate} from "../../models/trash-out-date";
import {ConnectionStatus} from "../../providers/tb3k-ble-connection";
import {Tb3kCommunicationProvider} from "../../providers/tb3k-communication";

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {

  public connectionStatus: string = "SCANNING";
  public retrievingDates: boolean = false;

  public futureDates: TrashOutDate[];
  public ackableDates: TrashOutDate[];
  public nextDates: TrashOutDate[];

  constructor(public navCtrl: NavController,
              private toastCtrl: ToastController,
              private ngZone: NgZone,
              private bleCom: Tb3kCommunicationProvider) {

    this.bleCom.tb3kConnectionStatusChanged.subscribe((status) => this.handleConnectionStatusChanges(status));
    this.ngZone.runOutsideAngular(async () => {
      return this.bleCom.establishConnection();
    });
  }

  public establishConnection() {
    this.ngZone.runOutsideAngular(async () => {
      return this.bleCom.establishConnection();
    });
  }

  public async ack(dateIndex: number) {
    const ackDate = this.ackableDates[dateIndex];
    this.ngZone.run(() => {
      this.retrievingDates = true;
      this.ackableDates = [];
    });

    try {

      await this.bleCom.ack(ackDate);
      await new Promise((resolve) => {
        // FIXME delay for BLE notifications, is there a better way?
        setTimeout(() => resolve(), 200);
      });

      const ackDates = await this.bleCom.getAckDates();
      const ackDateIndex = ackDates.reduce((prev, cur) => {
        prev[cur.id] = true;
        return prev;
      }, {});

      this.ngZone.run(() => {
        this.ackableDates = this.futureDates.filter((date) => date.daysLeft <= 1).map((date) => {
          if (ackDateIndex[date.id]) {
            date.ack = true;
          }
          return date;
        });
        this.retrievingDates = false;
      });
    } catch (err) {
      alert(err);
    }
  }

  private async handleConnectionStatusChanges(newStatus): Promise<void> {

    this.ngZone.run(() => {
      this.connectionStatus = ConnectionStatus[newStatus];
    });

    //alert(`New BLE status: ${this.connectionStatus}`);

    if (newStatus === ConnectionStatus.UNABLE_TO_SCAN) {
      //
    }
    if (newStatus === ConnectionStatus.NO_DEVICE_REACHABLE) {
      //
    }
    else if (newStatus === ConnectionStatus.CONNECTED) {

      this.ngZone.run(() => {
        this.retrievingDates = true;
      });

      try {


        await this.bleCom.setDeviceDateTime();
        await new Promise((resolve) => {
          // FIXME delay for BLE notifications, is there a better way?
          setTimeout(() => resolve(), 200);
        });

        const ackDates = await this.bleCom.getAckDates();
        const ackDateIndex = ackDates.reduce((prev, cur) => {
          prev[cur.id] = true;
          return prev;
        }, {});

        await new Promise((resolve) => {
          // FIXME delay for BLE notifications, is there a better way?
          setTimeout(() => resolve(), 200);
        });

        const dates = await this.bleCom.getDates();
        this.futureDates = dates.filter((date) => date.daysLeft >= 0);

        this.ngZone.run(() => {
          this.nextDates = this.futureDates.filter((date) => date.daysLeft > 1);
          this.ackableDates = this.futureDates.filter((date) => date.daysLeft <= 1).map((date) => {
            if (ackDateIndex[date.id]) {
              date.ack = true;
            }
            return date;
          });
          this.retrievingDates = false;
        });
      } catch(err) {
        alert(err);
        this.ngZone.run(() => {
          this.retrievingDates = false;
        });
      }

    } else if (newStatus === ConnectionStatus.DISCONNECTED) {
      this.ngZone.run(() => {
        this.ackableDates = null;
        this.nextDates = null;
      });
    }
  }

}
