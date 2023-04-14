import { envParseString } from '@skyra/env-utilities';

export const KitsuApiUrl = `https://${envParseString('KITSU_ID')}-dsn.algolia.net/1/indexes/production_media/query`;
export const KitsuHeaders = {
	'Content-Type': 'application/json',
	'X-Algolia-API-Key': envParseString('KITSU_TOKEN'),
	'X-Algolia-Application-Id': envParseString('KITSU_ID')
} as const;
