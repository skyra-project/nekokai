import { Time } from '@sapphire/time-utilities';

/**
 * Converts a number of minutes to milliseconds.
 * @param minutes The amount of minutes
 * @returns The amount of milliseconds `minutes` equals to.
 */
export function minutes(minutes: number): number {
	return minutes * Time.Minute;
}
