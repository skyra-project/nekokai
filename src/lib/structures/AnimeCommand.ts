import type { AnilistEntry } from '#lib/apis/anilist/anilist-types';
import { parseAniListDescription } from '#lib/apis/anilist/anilist-utilities';
import type { KitsuAnime, KitsuManga } from '#lib/apis/kitsu/kitsu-utilities';
import { BrandingColors } from '#lib/common/constants';
import { LanguageKeys } from '#lib/i18n/LanguageKeys';
import { durationFormatter } from '#lib/utilities/duration-formatter';
import { minutes } from '#lib/utilities/time-utilities';
import { EmbedBuilder, TimestampStyles, bold, hideLinkEmbed, hyperlink, time } from '@discordjs/builders';
import type { Result } from '@sapphire/result';
import { Time } from '@sapphire/time-utilities';
import { cutText, filterNullish } from '@sapphire/utilities';
import { Command, type AutocompleteInteractionArguments, type InteractionArguments } from '@skyra/http-framework';
import { resolveUserKey, type TFunction } from '@skyra/http-framework-i18n';
import type { FetchError } from '@skyra/safe-fetch';
import { MessageFlags, type LocaleString } from 'discord-api-types/v10';

const { AniList, Kitsu } = LanguageKeys.Commands;

export abstract class AnimeCommand<Kind extends 'anime' | 'manga'> extends Command {
	public override autocompleteRun(interaction: Command.AutocompleteInteraction, options: AnimeCommand.AutocompleteArguments<Kind>) {
		switch (options.subCommand as 'kitsu' | 'anilist') {
			case 'kitsu':
				return this.kitsuAutocompleteRun(interaction, options);
			case 'anilist':
				return this.anilistAutocompleteRun(interaction, options);
		}
	}

	protected createAnilistResponse(value: AnilistEntry, t: TFunction) {
		return { embeds: [this.createAnilistEmbed(value, t).toJSON()] };
	}

	protected createKitsuResponse(value: KitsuAnime | KitsuManga, kind: Kind, t: TFunction) {
		return { embeds: [this.createKitsuEmbed(value, kind, t).toJSON()] };
	}

	protected createErrorResponse(interaction: Command.ChatInputInteraction) {
		return { content: resolveUserKey(interaction, LanguageKeys.Common.AnimeError), flags: MessageFlags.Ephemeral };
	}

	protected abstract anilistAutocompleteFetch(
		options: AnimeCommand.AutocompleteArguments<Kind>
	): Promise<Result<readonly AnilistEntry[], FetchError>>;

	protected async anilistAutocompleteRun(interaction: Command.AutocompleteInteraction, options: AnimeCommand.AutocompleteArguments<Kind>) {
		const result = await this.anilistAutocompleteFetch(options);
		const entries = result.match({
			ok: (values) => {
				return values.map((value) => {
					const name = cutText(value.title.english || value.title.romaji || value.title.native || value.id.toString(), 100);
					return { name, value: name };
				});
			},
			err: () => []
		});

		return interaction.reply({ choices: entries });
	}

	protected abstract kitsuAutocompleteFetch(
		options: AnimeCommand.AutocompleteArguments<Kind>
	): Promise<Result<readonly (KitsuAnime | KitsuManga)[], FetchError>>;

	protected async kitsuAutocompleteRun(interaction: Command.AutocompleteInteraction, options: AnimeCommand.AutocompleteArguments<Kind>) {
		const result = await this.kitsuAutocompleteFetch(options);
		const entries = result.match({
			ok: (values) => {
				return values.map((value) => {
					const name = cutText(value.titles.en || value.titles.en_us || value.titles.en_jp || value.titles.canonical, 100);
					return { name, value: name };
				});
			},
			err: () => []
		});

		return interaction.reply({ choices: entries });
	}

	private createAnilistEmbed(value: AnilistEntry, t: TFunction) {
		const anilistTitles = t(AniList.EmbedTitles);
		const description = [
			`**${anilistTitles.romajiName}**: ${value.title.romaji || t(LanguageKeys.Common.None)}`,
			`**${anilistTitles.englishName}**: ${value.title.english || t(LanguageKeys.Common.None)}`,
			`**${anilistTitles.nativeName}**: ${value.title.native || t(LanguageKeys.Common.None)}`
		];

		if (value.countryOfOrigin) {
			description.push(`${bold(anilistTitles.countryOfOrigin)}: ${value.countryOfOrigin}`);
		}

		if (value.episodes) {
			description.push(`${bold(anilistTitles.episodes)}: ${t(LanguageKeys.Common.FormatNumber, { value: value.episodes })}`);
		}

		if (value.chapters) {
			description.push(`${bold(anilistTitles.chapters)}: ${t(LanguageKeys.Common.FormatNumber, { value: value.chapters })}`);
		}

		if (value.volumes) {
			description.push(`${bold(anilistTitles.volumes)}: ${t(LanguageKeys.Common.FormatNumber, { value: value.volumes })}`);
		}

		if (value.duration) {
			description.push(`${bold(anilistTitles.episodeLength)}: ${durationFormatter.format(minutes(value.duration), 1)}`);
		}

		if (value.externalLinks?.length) {
			const externalLinks = value.externalLinks
				.map((link) => (link?.url && link.site ? hyperlink(link.site, hideLinkEmbed(link.url)) : undefined))
				.filter(filterNullish);

			if (externalLinks.length) {
				description.push(`${bold(anilistTitles.externalLinks)}: ${t(LanguageKeys.Common.FormatList, { value: externalLinks })}`);
			}
		}

		if (value.description) {
			description.push('', parseAniListDescription(value.description));
		}

		return new EmbedBuilder()
			.setColor(BrandingColors.Primary)
			.setTitle(value.title.english ?? value.title.romaji ?? value.title.native!)
			.setURL(value.siteUrl ?? null)
			.setDescription(description.join('\n'))
			.setImage(`https://img.anili.st/media/${value.id}`)
			.setFooter({ text: '© anilist.co' });
	}

	private createKitsuEmbed(value: KitsuAnime | KitsuManga, kind: Kind, t: TFunction) {
		const titles = t(Kitsu.EmbedTitles);
		const description = [
			`${bold(titles.romajiName)}: ${value.titles.en_jp || t(LanguageKeys.Common.None)}`,
			`${bold(titles.englishName)}: ${value.titles.en || value.titles.en_us || t(LanguageKeys.Common.None)}`,
			`${bold(titles.nativeName)}: ${value.titles.ja_jp || t(LanguageKeys.Common.None)}`,
			`${bold(titles.type)}: ${t(Kitsu.Types)[value.subtype.toLowerCase()] || value.subtype}`,
			`${bold(titles.score)}: ${value.averageRating}%`
		];

		if (isKitsuAnime(kind, value)) {
			const episodes = value.episodeCount ? t(LanguageKeys.Common.FormatNumber, { value: value.episodeCount }) : titles.stillAiring;
			description.push(`${bold(titles.episodes)}: ${episodes}`);

			const episodeLength = value.episodeLength ? durationFormatter.format(value.episodeLength * Time.Minute) : t(LanguageKeys.Common.None);
			description.push(`${bold(titles.episodeLength)}: ${episodeLength}`);
		} else {
			const chapters = value.chapterCount ? t(LanguageKeys.Common.FormatNumber, { value: value.chapterCount }) : t(LanguageKeys.Common.None);
			description.push(`${bold(titles.chapters)}: ${chapters}`);

			const volumes = value.volumeCount ? t(LanguageKeys.Common.FormatNumber, { value: value.volumeCount }) : t(LanguageKeys.Common.None);
			description.push(`${bold(titles.volumes)}: ${volumes}`);
		}

		description.push(`${bold(titles.ageRating)}: ${value.ageRating ?? t(LanguageKeys.Common.None)}`);

		const locale = t.lng as LocaleString;
		const url = `https://kitsu.io/${kind}/${value.id}`;
		const title = this.getTitle(locale, value.titles) ?? value.titles.canonical;
		const releaseDate = time(value.startDate, TimestampStyles.ShortDate);
		const maskedLink = bold(hyperlink(title, hideLinkEmbed(url)));
		if (isKitsuAnime(kind, value)) {
			description.push(`${bold(titles.firstAirDate)}: ${releaseDate}`);
			description.push(`${bold(titles.watchIt)}: ${maskedLink}`);
		} else {
			description.push(`${bold(titles.firstPublishDate)}: ${releaseDate}`);
			description.push(`${bold(titles.readIt)}: ${maskedLink}`);
		}

		if (value.synopsis) {
			description.push('', cutText(value.synopsis.replace(/(.+)[\r\n\t](.+)/gim, '$1 $2').split('\r\n')[0], 750));
		}

		return new EmbedBuilder()
			.setColor(BrandingColors.Primary)
			.setTitle(title)
			.setURL(url)
			.setDescription(description.join('\n'))
			.setThumbnail(value.poster || '')
			.setFooter({ text: '© kitsu.io' });
	}

	private getTitle(locale: LocaleString, entries: Record<string, string>): string | null {
		const keys = AnimeCommand.KitsuDescriptionMappings[locale] ?? [];

		for (const key of keys) {
			if (entries[key]) return entries[key]!;
		}

		return null;
	}

	private static readonly KitsuDescriptionMappings = {
		bg: ['bg_bg', 'bg'],
		cs: ['cs_cz', 'cs'],
		da: ['da_dk', 'da'],
		de: ['de_de', 'de'],
		el: ['el_gr', 'el'],
		'en-GB': ['en_gb', 'en'],
		'en-US': ['en_us', 'en'],
		'es-ES': ['es_es', 'es'],
		fi: ['fi_fi', 'fi'],
		fr: ['fr_fr', 'fr'],
		hi: ['hi_in', 'hi'],
		hr: ['hr_hr', 'hr', 'hr_ba'],
		hu: ['hu_hu', 'hu'],
		id: ['id_id', 'id'],
		it: ['it_it', 'it', 'it_ch'],
		ja: ['ja_jp', 'ja', 'en_jp'],
		ko: ['ko_kr', 'ko', 'en_kr'],
		lt: ['lt_lt', 'lt'],
		nl: ['nl_nl', 'nl', 'nl_be'],
		no: [],
		pl: ['pl_pl', 'pl'],
		'pt-BR': ['pt_br', 'pt', 'pt_pt'],
		ro: ['ro_ro', 'ro'],
		ru: ['ru_ru', 'ru'],
		'sv-SE': ['sv_se', 'sv'],
		th: ['th_th', 'th'],
		tr: ['tr_tr', 'tr'],
		uk: ['uk_ua', 'uk'],
		vi: ['vi_vn', 'vi'],
		'zh-CN': ['zh_cn', 'en_cn'],
		'zh-TW': ['zh_tw']
	} satisfies Record<LocaleString, readonly string[]>;
}

export namespace AnimeCommand {
	export type Context = Command.Context;
	export type Options = Command.Options;
	export type Arguments<Kind extends 'anime' | 'manga'> = InteractionArguments<Kind extends 'anime' ? { anime: string } : { manga: string }>;
	export type AutocompleteArguments<Kind extends 'anime' | 'manga'> = AutocompleteInteractionArguments<Arguments<Kind>>;
}

function isKitsuAnime(kind: 'anime' | 'manga', value: KitsuAnime | KitsuManga): value is KitsuAnime;
function isKitsuAnime(kind: 'anime' | 'manga') {
	return kind === 'anime';
}
