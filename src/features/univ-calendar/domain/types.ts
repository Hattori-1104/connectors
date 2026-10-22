export type Day = {
	date: string // YYYY-MM-DD
	isClassDay: boolean
	info: string | null
	// その曜日の授業が学期内で何回目か（0始まり）。暦の週数とは一致しない。授業がない日は null
	lesson: number | null
}

export type Term = {
	name: string // 春学期、春クォーター、夏季休業期間など
	type: "semester" | "quarter" | "vacation"
	start: string // YYYY-MM-DD
	end: string // YYYY-MM-DD（この日を含む）
}
