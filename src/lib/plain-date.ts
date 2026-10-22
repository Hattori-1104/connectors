import * as z from "zod"

const daysByMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]

function isLeapYear(year: number): boolean {
	if (!Number.isInteger(year)) {
		throw new TypeError(`year must be an integer: ${year}`)
	}
	return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
}

export const plainDateSchema = z
	.object({
		year: z.number().int("整数を入力してください"),
		month: z
			.number()
			.int("整数を入力してください")
			.min(1, "1以上の値を入力してください")
			.max(12, "12以下の値を入力してください"),
		date: z
			.number()
			.int("整数を入力してください")
			.min(1, "1以上の値を入力してください"),
	})
	.superRefine((v, ctx) => {
		if (isLeapYear(v.year) && v.date === 29) return
		const dayByMonth = daysByMonth[v.month - 1] as number
		if (v.date > dayByMonth) {
			ctx.addIssue({
				code: "custom",
				message: `${v.month}月は${dayByMonth}日までしかありませんが、${v.date}を受け取りました`,
				path: ["date"],
			})
		}
	})
	.brand<"plain-date">()

export type PlainDate = z.infer<typeof plainDateSchema>

// YYYY-MM-DD 形式の文字列を PlainDate に変換する
export const plainDateStringSchema = z
	.string()
	.transform((v, ctx) => {
		const result = v.match(/^(\d{4})-(\d{2})-(\d{2})$/)
		if (!result) {
			ctx.addIssue({
				code: "custom",
				message: "YYYY-MM-DDの形式ではありません。",
			})
			return z.NEVER
		}
		return {
			year: Number(result.at(1)),
			month: Number(result.at(2)),
			date: Number(result.at(3)),
		}
	})
	.pipe(plainDateSchema)
