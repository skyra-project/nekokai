import { Result, ok } from '@sapphire/result';
import { Time } from '@sapphire/time-utilities';
import { cutText, isNullishOrEmpty } from '@sapphire/utilities';
import { container } from '@skyra/http-framework';
import { Json, safeTimedFetch, type FetchError } from '@skyra/safe-fetch';
import type { Media } from './anilist-types';

export enum AnilistKeys {
	AnimeSearch = 'aas',
	AnimeResult = 'aar',
	MangaSearch = 'ams',
	MangaResult = 'amr'
}

export async function anilistAnimeGet(query: string): Promise<Result<Media | null, FetchError>> {
	const key = `${AnilistKeys.AnimeResult}:${query}`;
	const cached = await container.redis.get(key);
	if (cached) return ok(JSON.parse(cached));

	const result = await anilistAnimeSearch(query);
	return result.map((entries) => (isNullishOrEmpty(entries) ? null : entries[0]));
}

export async function anilistMangaGet(query: string): Promise<Result<Media | null, FetchError>> {
	const key = `${AnilistKeys.MangaResult}:${query}`;
	const cached = await container.redis.get(key);
	if (cached) return ok(JSON.parse(cached));

	const result = await anilistMangaSearch(query);
	return result.map((entries) => (isNullishOrEmpty(entries) ? null : entries[0]));
}

export async function anilistAnimeSearch(query: string): Promise<Result<readonly Media[], FetchError>> {
	const key = `${AnilistKeys.AnimeSearch}:${query}`;
	const cached = await loadSearchResultsFromRedis(key, AnilistKeys.AnimeResult);
	if (cached) return ok(cached);

	const body = isNullishOrEmpty(query) ? GetTrendingAnimeBody : JSON.stringify({ variables: { query }, query: GetAnimeQuery });
	return sharedSearch(key, AnilistKeys.AnimeResult, body);
}

export async function anilistMangaSearch(query: string): Promise<Result<readonly Media[], FetchError>> {
	const key = `${AnilistKeys.MangaSearch}:${query}`;
	const cached = await loadSearchResultsFromRedis(key, AnilistKeys.MangaResult);
	if (cached) return ok(cached);

	const body = isNullishOrEmpty(query) ? GetTrendingMangaBody : JSON.stringify({ variables: { query }, query: GetMangaQuery });
	return sharedSearch(key, AnilistKeys.MangaResult, body);
}

async function sharedSearch(key: string, prefix: AnilistKeys, body: string) {
	const result = await Json<{ data: { Page: { media: readonly Media[] } } }>(
		safeTimedFetch('https://graphql.anilist.co/', 2000, { method: 'POST', body, headers: Headers })
	);

	return result.map((data) => data.data.Page.media).inspectAsync((entries) => saveSearchResultsToRedis(key, prefix, entries));
}

async function loadSearchResultsFromRedis(key: string, prefix: AnilistKeys) {
	const list = await container.redis.get(key);
	if (isNullishOrEmpty(list)) return null;

	const ids = JSON.parse(list) as readonly string[];
	const entries = await container.redis.mget(...ids.map((id) => `${prefix}:${id}`));
	return entries.map((entry) => JSON.parse(entry!) as Media);
}

async function saveSearchResultsToRedis(key: string, prefix: AnilistKeys, entries: readonly Media[]) {
	const names = entries.map((entry) => cutText(entry.title.english || entry.title.romaji || entry.title.native || entry.id.toString(), 100));
	const pipeline = container.redis.pipeline();
	pipeline.set(key, JSON.stringify(names), 'EX', Time.Hour);
	for (const [index, entry] of entries.entries()) {
		pipeline.set(`${prefix}:${names[index]}`, JSON.stringify(entry), 'EX', Time.Hour);
	}

	await pipeline.exec();
}

export const Headers = {
	accept: 'application/json',
	'content-type': 'application/json'
};

const MediaFragment = `
	fragment MediaFragment on Media {
		id
		title {
			romaji
			english
			native
		}
		description
		isAdult
		countryOfOrigin
		duration
		siteUrl
		externalLinks {
			url
			site
		}
	}
`;

const GetTrendingAnimeBody = JSON.stringify({
	variables: null,
	query: `
	${MediaFragment}

	query getTrendingAnime($sort: [MediaSort] = [TRENDING_DESC]) {
		Page(page: 1, perPage: 25) {
			media(type: ANIME, sort: $sort) {
				...MediaFragment
				chapters
				volumes
			}
		}
	}`
});

const GetTrendingMangaBody = JSON.stringify({
	variables: null,
	query: `
	${MediaFragment}

	query getTrendingAnime($sort: [MediaSort] = [TRENDING_DESC]) {
		Page(page: 1, perPage: 25) {
			media(type: MANGA, sort: $sort) {
				...MediaFragment
				chapters
				volumes
			}
		}
	}`
});

export const GetAnimeQuery = `
	${MediaFragment}

	query getAnime($query: String!) {
		Page(page: 1, perPage: 25) {
			media(search: $query, type: ANIME, isAdult: false) {
				...MediaFragment
				episodes
			}
		}
	}
`;

export const GetMangaQuery = `
	${MediaFragment}

	query getManga($query: String!) {
		Page(page: 1, perPage: 25) {
			media(search: $query, type: MANGA, isAdult: false) {
				...MediaFragment
				episodes
			}
		}
	}
`;
