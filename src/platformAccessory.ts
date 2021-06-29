import { Service, PlatformAccessory } from 'homebridge';
import { YamahaYAS209Platform } from './platform';
import { YamahaAVAPI } from './yamahaAPI';

export class YamahaReciver {
  private service: Service;
  private readonly platform: YamahaYAS209Platform;
  private readonly accessory: PlatformAccessory;

  constructor(platform, accessory) {
    this.platform = platform;
    this.accessory = accessory;

    // set accessory information
    this.accessory.getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, 'Yamaha')
      .setCharacteristic(this.platform.Characteristic.Model, 'YAS-209')
      .setCharacteristic(this.platform.Characteristic.SerialNumber, 'e0b5fbae-d894-11eb-b8bc-0242ac130003');

    // get the TelevisionSpeaker service if it exists, otherwise create a new TelevisionSpeaker service
    // you can create multiple services for each accessory
    this.service = this.accessory.getService(this.platform.Service.Television) ||
                    this.accessory.addService(this.platform.Service.Television);

    // set the service name, this is what is displayed as the default name on the Home app
    // in this example we are using the name we stored in the `accessory.context` in the `discoverDevices` method.
    this.service.setCharacteristic(this.platform.Characteristic.Name, accessory.context.device.displayName);

    // each service must implement at-minimum the "required characteristics" for the given service type
    // see https://developers.homebridge.io/#/service/Lightbulb

    // Create handlers for required characteristics.
    this.service.getCharacteristic(this.platform.Characteristic.On)
      .on('get', this.handleOnGet.bind(this))
      .on('set', this.handleOnSet.bind(this));

    // Create handlers for optional characteristics.
    this.service.getCharacteristic(this.platform.Characteristic.RotationSpeed)
      .on('get', this.handleRotationSpeedGet.bind(this))
      .on('set', this.handleRotationSpeedSet.bind(this));
  }

  /**
   * Handle requests to get the current value of the "On" characteristic.
   */
  handleOnGet(callback) {
    this.platform.log.debug('Triggered GET On');

    // this.platform.yamahaAVRAPI.postReceiverGetAction(YamahaAction.POWER, this.isZoneB).then((answer: string) => {
    //   callback(null, answer === YamahaActionValue.ON);
    // });
  }

  /**
   * Handle requests to set the "Active" characteristic.
   */
  handleOnSet(value, callback) {
    this.platform.log.debug(`Triggered SET On: ${value}`);

    // const actionValue = value ? YamahaActionValue.ON : YamahaActionValue.STANDBY;
    // this.platform.yamahaAVRAPI.postReceiverSetAction(YamahaAction.POWER, actionValue, this.isZoneB).then(() => {
    //   callback(null);
    // });
  }

  /**
   * Handle requests to get the current value of the "RotationSpeed" characteristic.
   * Rotation speed is used to control the volume.
   */
  handleRotationSpeedGet(callback) {
    this.platform.log.debug('Triggered GET RotationSpeed');

    // this.platform.yamahaAVRAPI.postReceiverGetAction(YamahaAction.VOLUME_GET, this.isZoneB).then((answer) => {
    //   const currentVolume = parseInt(answer.Val);

    //   // To calculate a percentage (0 - 100) of volume we do ((current - minimum) / (maximum - minimum)).
    //   let volume = ((currentVolume - this.platform.minVolume) / (this.platform.maxVolume - this.platform.minVolume)) * 100;
    //   volume = Math.round(volume);

    //   callback(null, volume);
    // });
  }

  /**
   * Handle requests to set the "RotationSpeed" characteristic.
   * Rotation speed is used to control the volume.
   */
  handleRotationSpeedSet(value, callback) {
    this.platform.log.debug(`Triggered SET RotationSpeed: ${value}`);

    // We need to translate from 0 - 100 to our receiver's scale.
    // We do this by: minimum + ((maximum - minimum) * (value / 100))
    // Then we devide by 10, round and multiply by 10 again. This is done since -301 is not a valid number (should be -300 or -305).
    // let volume = this.platform.minVolume + ((this.platform.maxVolume - this.platform.minVolume) * (value / 100));
    // volume = Math.round(volume / 10) * 10;

    // this.platform.yamahaAVRAPI.postReceiverSetAction(YamahaAction.VOLUME_SET_VALUE, volume, this.isZoneB).then(() => {
    //   callback(null);
    // });
  }
}