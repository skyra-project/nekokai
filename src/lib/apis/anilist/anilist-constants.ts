import type { Page } from '#lib/apis/anilist/anilist-types';
import { Result } from '@sapphire/result';
import { cutText } from '@sapphire/utilities';
import he from 'he';

export interface AniListResponse {
	data: {
		Page: Page;
	};
}

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

export const getAnime = `
	${MediaFragment}

	query getAnime($search: String!) {
		Page(page: 1, perPage: 25) {
			media(search: $search, type: ANIME, isAdult: false) {
				...MediaFragment
				episodes
			}
		}
	}
`;

export const getManga = `
	${MediaFragment}

	query getManga($search: String!) {
		Page(page: 1, perPage: 25) {
			media(search: $search, type: MANGA, isAdult: false) {
				...MediaFragment
				chapters
				volumes
			}
		}
	}
`;

export async function fetchAniListApi(
	query: string,
	variables: {
		search: string;
	}
) {
	return Result.fromAsync(async () => {
		const response = await fetch('https://graphql.anilist.co/', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				query,
				variables
			})
		});

		return (await response.json()) as Promise<AniListResponse>;
	});
}

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
