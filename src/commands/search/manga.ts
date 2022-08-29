import { fetchAniListApi, getManga, parseAniListDescription } from '#lib/apis/anilist/anilist-constants';
import type { Media } from '#lib/apis/anilist/anilist-types';
import { fetchKitsuApi } from '#lib/apis/kitsu/kitsu-constants';
import type { KitsuHit } from '#lib/apis/kitsu/kitsu-types';
import { BrandingColors } from '#lib/common/constants';
import { LanguageKeys } from '#lib/i18n/LanguageKeys';
import { RedisKeys } from '#lib/redis-cache/RedisCacheClient';
import { durationFormatter } from '#lib/utilities/duration-formatter';
import { buildMangaSubcommand, checkIsKitsuSubcommand } from '#lib/utilities/search-command-helpers';
import { minutes } from '#lib/utilities/time-utilities';
import { bold, EmbedBuilder, hideLinkEmbed, hyperlink, time, TimestampStyles } from '@discordjs/builders';
import { cutText, filterNullish, isNullish, isNullishOrEmpty } from '@sapphire/utilities';
import { AutocompleteInteractionArguments, Command, InteractionArguments, RegisterCommand, RegisterSubCommand } from '@skyra/http-framework';
import { applyLocalizedBuilder, getSupportedLanguageT, resolveKey } from '@skyra/http-framework-i18n';
import type { APIApplicationCommandOptionChoice } from 'discord-api-types/v10';

@RegisterCommand((builder) => applyLocalizedBuilder(builder, LanguageKeys.Common.MangaName, LanguageKeys.Common.MangaDescription))
export class UserCommand extends Command {
	public override autocompleteRun(interaction: Command.AutocompleteInteraction, options: AutocompleteInteractionArguments<Options>) {
		if (!options.subCommand || options.focused !== 'manga' || isNullishOrEmpty(options.manga)) {
			return interaction.replyEmpty();
		}

		switch (options.subCommand as 'kitsu' | 'anilist') {
			case 'kitsu':
				return this.kitsuAutocompleteRun(interaction, options);
			case 'anilist':
				return this.aniListAutocompleteRun(interaction, options);
		}
	}

	@RegisterSubCommand(buildMangaSubcommand('kitsu'))
	@RegisterSubCommand(buildMangaSubcommand('anilist'))
	public async sharedRun(interaction: Command.ChatInputInteraction, { manga, subCommand }: InteractionArguments<Options>) {
		const isKitsuSubcommand = checkIsKitsuSubcommand(subCommand);

		const [, packageFromAutocomplete, nthResult] = manga.split(':');
		const hitFromRedisCache = await this.container.redisCache.fetch<KitsuHit | Media>(
			isKitsuSubcommand ? RedisKeys.KitsuManga : RedisKeys.AnilistManga,
			interaction.user?.id,
			packageFromAutocomplete,
			nthResult
		);

		if (hitFromRedisCache) {
			return interaction.reply(
				isKitsuSubcommand
					? this.buildKitsuResponse(hitFromRedisCache as KitsuHit, interaction)
					: this.buildAnilistResponse(hitFromRedisCache as Media, interaction)
			);
		}

		const message = await interaction.defer();
		const result = isKitsuSubcommand
			? await fetchKitsuApi('manga', packageFromAutocomplete ?? manga, 1)
			: await fetchAniListApi(getManga, { search: manga });

		const response = result.match({
			ok: (value) => {
				if (checkIsKitsuSubcommand(subCommand, value)) {
					return isNullishOrEmpty(value.hits) //
						? this.handleError(interaction)
						: this.buildKitsuResponse(value.hits[0], interaction);
				}

				return isNullishOrEmpty(value.data.Page.media) //
					? this.handleError(interaction)
					: this.buildAnilistResponse(value.data.Page.media[0]!, interaction);
			},
			err: () => this.handleError(interaction)
		});

		return message.update(response);
	}

	private buildKitsuResponse(kitsuManga: KitsuHit, interaction: Command.ChatInputInteraction) {
		const t = getSupportedLanguageT(interaction);

		const description =
			// Prefer the synopsis
			kitsuManga.synopsis ||
			// Then prefer the English description
			kitsuManga.description?.en ||
			// Then prefer the English-us description
			kitsuManga.description?.en_us ||
			// Then prefer the latinized Japanese description
			kitsuManga.description?.en_jp ||
			// Then the description in kanji / hiragana / katakana
			kitsuManga.description?.ja_jp ||
			// If all fails just get the first key of the description
			kitsuManga.description?.[Object.keys(kitsuManga.description!)[0]];
		const synopsis = description ? cutText(description.replace(/(.+)[\r\n\t](.+)/gim, '$1 $2').split('\r\n')[0], 750) : null;
		const score = `${kitsuManga.averageRating}%`;
		const mangaURL = `https://kitsu.io/manga/${kitsuManga.id}`;
		const type = kitsuManga.subtype;
		const title = kitsuManga.titles.en || kitsuManga.titles.en_jp || kitsuManga.canonicalTitle || '--';

		const englishTitle = kitsuManga.titles.en || kitsuManga.titles.en_us || t(LanguageKeys.Common.None);
		const japaneseTitle = kitsuManga.titles.ja_jp || t(LanguageKeys.Common.None);
		const canonicalTitle = kitsuManga.canonicalTitle || t(LanguageKeys.Common.None);

		const embedData = t(LanguageKeys.Commands.Kitsu.Manga.EmbedData);

		const embed = new EmbedBuilder()
			.setTitle(title)
			.setURL(mangaURL)
			.setColor(BrandingColors.Primary)
			.setDescription(
				t(LanguageKeys.Commands.Kitsu.Manga.OutputDescription, {
					englishTitle,
					japaneseTitle,
					canonicalTitle,
					synopsis: synopsis ?? t(LanguageKeys.Common.NoSynopsis)
				})
			)
			.setThumbnail(kitsuManga.posterImage?.original || '')
			.addFields(
				{
					name: embedData.type,
					value: t(LanguageKeys.Commands.Kitsu.Manga.Types)[type.toLowerCase()] || type,
					inline: true
				},
				{
					name: embedData.score,
					value: score,
					inline: true
				},
				{
					name: embedData.ageRating,
					value: kitsuManga.ageRating ? kitsuManga.ageRating : t(LanguageKeys.Common.None),
					inline: true
				},
				{
					name: embedData.firstPublishDate,
					value: time(kitsuManga.startDate, TimestampStyles.ShortDate),
					inline: true
				},
				{
					name: embedData.readIt,
					value: bold(hyperlink(title, hideLinkEmbed(mangaURL))),
					inline: true
				}
			)
			.setFooter({ text: '© kitsu.io' })
			.toJSON();

		return { embeds: [embed] };
	}

	private buildAnilistResponse(anilistManga: Media, interaction: Command.ChatInputInteraction) {
		const embed = new EmbedBuilder();

		const t = getSupportedLanguageT(interaction);

		const anilistTitles = t(LanguageKeys.Commands.AniList.EmbedTitles);

		const englishTitle = anilistManga.title?.english || t(LanguageKeys.Common.None);
		const nativeTitle = anilistManga.title?.native || t(LanguageKeys.Common.None);
		const romajiTitle = anilistManga.title?.romaji || t(LanguageKeys.Common.None);

		const description = [
			`**${anilistTitles.romajiName}**: ${romajiTitle}`,
			`**${anilistTitles.englishName}**: ${englishTitle}`,
			`**${anilistTitles.nativeName}**: ${nativeTitle}`
		];

		if (anilistManga.countryOfOrigin) {
			description.push(`${bold(anilistTitles.countryOfOrigin)}: ${anilistManga.countryOfOrigin}`);
		}

		if (anilistManga.chapters) {
			description.push(`${bold(anilistTitles.chapters)}: ${t(LanguageKeys.Common.FormatNumber, { value: anilistManga.chapters })}`);
		}

		if (anilistManga.volumes) {
			description.push(`${bold(anilistTitles.volumes)}: ${t(LanguageKeys.Common.FormatNumber, { value: anilistManga.volumes })}`);
		}

		if (anilistManga.duration) {
			description.push(`${bold(anilistTitles.episodeLength)}: ${durationFormatter.format(minutes(anilistManga.duration), 1)}`);
		}

		if (anilistManga.externalLinks?.length) {
			const externalLinks = anilistManga.externalLinks
				.map((link) => {
					if (link?.url && link.site) {
						return hyperlink(link.site, hideLinkEmbed(link.url));
					}

					return undefined;
				})
				.filter(filterNullish);

			description.push(`${bold(anilistTitles.externalLinks)}: ${t(LanguageKeys.Common.FormatList, { value: externalLinks })}`);
		}

		if (anilistManga.description) {
			description.push('', parseAniListDescription(anilistManga.description));
		}

		if (anilistManga.siteUrl) {
			embed.setURL(anilistManga.siteUrl);
		}

		return {
			embeds: [
				embed
					.setColor(BrandingColors.Primary)
					.setTitle(anilistManga.title?.english ?? anilistManga.title?.romaji ?? anilistManga.title?.native ?? '') //
					.setDescription(description.join('\n'))
					.setImage(`https://img.anili.st/media/${anilistManga.id}`)
					.toJSON()
			]
		};
	}

	private async kitsuAutocompleteRun(interaction: Command.AutocompleteInteraction, options: AutocompleteInteractionArguments<Options>) {
		const result = await fetchKitsuApi('manga', options.manga);
		return result.match({
			ok: async (value) => {
				const redisInsertPromises: Promise<'OK'>[] = [];
				const results: APIApplicationCommandOptionChoice[] = [];

				for (const [index, hit] of value.hits?.entries() ?? []) {
					redisInsertPromises.push(
						this.container.redisCache.insertFor60Seconds<KitsuHit>(
							RedisKeys.KitsuManga,
							interaction.user?.id,
							options.manga,
							index.toString(),
							hit
						)
					);

					results.push({
						name: cutText(hit.titles.en || hit.titles.en_jp || hit.canonicalTitle || hit.slug, 100),
						value: `${RedisKeys.KitsuManga}:${options.manga}:${index}`
					});
				}

				if (redisInsertPromises.length) {
					await Promise.all(redisInsertPromises);
				}

				return interaction.reply({
					choices: results.slice(0, 24)
				});
			},
			err: () => interaction.replyEmpty()
		});
	}

	private async aniListAutocompleteRun(interaction: Command.AutocompleteInteraction, options: AutocompleteInteractionArguments<Options>) {
		const result = await fetchAniListApi(getManga, { search: options.manga });

		return result.match({
			ok: async (value) => {
				const redisInsertPromises: Promise<'OK'>[] = [];
				const results: APIApplicationCommandOptionChoice[] = [];

				for (const [index, hit] of value.data.Page.media?.entries() ?? []) {
					if (isNullish(hit)) continue;

					redisInsertPromises.push(
						this.container.redisCache.insertFor60Seconds<Media>(
							RedisKeys.AnilistManga,
							interaction.user.id,
							options.manga,
							index.toString(),
							hit
						)
					);

					results.push({
						name: cutText(hit.title?.english || hit.title?.romaji || hit.title?.native || hit.id.toString(), 100),
						value: `${RedisKeys.AnilistManga}:${options.manga}:${index}`
					});
				}

				if (redisInsertPromises.length) {
					await Promise.all(redisInsertPromises);
				}

				return interaction.reply({
					choices: results.slice(0, 24)
				});
			},
			err: () => interaction.replyEmpty()
		});
	}

	private handleError(interaction: Command.ChatInputInteraction) {
		return { content: resolveKey(interaction, LanguageKeys.Common.MangaError) };
	}
}

interface Options {
	manga: string;
}
