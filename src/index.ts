import { Hono } from "hono"
import { univCalendar } from "./features/univ-calendar"

const app = new Hono()

app.get("/", (c) => {
	return c.text("Hello Hono!")
})

app.route("/univ-calendar", univCalendar)

export default app
