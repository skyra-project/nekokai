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
					createSelectMenuChoiceName(LanguageKeys.Commands.Waifu.KeyMediumQuality, { value: '50_000' }),
					createSelectMenuChoiceName(LanguageKeys.Commands.Waifu.KeyHighQuality, { value: '75_000' }),
					createSelectMenuChoiceName(LanguageKeys.Commands.Waifu.KeyLowQuality, { value: '100_000' })
				)
		)
)
export class UserCommand extends Command {
	private readonly IMAGE_EXTENSION = /\.(bmp|jpe?g|png|gif|webp)$/i;

	/**
	 * Faces were generated with
	 * - `𝜓 = 0.8` for images `#0 – 50_000` (medium quality/medium diversity).
	 * - `𝜓 = 0.6` for images `#50_001 – 75_000` (high quality, low diversity).
	 * - `𝜓 = 1.1` for images `#75_001 – 100_000` (low quality, high diversity) for a mix of good & interesting faces.
	 */
	private readonly maximum = '100_000';

	public override chatInputRun(interaction: Command.Interaction, { range }: InteractionArguments<Options>) {
		const url = `https://thiswaifudoesnotexist.net/example-${Math.floor(Math.random() * parseInt(range ?? this.maximum, 10))}.jpg`;

		const embed = new EmbedBuilder()
			.setTitle('→')
			.setURL(url)
			.setColor(BrandingColors.Primary)
			.setImage(this.getImageUrl(url) ?? 'https://i.imgur.com/vKUeMoH.png')
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
		return parsed && this.IMAGE_EXTENSION.test(parsed.pathname) ? parsed.href : undefined;
	}
}

interface Options {
	range?: string;
}
