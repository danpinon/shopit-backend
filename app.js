const express = require('express')
const app =  express()
let cors = require('cors')

const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser')
const fileUpload = require('express-fileupload')


const errorMiddleware = require('./middlewares/errors')


app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())
app.use(fileUpload())
app.use(cors())




//IMPORT ALL ROUTES
const products = require('./routes/product')
const auth = require('./routes/auth')
const order = require('./routes/order')

app.use('/api/v1', products)
app.use('/api/v1', auth)
app.use('/api/v1', order)

//Middleware to handle errors
app.use(errorMiddleware)

module.exports = app
