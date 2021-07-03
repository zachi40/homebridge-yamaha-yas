import { PlatformAccessory, Service, Logger} from 'homebridge';
import { YamahaYasPlatform } from './platform';
import { YamahaAPI } from './yamahaAPI';

export class Yamahaaccessory {
  private readonly platform: YamahaYasPlatform;
  private readonly accessory: PlatformAccessory;
  private readonly log: Logger;
  yamahaapi: YamahaAPI;

  //services
  SwitchService: Service;

  constructor(platform, accessory) {
    this.platform = platform;
    this.accessory = accessory;
    this.log = platform.log;

    this.yamahaapi = new YamahaAPI( this.accessory.context.device.apcli0, this.log);

    this.accessory.getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, 'Yamaha')
      .setCharacteristic(this.platform.Characteristic.Model, this.accessory.context.device.yamaha_model_name|| 'Unknown')
      .setCharacteristic(this.platform.Characteristic.SerialNumber, this.accessory.context.device.uuid|| 'Unknown')
      .setCharacteristic(this.platform.Characteristic.FirmwareRevision, this.accessory.context.device.mcu_ver_custimize || 'Unknown');
    this.SwitchService =
      accessory.getService(this.platform.Service.Switch) ||
      accessory.addService(this.platform.Service.Switch);

    this.SwitchService.setCharacteristic(this.platform.Characteristic.Name, 'Power');
    this.SwitchService.getCharacteristic(this.platform.Characteristic.On)
      .onGet(this.getPower.bind(this))
      .onSet(this.setPower.bind(this));

  }

  async getPower() {
    return await this.yamahaapi.getPower();
  }

  setPower(value) {
    this.yamahaapi.setPower(value);
  }
}
