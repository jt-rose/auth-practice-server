import express from 'express'
//import pg from 'pg'
//import passport from 'passport'
//import passportLocal from "passport-local"
//const LocalStrategy = passportLocal.Strategy

import logger from 'morgan'
import cors from 'cors'
import helmet from 'helmet'
import bodyParser from 'body-parser'
import cookieParser from 'cookie-parser'
import session from 'express-session'

import { secret } from "./secret"

const app = express()

// middleware
app.use(logger('dev'))
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}))
app.use(helmet())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(session({
    secret: secret.sessionSecret,
    resave: true,
    saveUninitialized: true
}))
app.use(cookieParser(secret.sessionSecret))

// routes
app.listen(8000,() => {
    console.log('listening on port 8000')
})