import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import * as z from "zod"
import { plainDateSchema, plainDateStringSchema } from "~/lib/plain-date"
import type { UnivCalendarService } from "../domain/service"

const dateSchema = plainDateStringSchema.describe(
	"日付（日本時間, YYYY-MM-DD）",
)

const today = () => {
	// Workers は UTC で動くので日本時間（UTC+9、夏時間なし）にずらす
	const date = new Date(Date.now() + 9 * 60 * 60 * 1000)
	return plainDateSchema.parse({
		year: date.getUTCFullYear(),
		month: date.getUTCMonth() + 1,
		date: date.getUTCDate(),
	})
}

// クォーター開始日から暦で数えた週数と食い違うので、利用側に意味を説明しておく
const lessonDescription =
	"lesson は、その曜日の授業が学期内で何回目か（0始まり。0なら第1回）で、暦の週ではない。" +
	"各曜日とも学期に14回あり、春・秋クォーターが0〜6、夏・冬クォーターが7〜13。" +
	"祝日などで授業がなかった曜日はその分だけ回が後ろにずれるので、クォーター開始日から暦で数えた週数とは一致しないことがある" +
	"（例: 2026-05-09（土）は春クォーター開始日 2026-04-11 からちょうど4週後だが、2026-05-02（土）が休みだったため lesson は3）。" +
	"授業がない日は null。"

const json = (value: unknown) => ({
	content: [{ type: "text" as const, text: JSON.stringify(value) }],
})

export function createMcpServer(service: UnivCalendarService) {
	const server = new McpServer({
		name: "univ-calendar",
		version: "0.1.0",
	})

	server.registerTool(
		"get_day_info",
		{
			title: "指定日の大学歴情報",
			description:
				"早稲田大学の2026年度（2026年4月〜2027年3月）の大学暦で、指定日に授業があるか、その曜日の授業が何回目か、" +
				"どの学期・クォーター・休業期間（夏休み・冬休み・春休み）に属するかを返す。" +
				"「明日授業ある？」「今何クォーター？」のような質問にはまずこれを使う。日付は日本時間。" +
				lessonDescription,
			inputSchema: { date: dateSchema.optional() },
			annotations: { readOnlyHint: true },
		},
		({ date }) => {
			// date は inputSchema で PlainDate に変換済み
			return json(service.getByDay(date ?? today()))
		},
	)

	server.registerTool(
		"get_whole_year_info",
		{
			title: "指定年度の大学歴情報",
			description:
				"早稲田大学の2026年度の大学暦（各学期・クォーター・休業期間の期間と、全日の情報）を返す。現時点では2026年度固定。" +
				"「夏休みは何日から？」「秋クォーターはいつまで？」のような質問にはこれを使う。" +
				lessonDescription,
			inputSchema: { year: z.literal(2026).optional() },
			annotations: { readOnlyHint: true },
		},
		({ year }) => {
			return json(service.getAllByYear(year ?? 2026))
		},
	)

	return server
}
