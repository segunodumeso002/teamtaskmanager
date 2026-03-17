import http from 'node:http'
import { handler } from './handler.js'

const port = Number(process.env.PORT || 4000)

function toLambdaEvent(req, body) {
  return {
    body,
    rawPath: req.url,
    headers: req.headers,
    requestContext: {
      http: {
        method: req.method,
      },
    },
  }
}

const server = http.createServer(async (req, res) => {
  const chunks = []

  req.on('data', (chunk) => {
    chunks.push(chunk)
  })

  req.on('end', async () => {
    const rawBody = chunks.length > 0 ? Buffer.concat(chunks).toString('utf-8') : ''

    const lambdaEvent = toLambdaEvent(req, rawBody)
    const response = await handler(lambdaEvent)

    res.writeHead(response.statusCode, response.headers)
    res.end(response.body)
  })
})

server.listen(port, () => {
  console.log(`Backend listening on http://localhost:${port}`)
})
