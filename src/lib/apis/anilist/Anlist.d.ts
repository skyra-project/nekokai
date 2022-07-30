/** Page of data */
export interface Page {
	/** The pagination information */
	readonly pageInfo?: Maybe<PageInfo>;
	readonly media?: Maybe<ReadonlyArray<Maybe<Media>>>;
	readonly characters?: Maybe<ReadonlyArray<Maybe<Character>>>;
	readonly staff?: Maybe<ReadonlyArray<Maybe<Staff>>>;
	readonly studios?: Maybe<ReadonlyArray<Maybe<Studio>>>;
	readonly mediaList?: Maybe<ReadonlyArray<Maybe<MediaList>>>;
	readonly airingSchedules?: Maybe<ReadonlyArray<Maybe<AiringSchedule>>>;
	readonly mediaTrends?: Maybe<ReadonlyArray<Maybe<MediaTrend>>>;
	readonly reviews?: Maybe<ReadonlyArray<Maybe<Review>>>;
	readonly recommendations?: Maybe<ReadonlyArray<Maybe<Recommendation>>>;
}

type Maybe<T> = T | null;
type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

/** Score & Watcher stats for airing anime by episode and mid-week */
interface AiringProgression {
	readonly __typename?: 'AiringProgression';
	/** The episode the stats were recorded at. .5 is the mid point between 2 episodes airing dates. */
	readonly episode?: Maybe<number>;
	/** The average score for the media */
	readonly score?: Maybe<number>;
	/** The amount of users watching the anime */
	readonly watching?: Maybe<number>;
}

/** Media Airing Schedule. NOTE: We only aim to guarantee that FUTURE airing data is present and accurate. */
interface AiringSchedule {
	readonly __typename?: 'AiringSchedule';
	/** The id of the airing schedule item */
	readonly id: number;
	/** The time the episode airs at */
	readonly airingAt: number;
	/** Seconds until episode starts airing */
	readonly timeUntilAiring: number;
	/** The airing episode number */
	readonly episode: number;
	/** The associate media id of the airing episode */
	readonly mediaId: number;
	/** The associate media of the airing episode */
	readonly media?: Maybe<Media>;
}

interface AiringScheduleConnection {
	readonly __typename?: 'AiringScheduleConnection';
	readonly edges?: Maybe<ReadonlyArray<Maybe<AiringScheduleEdge>>>;
	readonly nodes?: Maybe<ReadonlyArray<Maybe<AiringSchedule>>>;
	/** The pagination information */
	readonly pageInfo?: Maybe<PageInfo>;
}

/** AiringSchedule connection edge */
interface AiringScheduleEdge {
	readonly __typename?: 'AiringScheduleEdge';
	readonly node?: Maybe<AiringSchedule>;
	/** The id of the connection */
	readonly id?: Maybe<number>;
}

/** A character that features in an anime or manga */
interface Character {
	readonly __typename?: 'Character';
	/** The id of the character */
	readonly id: number;
	/** The names of the character */
	readonly name?: Maybe<CharacterName>;
	/** Character images */
	readonly image?: Maybe<CharacterImage>;
	/** A general description of the character */
	readonly description?: Maybe<string>;
	/** The character's gender. Usually Male, Female, or Non-binary but can be any string. */
	readonly gender?: Maybe<string>;
	/** The character's birth date */
	readonly dateOfBirth?: Maybe<FuzzyDate>;
	/** The character's age. Note this is a string, not an int, it may contain further text and additional ages. */
	readonly age?: Maybe<string>;
	/** The characters blood type */
	readonly bloodType?: Maybe<string>;
	/** If the character is marked as favourite by the currently authenticated user */
	readonly isFavourite: boolean;
	/** If the character is blocked from being added to favourites */
	readonly isFavouriteBlocked: boolean;
	/** The url for the character page on the AniList website */
	readonly siteUrl?: Maybe<string>;
	/** Media that includes the character */
	readonly media?: Maybe<MediaConnection>;
	/** @deprecated No data available */
	readonly updatedAt?: Maybe<number>;
	/** The amount of user's who have favourited the character */
	readonly favourites?: Maybe<number>;
	/** Notes for site moderators */
	readonly modNotes?: Maybe<string>;
}

interface CharacterConnection {
	readonly __typename?: 'CharacterConnection';
	readonly edges?: Maybe<ReadonlyArray<Maybe<CharacterEdge>>>;
	readonly nodes?: Maybe<ReadonlyArray<Maybe<Character>>>;
	/** The pagination information */
	readonly pageInfo?: Maybe<PageInfo>;
}

/** Character connection edge */
interface CharacterEdge {
	readonly __typename?: 'CharacterEdge';
	readonly node?: Maybe<Character>;
	/** The id of the connection */
	readonly id?: Maybe<number>;
	/** The characters role in the media */
	readonly role?: Maybe<CharacterRole>;
	/** Media specific character name */
	readonly name?: Maybe<string>;
	/** The voice actors of the character */
	readonly voiceActors?: Maybe<ReadonlyArray<Maybe<Staff>>>;
	/** The voice actors of the character with role date */
	readonly voiceActorRoles?: Maybe<ReadonlyArray<Maybe<StaffRoleType>>>;
	/** The media the character is in */
	readonly media?: Maybe<ReadonlyArray<Maybe<Media>>>;
	/** The order the character should be displayed from the users favourites */
	readonly favouriteOrder?: Maybe<number>;
}

interface CharacterImage {
	readonly __typename?: 'CharacterImage';
	/** The character's image of media at its largest size */
	readonly large?: Maybe<string>;
	/** The character's image of media at medium size */
	readonly medium?: Maybe<string>;
}

/** The names of the character */
interface CharacterName {
	readonly __typename?: 'CharacterName';
	/** The character's given name */
	readonly first?: Maybe<string>;
	/** The character's middle name */
	readonly middle?: Maybe<string>;
	/** The character's surname */
	readonly last?: Maybe<string>;
	/** The character's first and last name */
	readonly full?: Maybe<string>;
	/** The character's full name in their native language */
	readonly native?: Maybe<string>;
	/** Other names the character might be referred to as */
	readonly alternative?: Maybe<ReadonlyArray<Maybe<string>>>;
	/** Other names the character might be referred to as but are spoilers */
	readonly alternativeSpoiler?: Maybe<ReadonlyArray<Maybe<string>>>;
	/** The currently authenticated users preferred name language. Default romaji for non-authenticated */
	readonly userPreferred?: Maybe<string>;
}

/** The role the character plays in the media */
export const enum CharacterRole {
	/** A primary character role in the media */
	Main = 'MAIN',
	/** A supporting character role in the media */
	Supporting = 'SUPPORTING',
	/** A background character in the media */
	Background = 'BACKGROUND'
}

/** Date object that allows for incomplete date values (fuzzy) */
interface FuzzyDate {
	readonly __typename?: 'FuzzyDate';
	/** Numeric Year (2017) */
	readonly year?: Maybe<number>;
	/** Numeric Month (3) */
	readonly month?: Maybe<number>;
	/** Numeric Day (24) */
	readonly day?: Maybe<number>;
}

/** Anime or Manga */
export interface Media {
	readonly __typename?: 'Media';
	/** The id of the media */
	readonly id: number;
	/** The mal id of the media */
	readonly idMal: Maybe<number>;
	/** The official titles of the media in various languages */
	readonly title?: Maybe<MediaTitle>;
	/** The type of the media; anime or manga */
	readonly type?: Maybe<MediaType>;
	/** The format the media was released in */
	readonly format?: Maybe<MediaFormat>;
	/** The current releasing status of the media */
	readonly status?: Maybe<MediaStatus>;
	/** Short description of the media's story and characters */
	readonly description?: Maybe<string>;
	/** The first official release date of the media */
	readonly startDate?: Maybe<FuzzyDate>;
	/** The last official release date of the media */
	readonly endDate?: Maybe<FuzzyDate>;
	/** The season the media was initially released in */
	readonly season?: Maybe<MediaSeason>;
	/** The season year the media was initially released in */
	readonly seasonYear?: Maybe<number>;
	/**
	 * The year & season the media was initially released in
	 * @deprecated
	 */
	readonly seasonInt?: Maybe<number>;
	/** The amount of episodes the anime has when complete */
	readonly episodes?: Maybe<number>;
	/** The general length of each anime episode in minutes */
	readonly duration?: Maybe<number>;
	/** The amount of chapters the manga has when complete */
	readonly chapters?: Maybe<number>;
	/** The amount of volumes the manga has when complete */
	readonly volumes?: Maybe<number>;
	/** Where the media was created. (ISO 3166-1 alpha-2) */
	readonly countryOfOrigin?: Maybe<string>;
	/** If the media is officially licensed or a self-published doujin release */
	readonly isLicensed?: Maybe<boolean>;
	/** Source type the media was adapted from. */
	readonly source?: Maybe<MediaSource>;
	/** Official Twitter hashtags for the media */
	readonly hashtag?: Maybe<string>;
	/** Media trailer or advertisement */
	readonly trailer?: Maybe<MediaTrailer>;
	/** When the media's data was last updated */
	readonly updatedAt?: Maybe<number>;
	/** The cover images of the media */
	readonly coverImage?: Maybe<MediaCoverImage>;
	/** The banner image of the media */
	readonly bannerImage?: Maybe<string>;
	/** The genres of the media */
	readonly genres?: Maybe<ReadonlyArray<Maybe<string>>>;
	/** Alternative titles of the media */
	readonly synonyms?: Maybe<ReadonlyArray<Maybe<string>>>;
	/** A weighted average score of all the user's scores of the media */
	readonly averageScore?: Maybe<number>;
	/** Mean score of all the user's scores of the media */
	readonly meanScore?: Maybe<number>;
	/** The number of users with the media on their list */
	readonly popularity?: Maybe<number>;
	/** Locked media may not be added to lists our favorited. This may be due to the entry pending for deletion or other reasons. */
	readonly isLocked?: Maybe<boolean>;
	/** The amount of related activity in the past hour */
	readonly trending?: Maybe<number>;
	/** The amount of user's who have favourited the media */
	readonly favourites?: Maybe<number>;
	/** List of tags that describes elements and themes of the media */
	readonly tags?: Maybe<ReadonlyArray<Maybe<MediaTag>>>;
	/** Other media in the same or connecting franchise */
	readonly relations?: Maybe<MediaConnection>;
	/** The characters in the media */
	readonly characters?: Maybe<CharacterConnection>;
	/** The staff who produced the media */
	readonly staff?: Maybe<StaffConnection>;
	/** The companies who produced the media */
	readonly studios?: Maybe<StudioConnection>;
	/** If the media is marked as favourite by the current authenticated user */
	readonly isFavourite: boolean;
	/** If the media is intended only for 18+ adult audiences */
	readonly isAdult?: Maybe<boolean>;
	/** The media's next episode airing schedule */
	readonly nextAiringEpisode?: Maybe<AiringSchedule>;
	/** The media's entire airing schedule */
	readonly airingSchedule?: Maybe<AiringScheduleConnection>;
	/** The media's daily trend stats */
	readonly trends?: Maybe<MediaTrendConnection>;
	/** External links to another site related to the media */
	readonly externalLinks?: Maybe<ReadonlyArray<Maybe<MediaExternalLink>>>;
	/** Data and links to legal streaming episodes on external sites */
	readonly streamingEpisodes?: Maybe<ReadonlyArray<Maybe<MediaStreamingEpisode>>>;
	/** The ranking of the media in a particular time span and format compared to other media */
	readonly rankings?: Maybe<ReadonlyArray<Maybe<MediaRank>>>;
	/** The authenticated user's media list entry for the media */
	readonly mediaListEntry?: Maybe<MediaList>;
	/** User reviews of the media */
	readonly reviews?: Maybe<ReviewConnection>;
	/** User recommendations for similar media */
	readonly recommendations?: Maybe<RecommendationConnection>;
	readonly stats?: Maybe<MediaStats>;
	/** The url for the media page on the AniList website */
	readonly siteUrl?: Maybe<string>;
	/** If the media should have forum thread automatically created for it on airing episode release */
	readonly autoCreateForumThread?: Maybe<boolean>;
	/** If the media is blocked from being recommended to/from */
	readonly isRecommendationBlocked?: Maybe<boolean>;
	/** Notes for site moderators */
	readonly modNotes?: Maybe<string>;
}

interface MediaConnection {
	readonly __typename?: 'MediaConnection';
	readonly edges?: Maybe<ReadonlyArray<Maybe<MediaEdge>>>;
	readonly nodes?: Maybe<ReadonlyArray<Maybe<Media>>>;
	/** The pagination information */
	readonly pageInfo?: Maybe<PageInfo>;
}

interface MediaCoverImage {
	readonly __typename?: 'MediaCoverImage';
	/** The cover image url of the media at its largest size. If this size isn't available, large will be provided instead. */
	readonly extraLarge?: Maybe<string>;
	/** The cover image url of the media at a large size */
	readonly large?: Maybe<string>;
	/** The cover image url of the media at medium size */
	readonly medium?: Maybe<string>;
	/** Average #hex color of cover image */
	readonly color?: Maybe<string>;
}

/** Media connection edge */
interface MediaEdge {
	readonly __typename?: 'MediaEdge';
	readonly node?: Maybe<Media>;
	/** The id of the connection */
	readonly id?: Maybe<number>;
	/** The type of relation to the parent model */
	readonly relationType?: Maybe<MediaRelation>;
	/** If the studio is the main animation studio of the media (For Studio->MediaConnection field only) */
	readonly isMainStudio: boolean;
	/** The characters in the media voiced by the parent actor */
	readonly characters?: Maybe<ReadonlyArray<Maybe<Character>>>;
	/** The characters role in the media */
	readonly characterRole?: Maybe<CharacterRole>;
	/** Media specific character name */
	readonly characterName?: Maybe<string>;
	/** Notes regarding the VA's role for the character */
	readonly roleNotes?: Maybe<string>;
	/** Used for grouping roles where multiple dubs exist for the same language. Either dubbing company name or language variant. */
	readonly dubGroup?: Maybe<string>;
	/** The role of the staff member in the production of the media */
	readonly staffRole?: Maybe<string>;
	/** The voice actors of the character */
	readonly voiceActors?: Maybe<ReadonlyArray<Maybe<Staff>>>;
	/** The voice actors of the character with role date */
	readonly voiceActorRoles?: Maybe<ReadonlyArray<Maybe<StaffRoleType>>>;
	/** The order the media should be displayed from the users favourites */
	readonly favouriteOrder?: Maybe<number>;
}

/** An external link to another site related to the media */
interface MediaExternalLink {
	readonly __typename?: 'MediaExternalLink';
	/** The id of the external link */
	readonly id: number;
	/** The url of the external link */
	readonly url: string;
	/** The site location of the external link */
	readonly site: string;
}

/** The format the media was released in */
export const enum MediaFormat {
	/** Anime broadcast on television */
	Tv = 'TV',
	/** Anime which are under 15 minutes in length and broadcast on television */
	TvShort = 'TV_SHORT',
	/** Anime movies with a theatrical release */
	Movie = 'MOVIE',
	/** Special episodes that have been included in DVD/Blu-ray releases, picture dramas, pilots, etc */
	Special = 'SPECIAL',
	/** (Original Video Animation) Anime that have been released directly on DVD/Blu-ray without originally going through a theatrical release or television broadcast */
	Ova = 'OVA',
	/** (Original Net Animation) Anime that have been originally released online or are only available through streaming services. */
	Ona = 'ONA',
	/** Short anime released as a music video */
	Music = 'MUSIC',
	/** Professionally published manga with more than one chapter */
	Manga = 'MANGA',
	/** Written books released as a series of light novels */
	Novel = 'NOVEL',
	/** Manga with just one chapter */
	OneShot = 'ONE_SHOT'
}

/** List of anime or manga */
interface MediaList {
	readonly __typename?: 'MediaList';
	/** The id of the list entry */
	readonly id: number;
	/** The id of the user owner of the list entry */
	readonly userId: number;
	/** The id of the media */
	readonly mediaId: number;
	/** The watching/reading status */
	readonly status?: Maybe<MediaListStatus>;
	/** The score of the entry */
	readonly score?: Maybe<number>;
	/** The amount of episodes/chapters consumed by the user */
	readonly progress?: Maybe<number>;
	/** The amount of volumes read by the user */
	readonly progressVolumes?: Maybe<number>;
	/** The amount of times the user has rewatched/read the media */
	readonly repeat?: Maybe<number>;
	/** Priority of planning */
	readonly priority?: Maybe<number>;
	/** If the entry should only be visible to authenticated user */
	readonly private?: Maybe<boolean>;
	/** Text notes */
	readonly notes?: Maybe<string>;
	/** If the entry shown be hidden from non-custom lists */
	readonly hiddenFromStatusLists?: Maybe<boolean>;
	/** Map of booleans for which custom lists the entry are in */
	readonly customLists?: Maybe<Record<PropertyKey, unknown>>;
	/** Map of advanced scores with name keys */
	readonly advancedScores?: Maybe<Record<PropertyKey, unknown>>;
	/** When the entry was started by the user */
	readonly startedAt?: Maybe<FuzzyDate>;
	/** When the entry was completed by the user */
	readonly completedAt?: Maybe<FuzzyDate>;
	/** When the entry data was last updated */
	readonly updatedAt?: Maybe<number>;
	/** When the entry data was created */
	readonly createdAt?: Maybe<number>;
	readonly media?: Maybe<Media>;
}

/** Media list watching/reading status enum. */
export const enum MediaListStatus {
	/** Currently watching/reading */
	Current = 'CURRENT',
	/** Planning to watch/read */
	Planning = 'PLANNING',
	/** Finished watching/reading */
	Completed = 'COMPLETED',
	/** Stopped watching/reading before completing */
	Dropped = 'DROPPED',
	/** Paused watching/reading */
	Paused = 'PAUSED',
	/** Re-watching/reading */
	Repeating = 'REPEATING'
}

/** The ranking of a media in a particular time span and format compared to other media */
interface MediaRank {
	readonly __typename?: 'MediaRank';
	/** The id of the rank */
	readonly id: number;
	/** The numerical rank of the media */
	readonly rank: number;
	/** The type of ranking */
	readonly type: MediaRankType;
	/** The format the media is ranked within */
	readonly format: MediaFormat;
	/** The year the media is ranked within */
	readonly year?: Maybe<number>;
	/** The season the media is ranked within */
	readonly season?: Maybe<MediaSeason>;
	/** If the ranking is based on all time instead of a season/year */
	readonly allTime?: Maybe<boolean>;
	/** String that gives context to the ranking type and time span */
	readonly context: string;
}

/** The type of ranking */
export const enum MediaRankType {
	/** Ranking is based on the media's ratings/score */
	Rated = 'RATED',
	/** Ranking is based on the media's popularity */
	Popular = 'POPULAR'
}

/** Type of relation media has to its parent. */
export const enum MediaRelation {
	/** An adaption of this media into a different format */
	Adaptation = 'ADAPTATION',
	/** Released before the relation */
	Prequel = 'PREQUEL',
	/** Released after the relation */
	Sequel = 'SEQUEL',
	/** The media a side story is from */
	Parent = 'PARENT',
	/** A side story of the parent media */
	SideStory = 'SIDE_STORY',
	/** Shares at least 1 character */
	Character = 'CHARACTER',
	/** A shortened and summarized version */
	Summary = 'SUMMARY',
	/** An alternative version of the same media */
	Alternative = 'ALTERNATIVE',
	/** An alternative version of the media with a different primary focus */
	SpinOff = 'SPIN_OFF',
	/** Other */
	Other = 'OTHER',
	/** Version 2 only. The source material the media was adapted from */
	Source = 'SOURCE',
	/** Version 2 only. */
	Compilation = 'COMPILATION',
	/** Version 2 only. */
	Contains = 'CONTAINS'
}

export const enum MediaSeason {
	/** Months December to February */
	Winter = 'WINTER',
	/** Months March to May */
	Spring = 'SPRING',
	/** Months June to August */
	Summer = 'SUMMER',
	/** Months September to November */
	Fall = 'FALL'
}

/** Source type the media was adapted from */
export const enum MediaSource {
	/** An original production not based of another work */
	Original = 'ORIGINAL',
	/** Asian comic book */
	Manga = 'MANGA',
	/** Written work published in volumes */
	LightNovel = 'LIGHT_NOVEL',
	/** Video game driven primary by text and narrative */
	VisualNovel = 'VISUAL_NOVEL',
	/** Video game */
	VideoGame = 'VIDEO_GAME',
	/** Other */
	Other = 'OTHER',
	/** Version 2 only. Written works not published in volumes */
	Novel = 'NOVEL',
	/** Version 2 only. Self-published works */
	Doujinshi = 'DOUJINSHI',
	/** Version 2 only. Japanese Anime */
	Anime = 'ANIME'
}

/** A media's statistics */
interface MediaStats {
	readonly __typename?: 'MediaStats';
	readonly scoreDistribution?: Maybe<ReadonlyArray<Maybe<ScoreDistribution>>>;
	readonly statusDistribution?: Maybe<ReadonlyArray<Maybe<StatusDistribution>>>;
	/** @deprecated Replaced by MediaTrends */
	readonly airingProgression?: Maybe<ReadonlyArray<Maybe<AiringProgression>>>;
}

/** The current releasing status of the media */
export const enum MediaStatus {
	/** Has completed and is no longer being released */
	Finished = 'FINISHED',
	/** Currently releasing */
	Releasing = 'RELEASING',
	/** To be released at a later date */
	NotYetReleased = 'NOT_YET_RELEASED',
	/** Ended before the work could be finished */
	Cancelled = 'CANCELLED',
	/** Version 2 only. Is currently paused from releasing and will resume at a later date */
	Hiatus = 'HIATUS'
}

/** Data and links to legal streaming episodes on external sites */
interface MediaStreamingEpisode {
	readonly __typename?: 'MediaStreamingEpisode';
	/** Title of the episode */
	readonly title?: Maybe<string>;
	/** Url of episode image thumbnail */
	readonly thumbnail?: Maybe<string>;
	/** The url of the episode */
	readonly url?: Maybe<string>;
	/** The site location of the streaming episodes */
	readonly site?: Maybe<string>;
}

/** A tag that describes a theme or element of the media */
interface MediaTag {
	readonly __typename?: 'MediaTag';
	/** The id of the tag */
	readonly id: number;
	/** The name of the tag */
	readonly name: string;
	/** A general description of the tag */
	readonly description?: Maybe<string>;
	/** The categories of tags this tag belongs to */
	readonly category?: Maybe<string>;
	/** The relevance ranking of the tag out of the 100 for this media */
	readonly rank?: Maybe<number>;
	/** If the tag could be a spoiler for any media */
	readonly isGeneralSpoiler?: Maybe<boolean>;
	/** If the tag is a spoiler for this media */
	readonly isMediaSpoiler?: Maybe<boolean>;
	/** If the tag is only for adult 18+ media */
	readonly isAdult?: Maybe<boolean>;
}

/** The official titles of the media in various languages */
interface MediaTitle {
	readonly __typename?: 'MediaTitle';
	/** The romanization of the native language title */
	readonly romaji?: Maybe<string>;
	/** The official english title */
	readonly english?: Maybe<string>;
	/** Official title in it's native language */
	readonly native?: Maybe<string>;
	/** The currently authenticated users preferred title language. Default romaji for non-authenticated */
	readonly userPreferred?: Maybe<string>;
}

/** Media trailer or advertisement */
interface MediaTrailer {
	readonly __typename?: 'MediaTrailer';
	/** The trailer video id */
	readonly id?: Maybe<string>;
	/** The site the video is hosted by (Currently either youtube or dailymotion) */
	readonly site?: Maybe<string>;
	/** The url for the thumbnail image of the video */
	readonly thumbnail?: Maybe<string>;
}

/** Daily media statistics */
interface MediaTrend {
	readonly __typename?: 'MediaTrend';
	/** The id of the tag */
	readonly mediaId: number;
	/** The day the data was recorded (timestamp) */
	readonly date: number;
	/** The amount of media activity on the day */
	readonly trending: number;
	/** A weighted average score of all the user's scores of the media */
	readonly averageScore?: Maybe<number>;
	/** The number of users with the media on their list */
	readonly popularity?: Maybe<number>;
	/** The number of users with watching/reading the media */
	readonly inProgress?: Maybe<number>;
	/** If the media was being released at this time */
	readonly releasing: boolean;
	/** The episode number of the anime released on this day */
	readonly episode?: Maybe<number>;
	/** The related media */
	readonly media?: Maybe<Media>;
}

interface MediaTrendConnection {
	readonly __typename?: 'MediaTrendConnection';
	readonly edges?: Maybe<ReadonlyArray<Maybe<MediaTrendEdge>>>;
	readonly nodes?: Maybe<ReadonlyArray<Maybe<MediaTrend>>>;
	/** The pagination information */
	readonly pageInfo?: Maybe<PageInfo>;
}

/** Media trend connection edge */
interface MediaTrendEdge {
	readonly __typename?: 'MediaTrendEdge';
	readonly node?: Maybe<MediaTrend>;
}

/** Media type enum, anime or manga. */
export const enum MediaType {
	/** Japanese Anime */
	Anime = 'ANIME',
	/** Asian comic */
	Manga = 'MANGA'
}

interface PageInfo {
	readonly __typename?: 'PageInfo';
	/** The total number of items */
	readonly total?: Maybe<number>;
	/** The count on a page */
	readonly perPage?: Maybe<number>;
	/** The current page */
	readonly currentPage?: Maybe<number>;
	/** The last page */
	readonly lastPage?: Maybe<number>;
	/** If there is another page */
	readonly hasNextPage?: Maybe<boolean>;
}

/** Media recommendation */
interface Recommendation {
	readonly __typename?: 'Recommendation';
	/** The id of the recommendation */
	readonly id: number;
	/** Users rating of the recommendation */
	readonly rating?: Maybe<number>;
	/** The rating of the recommendation by currently authenticated user */
	readonly userRating?: Maybe<RecommendationRating>;
	/** The media the recommendation is from */
	readonly media?: Maybe<Media>;
	/** The recommended media */
	readonly mediaRecommendation?: Maybe<Media>;
}

interface RecommendationConnection {
	readonly __typename?: 'RecommendationConnection';
	readonly edges?: Maybe<ReadonlyArray<Maybe<RecommendationEdge>>>;
	readonly nodes?: Maybe<ReadonlyArray<Maybe<Recommendation>>>;
	/** The pagination information */
	readonly pageInfo?: Maybe<PageInfo>;
}

/** Recommendation connection edge */
interface RecommendationEdge {
	readonly __typename?: 'RecommendationEdge';
	readonly node?: Maybe<Recommendation>;
}

/** Recommendation rating enums */
export const enum RecommendationRating {
	NoRating = 'NO_RATING',
	RateUp = 'RATE_UP',
	RateDown = 'RATE_DOWN'
}

/** A Review that features in an anime or manga */
interface Review {
	readonly __typename?: 'Review';
	/** The id of the review */
	readonly id: number;
	/** The id of the review's creator */
	readonly userId: number;
	/** The id of the review's media */
	readonly mediaId: number;
	/** For which type of media the review is for */
	readonly mediaType?: Maybe<MediaType>;
	/** A short summary of the review */
	readonly summary?: Maybe<string>;
	/** The main review body text */
	readonly body?: Maybe<string>;
	/** The total user rating of the review */
	readonly rating?: Maybe<number>;
	/** The amount of user ratings of the review */
	readonly ratingAmount?: Maybe<number>;
	/** The rating of the review by currently authenticated user */
	readonly userRating?: Maybe<ReviewRating>;
	/** The review score of the media */
	readonly score?: Maybe<number>;
	/** If the review is not yet publicly published and is only viewable by creator */
	readonly private?: Maybe<boolean>;
	/** The url for the review page on the AniList website */
	readonly siteUrl?: Maybe<string>;
	/** The time of the thread creation */
	readonly createdAt: number;
	/** The time of the thread last update */
	readonly updatedAt: number;
	/** The media the review is of */
	readonly media?: Maybe<Media>;
}

interface ReviewConnection {
	readonly __typename?: 'ReviewConnection';
	readonly edges?: Maybe<ReadonlyArray<Maybe<ReviewEdge>>>;
	readonly nodes?: Maybe<ReadonlyArray<Maybe<Review>>>;
	/** The pagination information */
	readonly pageInfo?: Maybe<PageInfo>;
}

/** Review connection edge */
interface ReviewEdge {
	readonly __typename?: 'ReviewEdge';
	readonly node?: Maybe<Review>;
}

/** Review rating enums */
export const enum ReviewRating {
	NoVote = 'NO_VOTE',
	UpVote = 'UP_VOTE',
	DownVote = 'DOWN_VOTE'
}

/** A user's list score distribution. */
interface ScoreDistribution {
	readonly __typename?: 'ScoreDistribution';
	readonly score?: Maybe<number>;
	/** The amount of list entries with this score */
	readonly amount?: Maybe<number>;
}

/** Voice actors or production staff */
interface Staff {
	readonly __typename?: 'Staff';
	/** The id of the staff member */
	readonly id: number;
	/** The names of the staff member */
	readonly name?: Maybe<StaffName>;
	/**
	 * The primary language the staff member dub's in
	 * @deprecated Replaced with languageV2
	 */
	readonly language?: Maybe<StaffLanguage>;
	/** The primary language of the staff member. Current values: Japanese, English, Korean, Italian, Spanish, Portuguese, French, German, Hebrew, Hungarian, Chinese, Arabic, Filipino, Catalan */
	readonly languageV2?: Maybe<string>;
	/** The staff images */
	readonly image?: Maybe<StaffImage>;
	/** A general description of the staff member */
	readonly description?: Maybe<string>;
	/** The person's primary occupations */
	readonly primaryOccupations?: Maybe<ReadonlyArray<Maybe<string>>>;
	/** The staff's gender. Usually Male, Female, or Non-binary but can be any string. */
	readonly gender?: Maybe<string>;
	readonly dateOfBirth?: Maybe<FuzzyDate>;
	readonly dateOfDeath?: Maybe<FuzzyDate>;
	/** The person's age in years */
	readonly age?: Maybe<number>;
	/** [startYear, endYear] (If the 2nd value is not present staff is still active) */
	readonly yearsActive?: Maybe<ReadonlyArray<Maybe<number>>>;
	/** The persons birthplace or hometown */
	readonly homeTown?: Maybe<string>;
	/** The persons blood type */
	readonly bloodType?: Maybe<string>;
	/** If the staff member is marked as favourite by the currently authenticated user */
	readonly isFavourite: boolean;
	/** If the staff member is blocked from being added to favourites */
	readonly isFavouriteBlocked: boolean;
	/** The url for the staff page on the AniList website */
	readonly siteUrl?: Maybe<string>;
	/** Media where the staff member has a production role */
	readonly staffMedia?: Maybe<MediaConnection>;
	/** Characters voiced by the actor */
	readonly characters?: Maybe<CharacterConnection>;
	/** Media the actor voiced characters in. (Same data as characters with media as node instead of characters) */
	readonly characterMedia?: Maybe<MediaConnection>;
	/** @deprecated No data available */
	readonly updatedAt?: Maybe<number>;
	/** Staff member that the submission is referencing */
	readonly staff?: Maybe<Staff>;
	/** Status of the submission */
	readonly submissionStatus?: Maybe<number>;
	/** Inner details of submission status */
	readonly submissionNotes?: Maybe<string>;
	/** The amount of user's who have favourited the staff member */
	readonly favourites?: Maybe<number>;
	/** Notes for site moderators */
	readonly modNotes?: Maybe<string>;
}

interface StaffConnection {
	readonly __typename?: 'StaffConnection';
	readonly edges?: Maybe<ReadonlyArray<Maybe<StaffEdge>>>;
	readonly nodes?: Maybe<ReadonlyArray<Maybe<Staff>>>;
	/** The pagination information */
	readonly pageInfo?: Maybe<PageInfo>;
}

/** Staff connection edge */
interface StaffEdge {
	readonly __typename?: 'StaffEdge';
	readonly node?: Maybe<Staff>;
	/** The id of the connection */
	readonly id?: Maybe<number>;
	/** The role of the staff member in the production of the media */
	readonly role?: Maybe<string>;
	/** The order the staff should be displayed from the users favourites */
	readonly favouriteOrder?: Maybe<number>;
}

interface StaffImage {
	readonly __typename?: 'StaffImage';
	/** The person's image of media at its largest size */
	readonly large?: Maybe<string>;
	/** The person's image of media at medium size */
	readonly medium?: Maybe<string>;
}

/** The primary language of the voice actor */
export const enum StaffLanguage {
	/** Japanese */
	Japanese = 'JAPANESE',
	/** English */
	English = 'ENGLISH',
	/** Korean */
	Korean = 'KOREAN',
	/** Italian */
	Italian = 'ITALIAN',
	/** Spanish */
	Spanish = 'SPANISH',
	/** Portuguese */
	Portuguese = 'PORTUGUESE',
	/** French */
	French = 'FRENCH',
	/** German */
	German = 'GERMAN',
	/** Hebrew */
	Hebrew = 'HEBREW',
	/** Hungarian */
	Hungarian = 'HUNGARIAN'
}

/** The names of the staff member */
interface StaffName {
	readonly __typename?: 'StaffName';
	/** The person's given name */
	readonly first?: Maybe<string>;
	/** The person's middle name */
	readonly middle?: Maybe<string>;
	/** The person's surname */
	readonly last?: Maybe<string>;
	/** The person's first and last name */
	readonly full?: Maybe<string>;
	/** The person's full name in their native language */
	readonly native?: Maybe<string>;
	/** Other names the staff member might be referred to as (pen names) */
	readonly alternative?: Maybe<ReadonlyArray<Maybe<string>>>;
	/** The currently authenticated users preferred name language. Default romaji for non-authenticated */
	readonly userPreferred?: Maybe<string>;
}

/** Voice actor role for a character */
interface StaffRoleType {
	readonly __typename?: 'StaffRoleType';
	/** The voice actors of the character */
	readonly voiceActor?: Maybe<Staff>;
	/** Notes regarding the VA's role for the character */
	readonly roleNotes?: Maybe<string>;
	/** Used for grouping roles where multiple dubs exist for the same language. Either dubbing company name or language variant. */
	readonly dubGroup?: Maybe<string>;
}

/** The distribution of the watching/reading status of media or a user's list */
interface StatusDistribution {
	readonly __typename?: 'StatusDistribution';
	/** The day the activity took place (Unix timestamp) */
	readonly status?: Maybe<MediaListStatus>;
	/** The amount of entries with this status */
	readonly amount?: Maybe<number>;
}

/** Animation or production company */
interface Studio {
	readonly __typename?: 'Studio';
	/** The id of the studio */
	readonly id: number;
	/** The name of the studio */
	readonly name: string;
	/** If the studio is an animation studio or a different kind of company */
	readonly isAnimationStudio: boolean;
	/** The media the studio has worked on */
	readonly media?: Maybe<MediaConnection>;
	/** The url for the studio page on the AniList website */
	readonly siteUrl?: Maybe<string>;
	/** If the studio is marked as favourite by the currently authenticated user */
	readonly isFavourite: boolean;
	/** The amount of user's who have favourited the studio */
	readonly favourites?: Maybe<number>;
}

interface StudioConnection {
	readonly __typename?: 'StudioConnection';
	readonly edges?: Maybe<ReadonlyArray<Maybe<StudioEdge>>>;
	readonly nodes?: Maybe<ReadonlyArray<Maybe<Studio>>>;
	/** The pagination information */
	readonly pageInfo?: Maybe<PageInfo>;
}

/** Studio connection edge */
interface StudioEdge {
	readonly __typename?: 'StudioEdge';
	readonly node?: Maybe<Studio>;
	/** The id of the connection */
	readonly id?: Maybe<number>;
	/** If the studio is the main animation studio of the anime */
	readonly isMain: boolean;
	/** The order the character should be displayed from the users favourites */
	readonly favouriteOrder?: Maybe<number>;
}
