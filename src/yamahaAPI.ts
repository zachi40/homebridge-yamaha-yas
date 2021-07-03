import fs from 'fs';
import request from 'request';
import { Logger } from 'homebridge';


export class YamahaAPI{
    private readonly p12location = __dirname + '/certificate.p12';
    private readonly p12password = 'Link2018qpwo';
    private readonly baseUrl: string;
    private readonly logger: Logger;

    constructor(receiverIP: string, logger: Logger) {
      this.baseUrl = `https://${receiverIP}/httpapi.asp?command=`;
      this.logger = logger;
    }

    private async buildRequestData(command){
      this.logger.debug(`Sending: ${command}`);
      const options = {
        url: this.baseUrl+command,
        rejectUnauthorized: false,
        agentOptions: {
          pfx: fs.readFileSync(this.p12location),
          passphrase: this.p12password,
        },
      };

      return new Promise<string>(callback => {
        request.get(options, (error, response, body) => {
          callback(body);
        });
      });
    }

    public async getStatus() {
      return JSON.parse(await this.buildRequestData('getStatusEx'));
    }

    public async getPower() {
      // eslint-disable-next-line no-async-promise-executor
      const data = JSON.parse(await this.buildRequestData('YAMAHA_DATA_GET'));
      this.logger.debug(`Get power state: ${data['power saving']}`);
      return data['power saving'];
    }

    public async setPower(value ) {
      this.logger.debug(`Set power state: ${value}`);
      if (value){
        //powerOn
        await this.buildRequestData('YAMAHA_DATA_SET%3a{"power+saving"%3a"1"}');
        this.logger.debug('Poweron');

      } else {
        //powerOff
        await this.buildRequestData('YAMAHA_DATA_SET%3a{"power+saving"%3a"0"}');
        this.logger.debug('Poweroff');
      }
    }

}