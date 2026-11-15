export interface IMappingProvider {
  name: string;
  providerId: string;
  getTileUrl(): string;
  getAttribution(): string;
}

export class OpenStreetMapProvider implements IMappingProvider {
  name = 'OpenStreetMap';
  providerId = 'osm';

  getTileUrl(): string {
    return 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
  }

  getAttribution(): string {
    return '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
  }
}

