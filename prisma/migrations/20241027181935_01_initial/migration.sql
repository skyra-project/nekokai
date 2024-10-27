-- CreateEnum
CREATE TYPE "AniListSearchTitleLanguage" AS ENUM ('Romaji', 'English', 'Native', 'Unset');

-- CreateTable
CREATE TABLE "User" (
    "id" BIGINT NOT NULL,
    "preferred_ani_list_search_title_language" "AniListSearchTitleLanguage" NOT NULL DEFAULT 'Unset',

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);
