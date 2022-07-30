import type { Page } from '#lib/apis/anilist/Anlist';
import { Result } from '@sapphire/result';
import { cutText } from '@sapphire/utilities';
import he from 'he';

const MediaFragment = gql`
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
const htmlEntityRegex = /<\/?(i|b|br)>/g;

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

export const getAnime = gql`
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

export const getManga = gql`
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
			.decode(description.replace(htmlEntityRegex, (_, type: keyof typeof htmlEntityReplacements) => htmlEntityReplacements[type]))
			.replace(excessiveNewLinesRegex, '\n\n'),
		500
	);
}

/**
 * Fake GraphQL tag that just returns everything passed in as a single combined string
 * @remark used to trick the GraphQL parser into treating some code as GraphQL parsable data for syntax checking
 * @param gqlData data to pass off as GraphQL code
 */
function gql(...args: any[]): string {
	return args[0].reduce((acc: string, str: string, idx: number) => {
		acc += str;
		if (Reflect.has(args, idx + 1)) acc += args[idx + 1];
		return acc;
	}, '');
}

export interface AniListResponse {
	data: {
		Page: Page;
	};
}
