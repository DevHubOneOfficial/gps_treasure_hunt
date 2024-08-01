export class CoordinatesDto {
  latitude: number;
  longitude: number;
}

export class DataDto {
  id: number;
  dateFrom: string;
  dateTo: string;
  coordinates: CoordinatesDto;
  objectName: string;
  imagePath: string;
}