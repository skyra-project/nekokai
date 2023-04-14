import { cutText } from '@sapphire/utilities';
import he from 'he';

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
