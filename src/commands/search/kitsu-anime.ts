import type { Kitsu } from '#lib/apis/kitsu/Kitsu';
import { fetchKitsuApi } from '#lib/apis/kitsu/kitsu-constants';
import { LanguageKeys } from '#lib/i18n/LanguageKeys';
import { RedisKeys } from '#lib/redis-cache/RedisCacheClient';
import { apply } from '#lib/utilities/add-builder-localizations';
import { durationFormatter } from '#lib/utilities/duration-formatter';
import { bold, EmbedBuilder, hideLinkEmbed, hyperlink, time, TimestampStyles } from '@discordjs/builders';
import { cutText, isNullishOrEmpty } from '@sapphire/utilities';
import { AutocompleteInteractionArguments, Command, RegisterCommand } from '@skyra/http-framework';
import { getSupportedUserLanguageT, resolveUserKey } from '@skyra/http-framework-i18n';
import { APIApplicationCommandOptionChoice, MessageFlags } from 'discord-api-types/v10';

@RegisterCommand((builder) =>
	apply(builder, LanguageKeys.Commands.Kitsu.Anime.RootName, LanguageKeys.Commands.Kitsu.Anime.RootDescription) //
		.addStringOption((option) =>
			apply(option, LanguageKeys.Common.OptionsAnime) //
				.setRequired(true)
				.setAutocomplete(true)
		)
)
export class UserCommand extends Command {
	public override async autocompleteRun(_: Command.AutocompleteInteraction, options: AutocompleteInteractionArguments<Options>) {
		if (options.focused !== 'anime' || isNullishOrEmpty(options.anime)) {
			return this.autocompleteNoResults();
		}

		const result = await fetchKitsuApi('anime', options.anime);

		return result.match({
			err: () => this.autocompleteNoResults(),
			ok: async (value) => {
				const redisInsertPromises: Promise<'OK'>[] = [];
				const results: APIApplicationCommandOptionChoice[] = [];

				for (const [index, hit] of value.hits?.entries() ?? []) {
					redisInsertPromises.push(
						this.container.redisCache.insertFor60Seconds<Kitsu.KitsuHit>(RedisKeys.KitsuAnime, options.anime, index.toString(), hit)
					);

					results.push({
						name: cutText(hit.titles.en || hit.titles.en_jp || hit.canonicalTitle || hit.slug, 100),
						value: `${RedisKeys.KitsuAnime}:${options.anime}:${index}`
					});
				}

				if (redisInsertPromises.length) {
					await Promise.all(redisInsertPromises);
				}

				return this.autocomplete({
					choices: results.slice(0, 19)
				});
			}
		});
	}

	public override async chatInputRun(interaction: Command.Interaction, { anime }: Options) {
		const [, packageFromAutocomplete, nthResult] = anime.split(':');
		const hitFromRedisCache = await this.container.redisCache.fetch<Kitsu.KitsuHit>(RedisKeys.KitsuAnime, packageFromAutocomplete, nthResult);

		if (hitFromRedisCache) {
			return this.buildResponse(hitFromRedisCache, interaction);
		}

		const result = await fetchKitsuApi('anime', packageFromAutocomplete ?? anime, 1);

		return result.match({
			err: () => this.handleError(interaction),
			ok: (value) => {
				if (!value.hits?.[0]) {
					return this.handleError(interaction);
				}

				return this.buildResponse(value.hits[0], interaction);
			}
		});
	}

	private buildResponse(entry: Kitsu.KitsuHit, interaction: Command.Interaction): Command.Response {
		const t = getSupportedUserLanguageT(interaction);

		const description =
			// Prefer the synopsis
			entry.synopsis ||
			// Then prefer the English description
			entry.description?.en ||
			// Then prefer the English-us description
			entry.description?.en_us ||
			// Then prefer the latinized Japanese description
			entry.description?.en_jp ||
			// Then the description in kanji / hiragana / katakana
			entry.description?.ja_jp ||
			// If all fails just get the first key of the description
			entry.description?.[Object.keys(entry.description!)[0]];
		const synopsis = description ? cutText(description.replace(/(.+)[\r\n\t](.+)/gim, '$1 $2').split('\r\n')[0], 750) : null;
		const score = `${entry.averageRating}%`;
		const animeURL = `https://kitsu.io/anime/${entry.id}`;
		const type = entry.subtype;
		const title = entry.titles.en || entry.titles.en_jp || entry.canonicalTitle || '--';

		const [englishTitle, japaneseTitle, canonicalTitle] = [entry.titles.en || entry.titles.en_us, entry.titles.ja_jp, entry.canonicalTitle].map(
			(title) => title || t(LanguageKeys.Common.None)
		);

		const embedData = t(LanguageKeys.Commands.Kitsu.Anime.EmbedData);

		const embed = new EmbedBuilder()
			.setTitle(title)
			.setURL(animeURL)
			.setDescription(
				t(LanguageKeys.Commands.Kitsu.Anime.OutputDescription, {
					englishTitle,
					japaneseTitle,
					canonicalTitle,
					synopsis: synopsis ?? t(LanguageKeys.Common.NoSynopsis)
				})
			)
			.setThumbnail(entry.posterImage?.original || '')
			.addFields(
				{
					name: embedData.type,
					value: t(LanguageKeys.Commands.Kitsu.Anime.Types)[type.toLowerCase()] || type,
					inline: true
				},
				{
					name: embedData.score,
					value: score,
					inline: true
				},
				{
					name: embedData.episodes,
					value: entry.episodeCount
						? t(LanguageKeys.Commands.Kitsu.Anime.EpisodeCount, { episodeCount: entry.episodeCount })
						: embedData.stillAiring,
					inline: true
				},
				{
					name: embedData.episodeLength,
					value: durationFormatter.format(entry.episodeLength * 60 * 1000),
					inline: true
				},
				{
					name: embedData.ageRating,
					value: entry.ageRating ? entry.ageRating : t(LanguageKeys.Common.None),
					inline: true
				},
				{
					name: embedData.firstAirDate,
					value: time(entry.startDate, TimestampStyles.ShortDate),
					inline: true
				},
				{
					name: embedData.watchIt,
					value: bold(hyperlink(title, hideLinkEmbed(animeURL))),
					inline: true
				}
			)
			.setFooter({ text: '© kitsu.io' })
			.toJSON();

		return this.message({
			embeds: [embed]
		});
	}

	private handleError(interaction: Command.Interaction) {
		return this.message({
			content: resolveUserKey(interaction, LanguageKeys.Common.AnimeError),
			flags: MessageFlags.Ephemeral
		});
	}
}

interface Options {
	anime: string;
}
