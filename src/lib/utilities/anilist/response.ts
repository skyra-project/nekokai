import { BrandingColors } from '#lib/common/constants';
import { LanguageKeys } from '#lib/i18n/LanguageKeys';
import type { MediaTitle } from '#lib/utilities/anilist/types';
import { parseAniListDescription, type AnilistEntryTypeByKind } from '#lib/utilities/anilist/utilities';
import { makeActionButton, makeActionRow, makeLinkButton } from '#lib/utilities/discord-utilities';
import { durationFormatter } from '#lib/utilities/duration-formatter';
import { minutes } from '#lib/utilities/time-utilities';
import { bold, EmbedBuilder, hideLinkEmbed, hyperlink } from '@discordjs/builders';
import { AniListSearchTitleLanguage } from '@prisma/client';
import type { Result } from '@sapphire/result';
import { filterNullish, isNullishOrEmpty } from '@sapphire/utilities';
import { container, type Interactions, type MessageResponseOptions } from '@skyra/http-framework';
import { getSupportedLanguageT, getSupportedUserLanguageT, resolveUserKey, type TFunction } from '@skyra/http-framework-i18n';
import type { FetchError } from '@skyra/safe-fetch';
import { ButtonStyle, MessageFlags, type APIButtonComponent, type APIMessageComponentEmoji, type LocaleString } from 'discord-api-types/v10';

type AniListKind = 'anime' | 'manga';

const Root = LanguageKeys.Commands.AniList;
const EmojiShare: APIMessageComponentEmoji = { id: '1302063661505839154', name: 'share', animated: false };

export function handleAniListResult<Kind extends AniListKind>(options: HandlerOptions<Kind>) {
	const { interaction, kind } = options;
	const hide = options.hide ?? false;
	const hideDescription = options.hideDescription ?? false;

	const t = hide ? getSupportedUserLanguageT(interaction) : getSupportedLanguageT(interaction);
	return options.result.match({
		ok: (value) => (isNullishOrEmpty(value) ? createErrorResponse(interaction, kind) : createResponse(kind, value, t, hideDescription, hide)),
		err: () => createErrorResponse(interaction, kind)
	});
}

function createResponse(
	kind: AniListKind,
	value: AnilistEntryTypeByKind<AniListKind>,
	t: TFunction,
	hideDescription: boolean,
	hide: boolean
): MessageResponseOptions {
	const buttons: APIButtonComponent[] = [];
	if (value.siteUrl) {
		const button = makeLinkButton({
			url: value.siteUrl,
			label: t(Root.ButtonSource)
		});
		buttons.push(button);
	}

	if (hide) {
		const button = makeActionButton({
			style: ButtonStyle.Primary,
			custom_id: `anilist.${kind}.${hideDescription ? '1' : '0'}.${value.id}`,
			label: t(Root.ButtonShare),
			emoji: EmojiShare
		});
		buttons.push(button);
	}

	return {
		embeds: [createEmbed(value, t, hideDescription).toJSON()],
		components: [makeActionRow(buttons)],
		flags: hide ? MessageFlags.Ephemeral : undefined
	};
}

function createErrorResponse(interaction: SupportedInteraction, kind: AniListKind) {
	return {
		content: resolveUserKey(interaction, kind === 'anime' ? Root.Anime.SearchError : Root.Manga.SearchError),
		flags: MessageFlags.Ephemeral
	};
}

function createEmbed(value: AnilistEntryTypeByKind<AniListKind>, t: TFunction, hideDescription: boolean) {
	const locale = t.lng as LocaleString;
	return new EmbedBuilder()
		.setColor(BrandingColors.Primary)
		.setTitle(getAniListTitle(value.title, locale, value.countryOfOrigin, AniListSearchTitleLanguage.English))
		.setURL(value.siteUrl ?? null)
		.setDescription(createEmbedDescription(value, t, hideDescription))
		.setImage(`https://img.anili.st/media/${value.id}`)
		.setFooter({ text: '© anilist.co' });
}

function createEmbedDescription(value: AnilistEntryTypeByKind<AniListKind>, t: TFunction, hideDescription: boolean): string {
	const anilistTitles = t(Root.EmbedTitles);
	const description = [
		createEmbedDescriptionLanguageName(t, anilistTitles.romajiName, value.title.romaji),
		createEmbedDescriptionLanguageName(t, anilistTitles.englishName, value.title.english),
		createEmbedDescriptionLanguageName(t, anilistTitles.nativeName, value.title.native)
	];

	if (value.countryOfOrigin) {
		description.push(`${bold(anilistTitles.countryOfOrigin)}: ${getCountry(t, value.countryOfOrigin)}`);
	}

	if ('episodes' in value && value.episodes) {
		description.push(`${bold(anilistTitles.episodes)}: ${t(LanguageKeys.Common.FormatNumber, { value: value.episodes })}`);
	}

	if ('chapters' in value && value.chapters) {
		description.push(`${bold(anilistTitles.chapters)}: ${t(LanguageKeys.Common.FormatNumber, { value: value.chapters })}`);
	}

	if ('volumes' in value && value.volumes) {
		description.push(`${bold(anilistTitles.volumes)}: ${t(LanguageKeys.Common.FormatNumber, { value: value.volumes })}`);
	}

	if ('duration' in value && value.duration) {
		description.push(`${bold(anilistTitles.episodeLength)}: ${durationFormatter.format(minutes(value.duration), 1)}`);
	}

	const externalLinks = createEmbedDescriptionExternalLinks(t, anilistTitles.externalLinks, value.externalLinks);
	if (!isNullishOrEmpty(externalLinks)) {
		description.push(externalLinks);
	}

	if (!hideDescription && value.description) {
		description.push('', parseAniListDescription(value.description));
	}

	return description.join('\n');
}

function createEmbedDescriptionLanguageName(t: TFunction, title: string, value: string | null | undefined) {
	return `${bold(title)}: ${isNullishOrEmpty(value) ? t(LanguageKeys.Common.None) : value}`;
}

type ExternalLinks = AnilistEntryTypeByKind<AniListKind>['externalLinks'];
function createEmbedDescriptionExternalLinks(t: TFunction, title: string, links: ExternalLinks): string | null {
	if (isNullishOrEmpty(links)) return null;

	const formatted = links //
		.map((link) => (link?.url && link.site ? hyperlink(link.site, hideLinkEmbed(link.url)) : undefined))
		.filter(filterNullish);

	return isNullishOrEmpty(formatted) ? null : `${bold(title)}: ${t(LanguageKeys.Common.FormatList, { value: formatted })}`;
}

function getCountry(t: TFunction, origin: NonNullable<AnilistEntryTypeByKind<AniListKind>['countryOfOrigin']>) {
	switch (origin) {
		case 'CN':
			return `${t(Root.CountryChina)} 🇨🇳`;
		case 'JP':
			return `${t(Root.CountryJapan)} 🇯🇵`;
		case 'KR':
			return `${t(Root.CountryKorea)} 🇰🇷`;
		case 'TW':
			return `${t(Root.CountryTaiwan)} 🇹🇼`;
		default:
			container.logger.warn(`[ANILIST] Received unknown origin: ${origin}`);
			return origin;
	}
}

export function getAniListTitle(
	title: MediaTitle,
	locale: LocaleString,
	origin: string | null | undefined,
	titleLanguage: AniListSearchTitleLanguage
) {
	switch (titleLanguage) {
		case AniListSearchTitleLanguage.English:
			return title.english ?? title.romaji ?? title.native!;
		case AniListSearchTitleLanguage.Romaji:
			return title.romaji ?? title.english ?? title.native!;
		case AniListSearchTitleLanguage.Native:
			return title.native ?? title.romaji ?? title.english!;
		default:
			return shouldUseNative(locale, origin ?? 'JP')
				? (title.native ?? title.english ?? title.romaji!)
				: (title.english ?? title.romaji ?? title.native!);
	}
}

function shouldUseNative(locale: LocaleString, origin: string) {
	if (locale === 'ja') return origin === 'JP';
	if (locale === 'zh-CN') return origin === 'CN';
	if (locale === 'ko') return origin === 'KR';
	return false;
}

type SupportedInteraction = Interactions.ChatInputCommand | Interactions.MessageComponentButton;

export interface HandlerOptions<Kind extends 'anime' | 'manga'> {
	interaction: SupportedInteraction;
	result: Result<AnilistEntryTypeByKind<Kind> | null, FetchError>;
	kind: Kind;
	hideDescription: boolean | null | undefined;
	hide: boolean | null | undefined;
}
