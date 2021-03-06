import type { KitsuResult } from '#lib/apis/kitsu/kitsu-types';
import { Result } from '@sapphire/result';
import { envParseString } from '@skyra/env-utilities';
import { stringify } from 'node:querystring';

const KITSU_API_URL = `https://${envParseString('KITSU_ID')}-dsn.algolia.net/1/indexes/production_media/query`;

export function fetchKitsuApi(mangaOrAnime: 'manga' | 'anime', name: string, hitsPerPage = 25): Promise<Result<KitsuResult, unknown>> {
	return Result.fromAsync(async () => {
		const response = await fetch(KITSU_API_URL, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'X-Algolia-API-Key': envParseString('KITSU_TOKEN'),
				'X-Algolia-Application-Id': envParseString('KITSU_ID')
			},
			body: JSON.stringify({
				params: stringify({
					query: name,
					facetFilters: [`kind:${mangaOrAnime}`],
					hitsPerPage
				})
			})
		});

		return (await response.json()) as Promise<KitsuResult>;
	});
}
