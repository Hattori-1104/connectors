import { describe, expect, test } from "vitest"
import * as z from "zod"
import { plainDateSchema } from "./plain-date"

describe("パース", () => {
	test("11月は31日まで", () => {
		expect(() =>
			plainDateSchema.parse({
				year: 2000,
				month: 11,
				date: 31,
			}),
		).toThrow()
	})
	test("うるう年", () => {
		expect(() =>
			plainDateSchema.parse({
				year: 2026,
				month: 2,
				date: 29,
			}),
		).toThrow()
		expect(() =>
			plainDateSchema.parse({
				year: 2004,
				month: 2,
				date: 29,
			}),
		).not.toThrow()
	})
	test("日は1以上", () => {
		expect(() =>
			plainDateSchema.parse({
				year: 2026,
				month: 4,
				date: 0,
			}),
		).toThrow()
	})
	test("年月日は整数", () => {
		for (const v of [
			{ year: 2026.5, month: 4, date: 1 },
			{ year: 2026, month: 1.5, date: 1 },
			{ year: 2026, month: 4, date: 1.5 },
		]) {
			expect(() => plainDateSchema.parse(v)).toThrow(z.ZodError)
		}
	})
})
