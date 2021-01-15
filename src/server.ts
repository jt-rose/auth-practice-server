/* --------------------------------- imports -------------------------------- */

import express from 'express'
import pg from 'pg'

import logger from 'morgan'
import cors from 'cors'
import helmet from 'helmet'
import bodyParser from 'body-parser'
import cookieParser from 'cookie-parser'
import session from 'express-session'
import bcrypt from 'bcrypt'

import { secret } from "./secret"
import passport from 'passport'
import { passportConfig } from './passportConfig'

/* ------------------------------- middleware ------------------------------- */

const app = express()
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}))
app.use(logger('dev'))
app.use(helmet())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(session({
    secret: secret.sessionSecret,
    resave: false,
    saveUninitialized: true
}))
app.use(cookieParser(secret.sessionSecret))
app.use(passport.initialize())
app.use(passport.session())

passportConfig(passport)

/* --------------------------- connect to database -------------------------- */

export const db = new pg.Client({
    connectionString: secret.postgresSecret
})

db.connect()

/* --------------------------------- routes --------------------------------- */

const notString = (text: any) => typeof text !== "string"

app.post('/register', async (req, res) => {
    const { username, password} = req?.body
    if (!username || !password || notString(username) || notString(password)) {
        res.json({
            type: 'error',
            message: 'improper values'
        })
    }
    db.query(`
    SELECT username from "Users"
    WHERE username = $1
    `, [username])
    .then( async (result) => {
        if (result.rows.length !== 0) {
            res.json({
                type: 'error',
                message: 'username already exisits'
            })
        } else {
            try {
                // check if user exists first
                const hashedPassword = await bcrypt.hash(password, 12)
                await db.query(`
                        INSERT INTO "Users"
                        VALUES ( $1, $2, $3)
                        RETURNING username;
                        `, [username, hashedPassword, username + "@email.com"])
                res.send(`${username} registered`)
            } catch(e) {
                res.json({
                    type: 'error',
                    message: e.message
                })
            }
        }
    }).catch(err => res.json({ type: 'error', message: err.message}))
    
})

app.post('/login', passport.authenticate('local'), (req, res) => {
    res.send('login succesful')
})

app.get('/user', (req, res) => {
    console.log(req.user)
    const auth = req.isAuthenticated()
     if (auth) {
        res.send('success')
     } else {
         res.send('failure')
     }
    
})
/*
app.post('/login', (req, res, next) => {
    
    console.log(req.user)
    // check password
    passport.authenticate('local', (err, user, done) => {
        if (err) throw err
        if (!user) res.send('no user found')
        else {
            req.logIn(user, (err) => {
                if (err) throw err
                res.send('auth successful')
                console.log(req.user)
            })
        }
    })(req, res, next)
})

app.post('/register', (req, res) => {
    
    const { username, password } = req.body
    // check if username already exists
    db.query(`
    SELECT * FROM "Users"
    WHERE username = $1;
    `, [username])
    .then( result => {
        // create new user if username available
        if (result.rows.length === 0) {
            bcrypt.hash(password, 10)
            .then( hashedPassword => {
                db.query(`
                INSERT INTO "Users"
                VALUES ( $1, $2, $3)
                RETURNING username;
                `, [username, hashedPassword, username + "@email.com"])
                .then( result => res.json(result.rows[0]))
                .catch(err => console.error(err))
            })
        } else {
            res.json({error: true, message: 'user already exists'})
        }
    })
    .catch(err => {throw err})
})

app.get('/monsters', (req, res) => {
    
    console.log("postgres monster req recieved")
    passport.authenticate('local', (err, username, done) => {
        if (err) throw err
        if (!username) res.send('no user found')
        else {
            db.query(`
                SELECT * FROM monster_mash;`)
            .then(res => res.rows)
            .then( rows => {
                console.log(rows)
                res.json(rows)
  })
  .catch( err => console.error(err.message))
        }
    })
    
})

/* ------------------------------ start server ------------------------------ */

const port = 4000
app.listen(port,() => {
    console.log('listening on port ' + port)
})