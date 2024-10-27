import { LanguageKeys } from '#lib/i18n/LanguageKeys';
import { AniListSearchTitleLanguage } from '@prisma/client';
import { Command, RegisterCommand, RegisterSubcommand, type InteractionArguments } from '@skyra/http-framework';
import { applyLocalizedBuilder, createSelectMenuChoiceName, getSupportedUserLanguageT } from '@skyra/http-framework-i18n';
import { ApplicationIntegrationType, InteractionContextType, MessageFlags } from 'discord-api-types/v10';

const Root = LanguageKeys.Commands.Preferences;

@RegisterCommand((builder) =>
	applyLocalizedBuilder(builder, Root.RootName, Root.RootDescription)
		.setIntegrationTypes(ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall)
		.setContexts(InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel)
)
export class UserCommand extends Command {
	@RegisterSubcommand((builder) => applyLocalizedBuilder(builder, Root.View))
	public async view(interaction: Command.ChatInputInteraction) {
		const settings = await this.container.prisma.user.findUnique({ where: { id: BigInt(interaction.user.id) } });

		const t = getSupportedUserLanguageT(interaction);
		const titleLanguage = t(Root.ResponseViewTitleLanguage(settings?.preferredAniListSearchTitleLanguage ?? AniListSearchTitleLanguage.Unset));

		const content = t(Root.ResponseView, { titleLanguage });
		return interaction.reply({ content, flags: MessageFlags.Ephemeral });
	}

	@RegisterSubcommand((builder) =>
		applyLocalizedBuilder(builder, Root.Edit).addStringOption((builder) =>
			applyLocalizedBuilder(builder, Root.OptionsTitleLanguage)
				.addChoices(
					createSelectMenuChoiceName(Root.OptionsTitleLanguageChoiceEnglish, { value: AniListSearchTitleLanguage.English }),
					createSelectMenuChoiceName(Root.OptionsTitleLanguageChoiceRomaji, { value: AniListSearchTitleLanguage.Romaji }),
					createSelectMenuChoiceName(Root.OptionsTitleLanguageChoiceNative, { value: AniListSearchTitleLanguage.Native }),
					createSelectMenuChoiceName(Root.OptionsTitleLanguageChoiceUnset, { value: AniListSearchTitleLanguage.Unset })
				)
				// NOTE: This would not be required, but since it's currently the only option, then it's fine.
				.setRequired(true)
		)
	)
	public async edit(interaction: Command.ChatInputInteraction, options: InteractionArguments<EditOptions>) {
		const id = BigInt(interaction.user.id);
		const preferredAniListSearchTitleLanguage = options['title-language'];

		await this.container.prisma.user.upsert({
			create: { id, preferredAniListSearchTitleLanguage },
			update: { preferredAniListSearchTitleLanguage },
			where: { id }
		});

		const t = getSupportedUserLanguageT(interaction);
		const content = t(Root.ResponseSuccess);
		return interaction.reply({ content, flags: MessageFlags.Ephemeral });
	}

	@RegisterSubcommand((builder) =>
		applyLocalizedBuilder(builder, Root.Reset).addStringOption((builder) =>
			applyLocalizedBuilder(builder, Root.OptionsResetKey)
				.addChoices(
					createSelectMenuChoiceName(Root.OptionsResetKeyAll, { value: 'all' }),
					createSelectMenuChoiceName(Root.OptionsResetKeyTitleLanguage, { value: 'title-language' })
				)
				.setRequired(true)
		)
	)
	public async reset(interaction: Command.ChatInputInteraction, options: InteractionArguments<ResetOptions>) {
		const id = BigInt(interaction.user.id);
		if (options.key === 'all') {
			await this.container.prisma.user.delete({ where: { id } });
		} else {
			await this.container.prisma.user.update({
				where: { id },
				data: {
					preferredAniListSearchTitleLanguage: options.key === 'title-language' ? AniListSearchTitleLanguage.Unset : undefined
				}
			});
		}

		const t = getSupportedUserLanguageT(interaction);
		const content = t(Root.ResponseSuccess);
		return interaction.reply({ content, flags: MessageFlags.Ephemeral });
	}
}

interface EditOptions {
	'title-language'?: AniListSearchTitleLanguage;
}

interface ResetOptions {
	key: 'all' | 'title-language';
}
