import { Controller, Get, Header, Query, UnauthorizedException, StreamableFile } from '@nestjs/common';
import { AppService } from './app.service';
import * as bcrypt from 'bcrypt';
import { createReadStream, promises as fsPromises } from 'fs';
import { join } from 'path';

const data = require('../data/data.json');
const imageFolder = join(__dirname, '..', 'data');

@Controller()
export class AppController {
    private readonly accessTokenHash: string;

    constructor(private readonly appService: AppService) {
        const saltRounds = 10;
        const accessToken = 'devhubonesecrettokennobodyknows';
        this.accessTokenHash = bcrypt.hashSync(accessToken, saltRounds);
    }

    @Get('coordinates')
    @Header('Cache-Control', 'none')
    @Header('Content-Type', 'application/json')
    async getJson(@Query('accessToken') accessToken: string) {
        // // Validate the access token
        // if (!accessToken) {
        //     throw new UnauthorizedException('Access token is required');
        // }
        //
        // if (bcrypt.compareSync(accessToken, this.accessTokenHash)) {
        //     throw new UnauthorizedException('Invalid access token');
        // }

        const currentDate = new Date();

        let currentObject = null;

        // Adjust the comparison to include hours and minutes
        for (const item of data) {
            const dateFrom = new Date(item.dateFrom);
            const dateTo = new Date(item.dateTo);

            // Ensure time is compared down to the minute
            if (currentDate >= dateFrom && currentDate <= dateTo &&
              currentDate.getHours() === dateFrom.getHours() &&
              currentDate.getMinutes() >= dateFrom.getMinutes() &&
              currentDate.getHours() === dateTo.getHours() &&
              currentDate.getMinutes() <= dateTo.getMinutes()) {
                currentObject = item;
                break;
            }
        }

        if (currentObject !== null) {
            const { coordinates, objectName, imagePath } = currentObject;

            // Read the image file
            const imageStream = createReadStream(join(imageFolder, imagePath));
            const imageBase64 = await this.streamToBase64(imageStream);

            return { coordinates, objectName, image: imageBase64 };
        } else {
            return { message: "No object found for the current date and time." };
        }
    }

    private async streamToBase64(stream): Promise<string> {
        return new Promise((resolve, reject) => {
            const chunks = [];
            stream.on('data', (chunk) => {
                chunks.push(chunk);
            });
            stream.on('end', () => {
                const buffer = Buffer.concat(chunks);
                resolve(buffer.toString('base64'));
            });
            stream.on('error', (error) => {
                reject(error);
            });
        });
    }
}