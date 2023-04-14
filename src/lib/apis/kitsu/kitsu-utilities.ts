import { KitsuApiUrl, KitsuHeaders } from '#lib/apis/kitsu/kitsu-constants';
import type {
	AnimeDatum,
	DateString,
	Description,
	KitsuHit,
	KitsuResult,
	KitsuTrendingAnime,
	KitsuTrendingManga,
	MangaDatum
} from '#lib/apis/kitsu/kitsu-types';
import { ok, type Result } from '@sapphire/result';
import { Time } from '@sapphire/time-utilities';
import { cutText, isNullishOrEmpty } from '@sapphire/utilities';
import { container } from '@skyra/http-framework';
import { Json, safeTimedFetch, type FetchError } from '@skyra/safe-fetch';
import { stringify } from 'node:querystring';

export enum KitsuKeys {
	AnimeSearch = 'kas',
	AnimeResult = 'kar',
	MangaSearch = 'kms',
	MangaResult = 'kmr'
}

export async function kitsuAnimeGet(query: string): Promise<Result<KitsuAnime | null, FetchError>> {
	const key = `${KitsuKeys.AnimeResult}:${query.toLowerCase()}`;
	const cached = await container.redis.get(key);
	if (cached) return ok(JSON.parse(cached));

	const result = await kitsuAnimeSearch(query);
	return result.map((entries) => (isNullishOrEmpty(entries) ? null : entries[0]));
}

export async function kitsuMangaGet(query: string): Promise<Result<KitsuManga | null, FetchError>> {
	const key = `${KitsuKeys.MangaResult}:${query.toLowerCase()}`;
	const cached = await container.redis.get(key);
	if (cached) return ok(JSON.parse(cached));

	const result = await kitsuMangaSearch(query);
	return result.map((entries) => (isNullishOrEmpty(entries) ? null : entries[0]));
}

export async function kitsuAnimeSearch(query: string): Promise<Result<readonly KitsuAnime[], FetchError>> {
	const key = `${KitsuKeys.AnimeSearch}:${query.toLowerCase()}`;
	const cached = await loadSearchResultsFromRedis(key, KitsuKeys.AnimeResult);
	if (cached) return ok(cached as KitsuAnime[]);

	return isNullishOrEmpty(query) ? fetchTrending(key, 'anime') : sharedSearch(key, 'anime', query);
}

export async function kitsuMangaSearch(query: string): Promise<Result<readonly KitsuManga[], FetchError>> {
	const key = `${KitsuKeys.MangaSearch}:${query.toLowerCase()}`;
	const cached = await loadSearchResultsFromRedis(key, KitsuKeys.MangaResult);
	if (cached) return ok(cached as KitsuManga[]);

	return isNullishOrEmpty(query) ? fetchTrending(key, 'manga') : sharedSearch(key, 'manga', query);
}

type Kind = 'anime' | 'manga';
type TypeMapper<T extends Kind> = {
	anime: KitsuAnime;
	manga: KitsuManga;
}[T];

async function fetchTrending<Type extends Kind>(key: string, type: Type): Promise<Result<readonly TypeMapper<Type>[], FetchError>> {
	const result = await Json<KitsuTrendingAnime | KitsuTrendingManga>(
		safeTimedFetch(`https://kitsu.io/api/edge/trending/${type}?limit=25`, Time.Second * 2)
	);

	return result
		.map((values) => values.data.map((value) => transformTrending(type, value)))
		.inspectAsync((entries) => saveSearchResultsToRedis(key, type === 'anime' ? KitsuKeys.AnimeResult : KitsuKeys.MangaResult, entries));
}

function transformTrending<Type extends Kind>(type: Type, data: AnimeDatum | MangaDatum): TypeMapper<Type> {
	return (type === 'anime' ? transformTrendingAnime(data as AnimeDatum) : transformTrendingManga(data as MangaDatum)) as TypeMapper<Type>;
}

function transformTrendingAnime(data: AnimeDatum) {
	return {
		id: Number(data.id),
		synopsis: data.attributes.synopsis,
		description: { en: data.attributes.description } as Description,
		averageRating: Number(data.attributes.averageRating),
		subtype: data.attributes.subtype,
		titles: { ...data.attributes.titles, canonical: data.attributes.canonicalTitle },
		poster: data.attributes.posterImage.original,
		ageRating: data.attributes.ageRating,
		startDate: data.attributes.startDate,
		episodeCount: data.attributes.episodeCount,
		episodeLength: data.attributes.episodeLength
	};
}

export type KitsuAnime = ReturnType<typeof transformTrendingAnime>;

function transformTrendingManga(data: MangaDatum) {
	return {
		id: Number(data.id),
		synopsis: data.attributes.synopsis,
		description: { en: data.attributes.description } as Description,
		averageRating: Number(data.attributes.averageRating),
		subtype: data.attributes.subtype,
		titles: { ...data.attributes.titles, canonical: data.attributes.canonicalTitle },
		poster: data.attributes.posterImage.original,
		ageRating: data.attributes.ageRating,
		startDate: data.attributes.startDate,
		chapterCount: data.attributes.chapterCount,
		volumeCount: data.attributes.volumeCount
	};
}

export type KitsuManga = ReturnType<typeof transformTrendingManga>;

async function sharedSearch<Type extends Kind>(key: string, kind: Type, query: string): Promise<Result<readonly TypeMapper<Type>[], FetchError>> {
	const result = await Json<KitsuResult>(
		safeTimedFetch(KitsuApiUrl, Time.Second * 2, {
			method: 'POST',
			headers: KitsuHeaders,
			body: JSON.stringify({ params: stringify({ query, facetFilters: [`kind:${kind}`], hitsPerPage: 25 }) })
		})
	);

	return result
		.map((data) => data.hits.map((hit) => transformAlgolia(kind, hit)))
		.inspectAsync((entries) => saveSearchResultsToRedis(key, kind === 'anime' ? KitsuKeys.AnimeResult : KitsuKeys.MangaResult, entries));
}

function transformAlgolia<Type extends Kind>(type: Type, data: KitsuHit): TypeMapper<Type> {
	return (type === 'anime' ? transformAlgoliaAnime(data) : transformAlgoliaManga(data)) as TypeMapper<Type>;
}

function transformAlgoliaAnime(data: KitsuHit): KitsuAnime {
	return {
		id: data.id,
		synopsis: data.synopsis ?? '',
		description: data.description ?? {},
		averageRating: data.averageRating,
		subtype: data.subtype,
		titles: { ...data.titles, canonical: data.canonicalTitle },
		poster: data.posterImage.original,
		ageRating: data.ageRating,
		startDate: data.startDate as unknown as DateString,
		episodeCount: data.episodeCount!,
		episodeLength: data.episodeLength!
	};
}

function transformAlgoliaManga(data: KitsuHit): KitsuManga {
	return {
		id: data.id,
		synopsis: data.synopsis ?? '',
		description: data.description ?? {},
		averageRating: data.averageRating,
		subtype: data.subtype,
		titles: { ...data.titles, canonical: data.canonicalTitle },
		poster: data.posterImage.original,
		ageRating: data.ageRating,
		startDate: data.startDate as unknown as DateString,
		chapterCount: data.chapterCount!,
		volumeCount: data.volumeCount!
	};
}

async function loadSearchResultsFromRedis(key: string, prefix: KitsuKeys): Promise<readonly KitsuAnime[] | readonly KitsuManga[] | null> {
	const list = await container.redis.get(key);
	if (isNullishOrEmpty(list)) return null;

	const ids = JSON.parse(list) as readonly string[];
	if (isNullishOrEmpty(ids)) return null;

	const entries = await container.redis.mget(...ids.map((id) => `${prefix}:${id.toLowerCase()}`));
	return entries.map((entry) => JSON.parse(entry!)) as KitsuAnime[] | KitsuManga[];
}

async function saveSearchResultsToRedis(key: string, prefix: KitsuKeys, entries: readonly (KitsuAnime | KitsuManga)[]) {
	const names = entries.map((entry) => cutText(entry.titles.en || entry.titles.en_jp || entry.titles.canonical, 100));
	const pipeline = container.redis.pipeline();
	pipeline.set(key, JSON.stringify(names), 'EX', Time.Hour);
	for (const [index, entry] of entries.entries()) {
		pipeline.set(`${prefix}:${names[index].toLowerCase()}`, JSON.stringify(entry), 'EX', Time.Hour);
	}

	await pipeline.exec();
}
