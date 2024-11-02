import type { AnilistEntryAnime, AnilistEntryManga } from '#lib/utilities/anilist/types';
import { TemporaryCollection } from '#lib/utilities/temporary-collection';
import { Result, ok } from '@sapphire/result';
import { Time } from '@sapphire/time-utilities';
import { cutText, isNullishOrEmpty } from '@sapphire/utilities';
import { Json, safeTimedFetch, type FetchError, type FetchResult } from '@skyra/safe-fetch';
import he from 'he';

const cache = {
	anime: {
		search: new TemporaryCollection<string, readonly number[]>({ lifetime: Time.Hour, sweepInterval: Time.Minute }),
		result: new TemporaryCollection<number, AnilistEntryAnime>({ lifetime: Time.Hour, sweepInterval: Time.Minute })
	},
	manga: {
		search: new TemporaryCollection<string, readonly number[]>({ lifetime: Time.Hour, sweepInterval: Time.Minute }),
		result: new TemporaryCollection<number, AnilistEntryManga>({ lifetime: Time.Hour, sweepInterval: Time.Minute })
	}
};

export type AnilistEntryTypeByKind<Kind extends 'anime' | 'manga'> = {
	anime: AnilistEntryAnime;
	manga: AnilistEntryManga;
}[Kind];

/**
 * Regex to remove excessive new lines from the Anime or Manga description
 */
const excessiveNewLinesRegex = /\n{3,}/g;

/**
 * Regex to remove HTML entities from the Anime or Manga description
 */
const htmlEntityRegex = /<\/?(i|em|var|b|br|code|pre|mark|kbd|s|wbr|u)>/g;

/**
 * Replacements for HTML entities
 */
const htmlEntityReplacements = Object.freeze({
	i: '_',
	em: '_',
	var: '_',
	b: '**',
	br: '\n',
	code: '```',
	pre: '`',
	mark: '`',
	kbd: '`',
	s: '~~',
	wbr: '',
	u: '__'
} as const);

export function parseAniListDescription(description: string) {
	return cutText(
		he
			.decode(
				description
					.replaceAll('\r\n', '\n')
					.replace(htmlEntityRegex, (_, type: keyof typeof htmlEntityReplacements) => htmlEntityReplacements[type])
			)
			.replace(excessiveNewLinesRegex, '\n\n'),
		500
	);
}

export async function anilistAnimeGet(id: number): Promise<Result<AnilistEntryAnime | null, FetchError>> {
	const cached = cache.anime.result.get(id);
	return cached ? ok(cached) : sharedSearchId('anime', id);
}

export async function anilistMangaGet(id: number): Promise<Result<AnilistEntryManga | null, FetchError>> {
	const cached = cache.manga.result.get(id);
	return cached ? ok(cached) : sharedSearchId('manga', id);
}

export async function anilistAnimeSearch(query: string): Promise<Result<readonly AnilistEntryAnime[], FetchError>> {
	const cached = cache.anime.search.get(query.toLowerCase());
	if (cached) return ok(cached.map((id) => cache.anime.result.get(id)!));

	const body = isNullishOrEmpty(query) ? GetTrendingAnimeBody : JSON.stringify({ variables: { query }, query: GetAnimeQuery });
	return sharedSearch('anime', query, body);
}

export async function anilistMangaSearch(query: string): Promise<Result<readonly AnilistEntryManga[], FetchError>> {
	const cached = cache.manga.search.get(query.toLowerCase());
	if (cached) return ok(cached.map((id) => cache.manga.result.get(id)!));

	const body = isNullishOrEmpty(query) ? GetTrendingMangaBody : JSON.stringify({ variables: { query }, query: GetMangaQuery });
	return sharedSearch('manga', query, body);
}

async function sharedSearchId<Kind extends 'anime' | 'manga'>(kind: Kind, id: number): Promise<FetchResult<AnilistEntryTypeByKind<Kind> | null>> {
	const query = kind === 'anime' ? GetAnimeQuery : GetMangaQuery;
	const result = await Json<{ data: { Page: { media: AnilistEntryTypeByKind<Kind>[] } } }>(
		safeTimedFetch('https://graphql.anilist.co/', 2000, {
			method: 'POST',
			body: JSON.stringify({ variables: { id }, query }),
			headers: Headers
		})
	);

	return result
		.map((data) => data.data.Page.media.at(0) ?? null)
		.inspect((entry) => {
			if (entry) cache[kind].result.add(id, entry);
		});
}

async function sharedSearch<Kind extends 'anime' | 'manga'>(
	kind: Kind,
	query: string,
	body: string
): Promise<FetchResult<AnilistEntryTypeByKind<Kind>[]>> {
	const result = await Json<{ data: { Page: { media: AnilistEntryTypeByKind<Kind>[] } } }>(
		safeTimedFetch('https://graphql.anilist.co/', 2000, { method: 'POST', body, headers: Headers })
	);

	return result
		.map((data) => data.data.Page.media)
		.inspect((entries) => {
			cache[kind].search.add(
				query,
				entries.map((entry) => entry.id)
			);

			for (const entry of entries) {
				cache[kind].result.add(entry.id, entry);
			}
		});
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
		format
		seasonYear
		startDate {
			year
		}
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
				episodes
				duration
			}
		}
	}`
});

const GetTrendingMangaBody = JSON.stringify({
	variables: null,
	query: `
	${MediaFragment}

	query getTrendingManga($sort: [MediaSort] = [TRENDING_DESC]) {
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

	query getAnime($id: Int, $query: String) {
		Page(page: 1, perPage: 25) {
			media(id: $id, search: $query, type: ANIME, isAdult: false) {
				...MediaFragment
				episodes
				duration
			}
		}
	}
`;

export const GetMangaQuery = `
	${MediaFragment}

	query getManga($id: Int, $query: String) {
		Page(page: 1, perPage: 25) {
			media(id: $id, search: $query, type: MANGA, isAdult: false) {
				...MediaFragment
				chapters
				volumes
			}
		}
	}
`;
