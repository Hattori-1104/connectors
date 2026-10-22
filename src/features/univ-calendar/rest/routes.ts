import { Hono } from "hono"
import * as z from "zod"
import { plainDateStringSchema } from "~/lib/plain-date"
import { NotFoundError, type UnivCalendarService } from "../domain/service"

const yearSchema = z.coerce.number().int()

export function createRestApi(service: UnivCalendarService) {
	return new Hono()
		.get("/days/:date", (c) => {
			const date = plainDateStringSchema.safeParse(c.req.param("date"))
			if (!date.success) {
				return c.json({ error: z.prettifyError(date.error) }, 400)
			}
			return c.json(service.getByDay(date.data))
		})
		.get("/years/:year", (c) => {
			const year = yearSchema.safeParse(c.req.param("year"))
			if (!year.success) {
				return c.json({ error: z.prettifyError(year.error) }, 400)
			}
			return c.json(service.getAllByYear(year.data))
		})
		.onError((err, c) => {
			if (err instanceof NotFoundError) {
				return c.json({ error: err.message }, 404)
			}
			console.error(err)
			return c.json({ error: "Internal Server Error" }, 500)
		})
}
