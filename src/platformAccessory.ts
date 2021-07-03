import { PlatformAccessory, Service, Logger, CharacteristicValue, CharacteristicSetCallback} from 'homebridge';
import { YamahaYasPlatform } from './platform';
import { YamahaAPI } from './yamahaAPI';

export class Yamahaaccessory {
  private readonly platform: YamahaYasPlatform;
  private readonly accessory: PlatformAccessory;
  private readonly log: Logger;
  yamahaapi: YamahaAPI;

  //services
  SwitchService: Service;
  speakerService: Service ;

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

    this.SwitchService
      .setCharacteristic(this.platform.Characteristic.Name, 'Power')
      .getCharacteristic(this.platform.Characteristic.On)
      .onGet(this.handleGetPower.bind(this))
      .onSet(this.handleSetPower.bind(this));

    this.speakerService =accessory.getService(this.platform.Service.TelevisionSpeaker) ||
     this.accessory.addService(this.platform.Service.TelevisionSpeaker);

    this.speakerService
      .setCharacteristic(this.platform.Characteristic.Active, this.platform.Characteristic.Active.ACTIVE)
      .setCharacteristic(this.platform.Characteristic.VolumeControlType, this.platform.Characteristic.VolumeControlType.ABSOLUTE);

    // handle volume control
    this.speakerService.getCharacteristic(this.platform.Characteristic.VolumeSelector)
      .on('set', (direction: CharacteristicValue, callback: CharacteristicSetCallback) => {
        this.setVolume(direction, callback);
      });


  }

  async handleGetPower() {
    return await this.yamahaapi.getPower();
  }

  handleSetPower(value) {
    this.yamahaapi.setPower(value);
  }

  setVolume(direction: CharacteristicValue, callback: CharacteristicSetCallback) {
    const d = direction;
    this.log.debug('a');
  }
}
