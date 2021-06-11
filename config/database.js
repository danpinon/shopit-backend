
const mongoose = require('mongoose');


const connectDatabase = async () => {
    try{
        await mongoose.connect(process.env.DB_LOCAL_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            useCreateIndex: true
        }).then(con => {
            console.log(`MongoDB Database connected with HOST: ${con.connection.host}`)
        })
    }catch(error){
        console.log('error connecting to database', error)
        process.exit(1)//STOP APP
    }
}

module.exports = connectDatabase