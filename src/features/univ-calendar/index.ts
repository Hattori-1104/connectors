import { StreamableHTTPTransport } from "@hono/mcp"
import { Hono } from "hono"
import { JsonUnivCalendarService } from "./infrastructure/json-service"
import { createMcpServer } from "./mcp/server"
import { createRestApi } from "./rest/routes"

const service = JsonUnivCalendarService

export const univCalendar = new Hono()
	.route("/", createRestApi(service))
	// ステートレスで動かす。Workers ではリクエストをまたいで状態を持てないので、
	// リクエストごとにサーバーとトランスポートを作る
	.post("/mcp", async (c) => {
		const server = createMcpServer(service)
		const transport = new StreamableHTTPTransport({ enableJsonResponse: true })
		await server.connect(transport)
		return transport.handleRequest(c)
	})
	// ステートレスなので SSE ストリーム（GET）とセッション終了（DELETE）は受け付けない
	.on(["GET", "DELETE"], "/mcp", (c) =>
		c.json(
			{
				jsonrpc: "2.0",
				error: { code: -32000, message: "Method not allowed." },
				id: null,
			},
			405,
		),
	)
