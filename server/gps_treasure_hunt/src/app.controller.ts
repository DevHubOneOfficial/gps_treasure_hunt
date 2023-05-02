import { Controller, Get, Header, Query, UnauthorizedException } from '@nestjs/common';
import { AppService } from './app.service';
import * as bcrypt from 'bcrypt';
const data = require('../data/data.json');

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
    getJson(@Query('accessToken') accessToken: string) {
        // Validate the access token
        if (!accessToken) {
            throw new UnauthorizedException('Access token is required');
        }

        if (!bcrypt.compareSync(accessToken, this.accessTokenHash)) {
            throw new UnauthorizedException('Invalid access token');
        }

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
            const { coordinates, objectName, description } = currentObject;
            return { coordinates, objectName, description };
        } else {
            return { message: "No object found for the current date." };
        }
    }
}
