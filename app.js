import cors from 'cors'
import 'dotenv/config'
import express from 'express'

import exchangeRouter from './routes/exchange-routes.js'

const app = express()

// middleware
app.use(
  cors({
    origin: 'http://localhost:3000',
    credentials: true,
  }),
)
app.use(express.json())

// route
app.use('/sales', exchangeRouter)

app.listen(process.env.PORT ?? 3001, () => console.log('Server Started'))
