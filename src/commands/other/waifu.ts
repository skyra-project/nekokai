import { BrandingColors } from '#lib/common/constants';
import { LanguageKeys } from '#lib/i18n/LanguageKeys';
import { EmbedBuilder } from '@discordjs/builders';
import { parseURL } from '@sapphire/utilities';
import { Command, InteractionArguments, RegisterCommand } from '@skyra/http-framework';
import { applyLocalizedBuilder, createSelectMenuChoiceName, resolveKey } from '@skyra/http-framework-i18n';

@RegisterCommand(
	(
		builder //
	) =>
		applyLocalizedBuilder(builder, LanguageKeys.Commands.Waifu.RootName, LanguageKeys.Commands.Waifu.RootDescription).addStringOption((builder) =>
			applyLocalizedBuilder(builder, LanguageKeys.Commands.Waifu.OptionRange) //
				.addChoices(
					createSelectMenuChoiceName(LanguageKeys.Commands.Waifu.KeyMediumQuality, { value: 'medium' }),
					createSelectMenuChoiceName(LanguageKeys.Commands.Waifu.KeyHighQuality, { value: 'high' }),
					createSelectMenuChoiceName(LanguageKeys.Commands.Waifu.KeyLowQuality, { value: 'low' })
				)
		)
)
export class UserCommand extends Command {
	private readonly SIZES = {
		medium: { min: 0, max: 50_000 },
		high: { min: 50_000, max: 75_000 },
		low: { min: 75_000, max: 100_000 },
		all: { min: 0, max: 100_000 }
	} as const;
	private readonly IMAGE_EXTENSION = /\.(bmp|jpe?g|png|gif|webp)$/i;

	/**
	 * Faces were generated with
	 * - `𝜓 = 0.8` for images `#0 – 50_000` (medium quality/medium diversity).
	 * - `𝜓 = 0.6` for images `#50_001 – 75_000` (high quality, low diversity).
	 * - `𝜓 = 1.1` for images `#75_001 – 100_000` (low quality, high diversity) for a mix of good & interesting faces.
	 */
	private readonly maximum = '100_000';

	public override chatInputRun(interaction: Command.Interaction, options: InteractionArguments<Options>) {
		const range = this.SIZES[options.range ?? 'all'];
		const id = (Math.random() * (range.max - range.min)) + range.min;
		const url = `https://thiswaifudoesnotexist.net/example-${id}.jpg`;

		const embed = new EmbedBuilder()
			.setTitle('→')
			.setURL(url)
			.setColor(BrandingColors.Primary)
			.setImage(this.getImageUrl(url))
			.setFooter({ text: resolveKey(interaction, LanguageKeys.Commands.Waifu.Footer) })
			.setTimestamp()
			.toJSON();

		return this.message({ embeds: [embed] });
	}

	/**
	 * Parses an URL and checks if the extension is valid.
	 * @param url The url to check
	 */
	private getImageUrl(url: string): string | undefined {
		const parsed = parseURL(url);
		return parsed && this.IMAGE_EXTENSION.test(parsed.pathname) ? parsed.href : 'https://i.imgur.com/vKUeMoH.png';
	}
}

interface Options {
	range?: 'low' | 'medium' | 'high';
}
