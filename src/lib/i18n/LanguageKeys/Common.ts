import { FT, T, type LocalePrefixKey } from '@skyra/http-framework-i18n';

export const AnimeDescription = T('commands/common:animeDescription');
export const AnimeError = T('commands/common:animeError');
export const AnimeName = T('commands/common:animeName');
export const FormatList = FT<{ value: unknown[] }>('commands/common:formatList');
export const FormatNumber = FT<{ value: number }>('commands/common:formatNumber');
export const MangaDescription = T('commands/common:mangaDescription');
export const MangaError = T('commands/common:mangaError');
export const MangaName = T('commands/common:mangaName');
export const None = T('commands/common:none');
export const NoSynopsis = T('commands/common:noSynopsis');
export const OptionsAnime: LocalePrefixKey = 'commands/common:optionsAnime';
export const OptionsManga: LocalePrefixKey = 'commands/common:optionsManga';
export const UserOptionName = T('commands/common:userOptionName');
