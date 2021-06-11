const app =  require('./app')
const connectDataBase = require('./config/database')
const dotenv = require('dotenv')
const cloudinary = require('cloudinary')
// Handle Uncaght Exception
process.on('uncaughtException', err => {
    console.log(`ERROR: ${err.stack}`)
    console.log('Shutting down server due to uncaught exception')
    process.exit(1)
})

// Setting up config file
dotenv.config({ path: 'config/config.env'})

// Connecting to database
connectDataBase()



//SETTING UP CLOUDINARY CONFIGURATION
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
})

const server = app.listen(process.env.PORT, ()  => {
    console.log(`server started on PORT: ${process.env.PORT} in ${process.env.NODE_ENV} mode.`)
})

//HANDLE UNHANDLED PROMISE REJECTIONS
process.on('unhandledRejection', err => {
    console.log(`ERROR $E{err.message}`)
    console.log(`Shutting down the server due to Unhandled Promise rejection: ${err.message}`)
    server.close(() => {
        process.exit(1)
    })
})
