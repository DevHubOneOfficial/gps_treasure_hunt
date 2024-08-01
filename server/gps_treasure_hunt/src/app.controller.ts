import { Controller, Get, Header, Query, UnauthorizedException } from '@nestjs/common';
import { AppService } from './app.service';
import * as bcrypt from 'bcrypt';
import { createReadStream } from 'fs';
import { join } from 'path';
import { DataDto } from './data.dto';  // Import the DataDto

const data: DataDto[] = require('../data/data.json');  // Type the data array as DataDto[]
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
        // if (!bcrypt.compareSync(accessToken, this.accessTokenHash)) {
        //     throw new UnauthorizedException('Invalid access token');
        // }

        const currentDate = new Date();

        const isWithinInterval = (currentDate: Date, dateFrom: string, dateTo: string) => {
            return currentDate >= new Date(dateFrom) && currentDate <= new Date(dateTo);
        };

        // Filter objects within the interval
        const objectsWithinInterval = data.filter((object) => {
            return isWithinInterval(currentDate, object.dateFrom, object.dateTo);
        });

        if (objectsWithinInterval.length > 0) {
            // Convert all active objects' images to base64
            const activeObjectsWithImages = await Promise.all(objectsWithinInterval.map(async (object) => {
                const { id, coordinates, objectName, imagePath } = object;

                // Read the image file
                const imageStream = createReadStream(join(imageFolder, imagePath));
                const imageBase64 = await this.streamToBase64(imageStream);

                return { id, coordinates, objectName, image: imageBase64 };
            }));

            return activeObjectsWithImages;
        } else {
            return { message: "No objects found for the current date and time." };
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
