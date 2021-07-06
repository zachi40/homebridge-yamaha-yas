import { API, IndependentPlatformPlugin, Logger, PlatformAccessory, PlatformConfig, Service, Characteristic} from 'homebridge';
import { Yamahaaccessory } from './platformAccessory';
import { YamahaAPI} from './yamahaAPI';
import { PLATFORM_NAME, PLUGIN_NAME } from './settings';


export class YamahaYasPlatform implements IndependentPlatformPlugin {
  public readonly Service: typeof Service = this.api.hap.Service;
  public readonly Characteristic: typeof Characteristic = this.api.hap.Characteristic;
  private readonly receiverIP: string;
  public readonly accessories: PlatformAccessory[] = [];
  public readonly yamahaAPI: YamahaAPI;
  private readonly mainDisplayName: string;


  constructor(public readonly log: Logger, public readonly config: PlatformConfig, public readonly api: API) {

    this.receiverIP = config['receiverIP'] as string;
    this.mainDisplayName = config['name'] as string;
    this.yamahaAPI = new YamahaAPI(this.receiverIP, this.log);

    this.log.debug('Finished initializing platform:', this.config.name);
    this.api.on('didFinishLaunching', () => {
      log.debug('Executed didFinishLaunching callback');
      this.discoverDevices();
    });
  }


  configureAccessory(accessory: PlatformAccessory) {
    this.log.info('Loading accessory from cache:', accessory.displayName);
    this.accessories.push(accessory);
  }

  discoverDevices() {
    this.yamahaAPI.getStatus().then(data => {
      if (data) {
        const uuid = this.api.hap.uuid.generate(data['uuid']);
        const existingAccessory = this.accessories.find(accessory => accessory.UUID === uuid);
        if (existingAccessory) {
          this.log.info('Restoring existing accessory from cache:', existingAccessory.displayName);
          new Yamahaaccessory(this, existingAccessory, this.config);
        } else {
          this.log.info('Adding new accessory:', data['DeviceName']);
          const accessory = new this.api.platformAccessory( data['DeviceName'], uuid);
          accessory.context.device = data;
          new Yamahaaccessory(this, accessory, this.config);
          this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
        }
      } else {
        this.log.error('Couldn\'t find receiver. Please check the receiverIP is configured correctly.');
      }
    });
  }
}