import type { PlainDate } from "~/lib/plain-date"
import type { Day, Term } from "./types"

// 指定した日付・年度の大学暦がない
export class NotFoundError extends Error {
	name = "NotFoundError"
}

export interface UnivCalendarService {
	// terms はその日を含む学期・クォーター・休業期間
	getByDay(date: PlainDate): Day & { terms: Term[] }
	getAllByYear(year: number): {
		year: number
		terms: Term[]
		days: Day[]
	}
}
