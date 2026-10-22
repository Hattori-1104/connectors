import { describe, expect, test } from "vitest"
import { plainDateSchema } from "../../../lib/plain-date"
import { JsonUnivCalendarService } from "./json-service"

const plainDate = (year: number, month: number, date: number) =>
	plainDateSchema.parse({ year, month, date })

describe("getByDay", () => {
	test("指定日の情報を返す", () => {
		expect(JsonUnivCalendarService.getByDay(plainDate(2026, 4, 11))).toEqual({
			date: "2026-04-11",
			isClassDay: true,
			info: "春クォーター開始",
			lesson: 0,
			terms: [
				{
					name: "春学期",
					type: "semester",
					start: "2026-04-01",
					end: "2026-09-20",
				},
				{
					name: "春クォーター",
					type: "quarter",
					start: "2026-04-11",
					end: "2026-06-03",
				},
			],
		})
	})
	test("クォーターの終了日はそのクォーターに含まれる", () => {
		const termNames = (month: number, date: number) =>
			JsonUnivCalendarService.getByDay(plainDate(2026, month, date)).terms.map(
				(term) => term.name,
			)
		expect(termNames(6, 3)).toEqual(["春学期", "春クォーター"])
		expect(termNames(6, 4)).toEqual(["春学期", "夏クォーター"])
	})
	test("休業期間中は休業期間も返す", () => {
		const termNames = (year: number, month: number, date: number) =>
			JsonUnivCalendarService.getByDay(plainDate(year, month, date)).terms.map(
				(term) => term.name,
			)
		expect(termNames(2026, 8, 15)).toEqual(["春学期", "夏季休業期間"])
		expect(termNames(2026, 12, 25)).toEqual([
			"秋学期",
			"冬クォーター",
			"冬季休業期間",
		])
		expect(termNames(2027, 1, 6)).toEqual(["秋学期", "冬クォーター"])
		expect(termNames(2027, 3, 31)).toEqual(["秋学期", "春季休業期間"])
	})
	test("年をまたいだ日付も引ける", () => {
		expect(JsonUnivCalendarService.getByDay(plainDate(2027, 3, 31)).date).toBe(
			"2027-03-31",
		)
	})
	test("範囲外の日付はエラー", () => {
		expect(() =>
			JsonUnivCalendarService.getByDay(plainDate(2026, 3, 31)),
		).toThrow()
	})
})

describe("getAllByYear", () => {
	test("年度の全日を返す", () => {
		const { year, terms, days } = JsonUnivCalendarService.getAllByYear(2026)
		expect(year).toBe(2026)
		expect(terms.map((term) => term.name)).toEqual([
			"春学期",
			"春クォーター",
			"夏クォーター",
			"夏季休業期間",
			"秋学期",
			"秋クォーター",
			"冬クォーター",
			"冬季休業期間",
			"春季休業期間",
		])
		expect(days).toHaveLength(365)
		expect(days.at(0)?.date).toBe("2026-04-01")
	})
	test("lesson はその曜日の授業が学期内で何回目か（0始まり）", () => {
		const { terms, days } = JsonUnivCalendarService.getAllByYear(2026)
		const semesters = terms.filter((term) => term.type === "semester")
		const counts = new Map<string, number>()
		for (const day of days.filter((day) => day.isClassDay)) {
			const semester = semesters.find(
				(term) => term.start <= day.date && day.date <= term.end,
			)
			const key = `${semester?.name}-${new Date(day.date).getUTCDay()}`
			const count = counts.get(key) ?? 0
			expect(day.lesson, day.date).toBe(count)
			counts.set(key, count + 1)
		}
	})
	test("データのない年度はエラー", () => {
		expect(() => JsonUnivCalendarService.getAllByYear(2025)).toThrow()
	})
})
