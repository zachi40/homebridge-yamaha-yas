import { PlatformAccessory, Logger, CharacteristicValue, CharacteristicSetCallback} from 'homebridge';
import { YamahaYasPlatform } from './platform';
import { YamahaAPI } from './yamahaAPI';
import { PLUGIN_NAME} from './settings';

export class Yamahaaccessory {
  private readonly platform: YamahaYasPlatform;
  private readonly accessory: PlatformAccessory;
  private readonly log: Logger;
  yamahaapi: YamahaAPI;

  //services
  config: any;
  Service: any;
  Characteristic: any;
  tvAccessory: any;

  constructor(platform, accessory, config) {
    this.platform = platform;
    this.accessory = accessory;
    this.config = config;
    this.log = platform.log;
    const inputs = [];


    this.Service = this.platform.api.hap.Service;
    this.Characteristic = this.platform.api.hap.Characteristic;

    this.yamahaapi = new YamahaAPI( this.config.name, this.log);


    const tvName = this.config.name || 'Yahama Yas';

    // generate a UUID
    const uuid = this.platform.api.hap.uuid.generate('homebridge:my-tv-plugin' + tvName);
    // create the accessory
    this.tvAccessory = new this.platform.api.platformAccessory(tvName, uuid);

    // set the accessory category
    this.tvAccessory.category = this.platform.api.hap.Categories.TELEVISION;

    this.tvAccessory.getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, 'Yamaha')
      .setCharacteristic(this.platform.Characteristic.Model, this.accessory.context.device.yamaha_model_name|| 'Unknown')
      .setCharacteristic(this.platform.Characteristic.SerialNumber, this.accessory.context.device.uuid|| 'Unknown')
      .setCharacteristic(this.platform.Characteristic.FirmwareRevision, this.accessory.context.device.mcu_ver_custimize || 'Unknown');

    // add the tv service
    const tvService = this.tvAccessory.addService(this.Service.Television);

    // set the tv name
    tvService.setCharacteristic(this.Characteristic.ConfiguredName, tvName);

    // set sleep discovery characteristic
    tvService.setCharacteristic(this.Characteristic.SleepDiscoveryMode,
      this.Characteristic.SleepDiscoveryMode.ALWAYS_DISCOVERABLE);

    // handle on / off events using the Active characteristic
    tvService
      .getCharacteristic(this.Characteristic.Active)
      .on('get', async (callback) => {
        this.log.debug(`${tvName} - GET Active`);
        try {
          const isActive = await this.yamahaapi.getPower();
          callback(null, isActive);
        } catch (err) {
          callback(err);
        }
      })
      .on('set', async (newValue, callback) => {
        this.log.debug(`${tvName} - SET Active => setNewValue: ${newValue}`);
        try {
          await this.yamahaapi.setPower(newValue as boolean);
          tvService.updateCharacteristic(
            this.Characteristic.Active,
            newValue
              ? this.Characteristic.Active.ACTIVE
              : this.Characteristic.Active.INACTIVE,
          );
          callback(null);
        } catch (err) {
          callback(err);
        }
      });


    // handle input source changes
    tvService.getCharacteristic(this.Characteristic.ActiveIdentifier)
      .onSet((newValue) => {

        // the value will be the value you set for the Identifier Characteristic
        // on the Input Source service that was selected - see input sources below.

        this.log.info('set Active Identifier => setNewValue: ' + newValue);
      });


    /**
       * Create a speaker service to allow volume control
       */

    const speakerService = this.tvAccessory.addService(this.Service.TelevisionSpeaker);

    speakerService
      .setCharacteristic(this.Characteristic.Active, this.Characteristic.Active.ACTIVE)
      .setCharacteristic(this.Characteristic.VolumeControlType, this.Characteristic.VolumeControlType.ABSOLUTE);

    // handle volume control
    speakerService.getCharacteristic(this.Characteristic.VolumeSelector)
      .onSet((newValue) => {
        this.log.info('set VolumeSelector => setNewValue: ' + newValue);
      });

    /**
       * Create TV Input Source Services
       * These are the inputs the user can select from.
       * When a user selected an input the corresponding Identifier Characteristic
       * is sent to the TV Service ActiveIdentifier Characteristic handler.
       */


    // HDMI 1 Input Source
    // const hdmi1InputService = this.tvAccessory.addService(this.Service.InputSource, 'TV', 'TV');
    // hdmi1InputService
    //   .setCharacteristic(this.Characteristic.Identifier, 1)
    //   .setCharacteristic(this.Characteristic.ConfiguredName, 'TV')
    //   .setCharacteristic(this.Characteristic.IsConfigured, this.Characteristic.IsConfigured.CONFIGURED)
    //   .setCharacteristic(this.Characteristic.InputSourceType, this.Characteristic.InputSourceType.HDMI);
    // tvService.addLinkedService(hdmi1InputService); // link to tv service

    // // HDMI 2 Input Source
    // const hdmi2InputService = this.tvAccessory.addService(this.Service.InputSource, 'Bluetooth', 'Bluetooth');
    // hdmi2InputService
    //   .setCharacteristic(this.Characteristic.Identifier, 2)
    //   .setCharacteristic(this.Characteristic.ConfiguredName, 'bluetooth')
    //   .setCharacteristic(this.Characteristic.IsConfigured, this.Characteristic.IsConfigured.CONFIGURED)
    //   .setCharacteristic(this.Characteristic.InputSourceType, this.Characteristic.InputSourceType.HDMI);
    // tvService.addLinkedService(hdmi2InputService); // link to tv service

    // // Netflix Input Source
    // const netflixInputService = this.tvAccessory.addService(this.Service.InputSource, 'hdmi', 'Hdmi');
    // netflixInputService
    //   .setCharacteristic(this.Characteristic.Identifier, 3)
    //   .setCharacteristic(this.Characteristic.ConfiguredName, 'hdmi')
    //   .setCharacteristic(this.Characteristic.IsConfigured, this.Characteristic.IsConfigured.CONFIGURED)
    //   .setCharacteristic(this.Characteristic.InputSourceType, this.Characteristic.InputSourceType.HDMI);
    // tvService.addLinkedService(netflixInputService); // link to tv service


    /**
       * Publish as external accessory
       * Only one TV can exist per bridge, to bypass this limitation, you should
       * publish your TV as an external accessory.
       */

    this.platform.api.publishExternalAccessories(PLUGIN_NAME, [this.tvAccessory]);
  }
}
