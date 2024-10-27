import type { AniListSearchTitleLanguage } from '@prisma/client';
import { FT, T } from '@skyra/http-framework-i18n';

export const RootName = T('commands/preferences:name');
export const RootDescription = T('commands/preferences:description');

export const View = 'commands/preferences:view';
export const Edit = 'commands/preferences:edit';
export const Reset = 'commands/preferences:reset';

export const OptionsTitleLanguage = 'commands/preferences:optionsTitleLanguage';
export const OptionsTitleLanguageName = T('commands/preferences:optionsTitleLanguageName');
export const OptionsTitleLanguageChoiceRomaji = T('commands/preferences:optionsTitleLanguageChoiceRomaji');
export const OptionsTitleLanguageChoiceEnglish = T('commands/preferences:optionsTitleLanguageChoiceEnglish');
export const OptionsTitleLanguageChoiceNative = T('commands/preferences:optionsTitleLanguageChoiceNative');
export const OptionsTitleLanguageChoiceUnset = T('commands/preferences:optionsTitleLanguageChoiceUnset');

export const OptionsResetKey = 'commands/preferences:optionsResetKey';
export const OptionsResetKeyAll = T('commands/preferences:optionsResetKeyAll');
export const OptionsResetKeyTitleLanguage = OptionsTitleLanguageName;

export const ResponseView = FT<{ titleLanguage: string }>('commands/preferences:responseView');
export const ResponseViewTitleLanguage = (titleLanguage: AniListSearchTitleLanguage) =>
	T(`commands/preferences:optionsTitleLanguageChoice${titleLanguage}`);

export const ResponseSuccess = T('commands/preferences:responseSuccess');
