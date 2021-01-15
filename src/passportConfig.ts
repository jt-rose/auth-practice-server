import { db } from './server'
import bcrypt = require('bcrypt')
import passportLocal = require('passport-local')
import { PassportStatic } from 'passport'

interface User extends Express.User {
    username?: string
}
const LocalStrategy = passportLocal.Strategy

const invalidMessage = 'invalid username or password'

export const passportConfig = (passport: PassportStatic) => {
    passport.use(
        new LocalStrategy( async(username: string, password: string, done) => {
            try {
                console.log('debugger time:')
                const userSearch = await db.query(`
                SELECT * FROM "Users"
                WHERE username = $1;
                `, [username])
                console.log('dq query result: ' + userSearch.rows[0])
                if (userSearch.rows.length === 0) {
                    return done(null, false, { message: invalidMessage})
                }
                const user = userSearch.rows[0]

                const correctPassword = await bcrypt.compare(password, user.password)
                console.log('password correct: ' + correctPassword)
                if (!correctPassword) {
                    return done(null, false, { message: invalidMessage})
                }
                return done(null, user)


            } catch(err) {
                done(err, false)
            }
        })
    )
    //
    passport.serializeUser( (user: User, done) => done(null, user.username))
    //
    passport.deserializeUser( async(username: string, done) => {
        try {
            const user = await db.query(`
                SELECT * FROM "Users"
                WHERE username = $1
                LIMIT 1;
            `, [username])
            const userResult = user.rows.length !== 0 ? user.rows[0] : false;
            return done(null, userResult)
        } catch(err) {

        }
    })
}
        


/*
            db.query(`
            SELECT * FROM "Users"
            WHERE username = $1;
            `, [username])
            .then( result => {
                if (result.rows.length === 0) return done(null, false)
                const rowResult = result.rows[0]
                bcrypt.compare(rowResult.password, password, (err, comparison) => {
                    if (err) throw err
                    if (comparison === true) {
                        return done(null, rowResult)
                    } else {
                        return done(null, false)
                    }
                })
            })
            .catch(err => console.error(err))
        }
    ))
    passport.serializeUser((user: User, done) => {
        done(null, user.username)
    })
    passport.deserializeUser((user: User, done) => {
        db.query(`
        SELECT * FROM "Users"
        WHERE username = $1;
        `, [user.username])
        .then( result => {
            done(null, result.rows[0])
        })
        .catch( err => done(null, err))
    })
}

*/