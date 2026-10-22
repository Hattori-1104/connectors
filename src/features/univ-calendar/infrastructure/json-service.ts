import * as z from "zod"
import type { PlainDate } from "~/lib/plain-date"
import { NotFoundError, type UnivCalendarService } from "../domain/service"
import type { Day, Term } from "../domain/types"
import calendar2026 from "./2026.json"

// JSON の import では "semester" などが string に広がるので、読み込み時に検証する
const calendarJsonSchema = z.object({
	terms: z.array(
		z.object({
			name: z.string(),
			type: z.enum(["semester", "quarter", "vacation"]),
			start: z.iso.date(),
			end: z.iso.date(),
		}),
	),
	days: z.array(
		z.object({
			date: z.iso.date(),
			is_class_day: z.boolean(),
			info: z.string().nullable(),
			lesson: z.number().nullable(),
		}),
	),
})

type Calendar = { terms: Term[]; days: Day[] }

const toCalendar = (json: unknown): Calendar => {
	const { terms, days } = calendarJsonSchema.parse(json)
	return {
		terms,
		days: days.map((day) => ({
			date: day.date,
			isClassDay: day.is_class_day,
			info: day.info,
			lesson: day.lesson,
		})),
	}
}

// キーは年度
const calendarsByYear = new Map<number, Calendar>([
	[2026, toCalendar(calendar2026)],
])

const dayByDate = new Map<string, Day>(
	[...calendarsByYear.values()]
		.flatMap((calendar) => calendar.days)
		.map((day) => [day.date, day]),
)

const allTerms = [...calendarsByYear.values()].flatMap(
	(calendar) => calendar.terms,
)

const formatDate = ({ year, month, date }: PlainDate): string =>
	`${year}-${String(month).padStart(2, "0")}-${String(date).padStart(2, "0")}`

export const JsonUnivCalendarService: UnivCalendarService = {
	getByDay: (date: PlainDate): Day & { terms: Term[] } => {
		const key = formatDate(date)
		const day = dayByDate.get(key)
		if (!day) {
			throw new NotFoundError(`${key}の大学暦はありません`)
		}
		// YYYY-MM-DD は文字列のまま大小比較できる
		const terms = allTerms.filter(
			(term) => term.start <= key && key <= term.end,
		)
		return { ...day, terms }
	},
	getAllByYear: (
		year: number,
	): { year: number; terms: Term[]; days: Day[] } => {
		const calendar = calendarsByYear.get(year)
		if (!calendar) {
			throw new NotFoundError(`${year}年度の大学暦はありません`)
		}
		return { year, ...calendar }
	},
}
