import rawSeasons from './seasons.json';
import { seasonsSchema } from './schemas/seasons';

export function loadSeasons(data: unknown) {
  return seasonsSchema.parse(data);
}

export const colorSeasons = loadSeasons(rawSeasons);
