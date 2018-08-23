import {EventEmitter, Injectable} from "@angular/core";
import {BLE} from "@ionic-native/ble";
import {Observable} from "rxjs/Observable";

interface IDevice {
  id: string;
  name: string;
  rssi: string;
}

interface IPeripheral {
}

export enum ConnectionStatus {
  "SCANNING", "UNABLE_TO_SCAN", "NO_DEVICE_REACHABLE", "CONNECTED", "DISCONNECTED",
}

@Injectable()
export class Tb3kBleConnectionProvider {

  private static readonly SERVICE_UUID = "ffe0";
  private static readonly CHARACTERISTIC_UUID = "ffe1";

  private stateChangeNotification: Observable<any> = null;
  private discoveredDevices: IDevice[] = [];
  private trashBoyDevice: IDevice = null;
  private trashBoyPeripheral: IPeripheral = null;
  private connected: boolean = false;
  private scanTimeout: number = null;
  private pendingRequest: Promise<string>;

  public tb3kConnectionStatusChanged: EventEmitter<ConnectionStatus> = new EventEmitter();

  public constructor(private ble: BLE) {
    //
  }

  public scan() {

    /*
    try {
      this.stateChangeNotification = this.ble.startStateNotifications();
      this.stateChangeNotification.subscribe((state) => {
        //alert(state);
      }, (err) => {
        alert(err);
      });
    } catch (err) {
      alert(err);
    }*/

    this.discoveredDevices = [];
    this.scanTimeout = setTimeout(() => {
      this.tb3kConnectionStatusChanged.emit(ConnectionStatus.NO_DEVICE_REACHABLE);
    }, 5000);
    this.ble.scan([], 10).subscribe(
      device => this.onDeviceDiscovered(device),
      error => this.scanError(error)
    );
    this.tb3kConnectionStatusChanged.emit(ConnectionStatus.SCANNING);
  }

  public connect() {
    if (null === this.trashBoyDevice) {
      throw new Error("No device to pair. Maybe you want to run scan() first.");
    }
    this.ble.connect(this.trashBoyDevice.id).subscribe(
      (peripheral) => this.onDeviceConnected(peripheral),
      (peripheral) => this.onDeviceDisconnected(peripheral)
    );
  }

  public async sendRequest(requestCode: string, timeout: number = 5000): Promise<string> {

    if (this.pendingRequest) {
      await this.pendingRequest;
    }

    this.pendingRequest = new Promise<any>((resolve, reject) => {
      this._waitForReply(resolve, reject, timeout);
      const request = new Uint8Array(requestCode.length);
      for (let i = 0; i < requestCode.length; i++) {
        request[i] = requestCode.charCodeAt(i);
      }
      this._bleWrite(request.buffer).catch((err) => {
        reject(err);
      });
    });

    return this.pendingRequest;
  }

  private _bleWrite(data: ArrayBuffer): Promise<any> {
    return this.ble.write(
      this.trashBoyDevice.id,
      Tb3kBleConnectionProvider.SERVICE_UUID,
      Tb3kBleConnectionProvider.CHARACTERISTIC_UUID,
      data
    );
  }

  private _waitForReply(resolve, reject, timeout: number = 10000): void {

    const [deviceId, serviceUUID, characteristicUUID] = [this.trashBoyDevice.id, Tb3kBleConnectionProvider.SERVICE_UUID, Tb3kBleConnectionProvider.CHARACTERISTIC_UUID];
    const replyBuffer = [];

    const toHandle = setTimeout(() => {
      this.ble.stopNotification(deviceId, serviceUUID, characteristicUUID).then(() => {
        reject("TIMEOUT");
      });
    }, timeout);

    this.ble.startNotification(deviceId, serviceUUID, characteristicUUID).subscribe(
      (buffer) => {
        clearTimeout(toHandle);
        var data = new Uint8Array(buffer);
        for (let i = 0; i < data.length; i++) {
          replyBuffer.push(data[i]);
        }
        if (replyBuffer.slice(-5).join("") === "4784661310") { // => "/TB\r\n"
          this.ble.stopNotification(deviceId, serviceUUID, characteristicUUID).then(() => {
            const reply = String.fromCharCode(...replyBuffer);
            resolve(reply.substr(0, reply.length - 5));
          });
        }
      }, (err) => {
        clearTimeout(toHandle);
        reject(err);
      }
    );
  }

  private onDeviceDiscovered(device: IDevice) {
    this.discoveredDevices.push(device);
    if (device && device.name === "TrashBoy3000") {
      this.trashBoyDevice = device;
      clearTimeout(this.scanTimeout);
      this.ble.stopScan().then(() => this.connect());
    }
  }

  private onDeviceConnected(peripheral: IPeripheral) {
    this.connected = true;
    this.trashBoyPeripheral = peripheral;
    this.tb3kConnectionStatusChanged.emit(ConnectionStatus.CONNECTED);
  }

  private onDeviceDisconnected(peripheral: IPeripheral) {
    this.connected = false;
    this.trashBoyDevice = null;
    this.trashBoyPeripheral = null;
    this.tb3kConnectionStatusChanged.emit(ConnectionStatus.DISCONNECTED);
  }

  private scanError(error) {
    // location permission denied?
    clearTimeout(this.scanTimeout);
    this.tb3kConnectionStatusChanged.emit(ConnectionStatus.UNABLE_TO_SCAN);
  }
}
