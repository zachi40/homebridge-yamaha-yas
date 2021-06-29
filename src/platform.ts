import { API, IndependentPlatformPlugin, Logger, PlatformAccessory, PlatformConfig, Service, Characteristic, APIEvent } from 'homebridge';

import { PLATFORM_NAME, PLUGIN_NAME } from './settings';

import { YamahaReciver } from './platformAccessory';
import { YamahaAVAPI} from './yamahaAPI';


type YamahaDeviceInfo = {
  uuid: string;
  displayName: string;
};

export class YamahaYAS209Platform implements IndependentPlatformPlugin {
  public readonly Service: typeof Service = this.api.hap.Service;
  public readonly Characteristic: typeof Characteristic = this.api.hap.Characteristic;
  private readonly receiverIP: string;
  public readonly accessories: PlatformAccessory[] = [];
  public readonly yamahaAVRAPI: YamahaAVAPI;
  private readonly mainDisplayName: string;


  constructor(public readonly log: Logger, public readonly config: PlatformConfig, public readonly api: API) {
    this.log.debug('Finished initializing platform:', this.config.name);

    // Get the receiver's IP  and Zone B name as the user configured.
    this.receiverIP = config['receiverIP'] as string;
    this.mainDisplayName = config['name'] as string;
    //this.minVolume = config['minVolume'] ? parseInt(config['minVolume'] as string) * 10 : -700;
    //this.maxVolume = config['maxVolume'] ? parseInt(config['maxVolume'] as string) * 10 : 100;
    this.yamahaAVRAPI = new YamahaAVAPI(this.receiverIP, this.log);

    // run the method to discover / register your devices as accessories
    this.discoverDevices();
  }

  configureAccessory(accessory: PlatformAccessory) {
    this.log.info('Loading accessory from cache:', accessory.displayName);

    // add the restored accessory to the accessories cache so we can track if it has already been registered
    this.accessories.push(accessory);
  }

  discoverDevices() {
    // Send a basic power response, to see if we get a response which will indicate we discovered the receiver.
    this.yamahaAVRAPI.postReceiverGetStatus().then(data => {
      // eslint-disable-next-line eqeqeq
      if (data) {
        this.log.debug(`data: ${JSON.parse(data)}`);
        // We found the receiver. Let's register it as two devices: main and zone b.
        // generate a unique id for the accessory this should be generated from
        // something globally unique, but constant, for example, the device serial
        // number or MAC address.
        const mainUuid = this.api.hap.uuid.generate(this.receiverIP);

        const devices: YamahaDeviceInfo[] = [
          {uuid: mainUuid, displayName: this.mainDisplayName}, // The main zone device.
        ];

        // loop over the discovered devices and register each one if it has not already been registered
        for (const device of devices) {
          // see if an accessory with the same uuid has already been registered and restored from
          // the cached devices we stored in the `configureAccessory` method above
          const existingAccessory = this.accessories.find(accessory => accessory.UUID === device.uuid);

          if (existingAccessory) {
            // the accessory already exists
            this.log.info('Restoring existing accessory from cache:', existingAccessory.displayName);

            // if you need to update the accessory.context then you should run `api.updatePlatformAccessories`. eg.:
            // existingAccessory.context.device = device;
            // this.api.updatePlatformAccessories([existingAccessory]);

            // create the accessory handler for the restored accessory
            // this is imported from `platformAccessory.ts`
            new YamahaReciver(this, existingAccessory);

          } else {
            // the accessory does not yet exist, so we need to create it
            this.log.info('Adding new accessory:', device.displayName);

            // create a new accessory
            const accessory = new this.api.platformAccessory(device.displayName, device.uuid);

            // store a copy of the device object in the `accessory.context`
            // the `context` property can be used to store any data about the accessory you may need
            accessory.context.device = device;

            // create the accessory handler for the newly create accessory
            // this is imported from `platformAccessory.ts`
            new YamahaReciver(this, accessory);

            // link the accessory to your platform
            this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
          }

          // it is possible to remove platform accessories at any time using `api.unregisterPlatformAccessories`, eg.:
          // this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
        }

      } else {
        // No receiver found. Log an error and finish.
        this.log.error('Couldn\'t find receiver. Please check the receiverIP is configured correctly.');
      }
    });
  }
}