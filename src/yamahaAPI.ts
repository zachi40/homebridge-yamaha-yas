import fs from 'fs';
import request from 'request';
import { Logger } from 'homebridge';


export enum YamahaAction {
    POWER = 'POWER',
    VOLUME_SET_UP_DOWN = 'VOLUME_SET_UP_DOWN',
    VOLUME_SET_VALUE = 'VOLUME_SET_VALUE',
    VOLUME_GET = 'VOLUME_GET',
    MUTE = 'MUTE'
}

enum YamahaCommand {
    SET = 'PUT',
    GET = 'GET',
    POST = 'POST'
}

export class YamahaAVAPI{
    private readonly p12location = __dirname + '/certificate.p12';
    private readonly p12password = 'Link2018qpwo';
    baseUrl: string;
    logger: Logger;
    linkplayUrl: string;

    constructor(receiverIP: string, logger: Logger, zoneBName?: string) {
      this.baseUrl = 'https://' + receiverIP + '/httpapi.asp?command=';
      this.linkplayUrl = 'https://' + receiverIP + '/httpapi.asp?command=';
      this.logger = logger;
    }

    private async buildRequestData(command){
      this.logger.debug(`Sending: ${command}`);
      const options = {
        url: this.baseUrl+command,
        rejectUnauthorized: false,
        headers: {
          'content-type': 'application/json',
        },
        agentOptions: {
          pfx: fs.readFileSync(__dirname + '/certificate.p12'),
          passphrase: 'Link2018qpwo',
        },
      };
      request.get(options, (error, response, body) => {
        return body;
      });
    }

    public postReceiverGetStatus() {
      return new Promise<any>((resolve) => {
        const data = this.buildRequestData('YAMAHA_DATA_GET') || '';
        resolve(data);
      });
    }
}