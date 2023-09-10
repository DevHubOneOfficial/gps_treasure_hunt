import { Controller, Get, Header, Query, UnauthorizedException, StreamableFile } from '@nestjs/common';
import { AppService } from './app.service';
import * as bcrypt from 'bcrypt';
import { createReadStream } from 'fs';
import { join } from 'path';

const data = require('../data/data.json');
const imageFolder = join(__dirname, '..');


@Controller()
export class AppController {
    private readonly accessTokenHash: string;

    constructor(private readonly appService: AppService) {
        const saltRounds = 10;
        const accessToken = 'mysecretaccesstoken';

        // Generate a hash of the access token
        this.accessTokenHash = bcrypt.hashSync(accessToken, saltRounds);
    }

    @Get('coordinates')
    @Header('Cache-Control', 'none')
    @Header('Content-Type', 'application/json')
    async getJson(@Query('accessToken') accessToken: string) {
        // Validate the access token
        if (!accessToken) {
            throw new UnauthorizedException('Access token is required');
        }

        if (!bcrypt.compareSync(accessToken, this.accessTokenHash)) {
            throw new UnauthorizedException('Invalid access token');
        }
        console.log("I am here");

        const currentDate = new Date();
        let currentObject = null;

        for (const item of data) {
            const dateFrom = new Date(item.dateFrom);
            const dateTo = new Date(item.dateTo);

            if (currentDate >= dateFrom && currentDate <= dateTo) {
                currentObject = item;
                break;
            }
        }

        if (currentObject !== null) {
            const { coordinates, objectName, imagePath } = currentObject;

            // Read the image file
            const imageStream = createReadStream(join(imageFolder, imagePath));
            // debug
            console.log(imageStream);
            const imageBase64 = await this.streamToBase64(imageStream);
            console.log(imageBase64);

            // Return the image as part of the JSON response
            return { coordinates, objectName, image: imageBase64 };
        } else {
            return { message: "No object found for the current date." };
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


