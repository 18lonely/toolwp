const mongoose = require('mongoose')

const connect = async() => {
    mongoose.connect('mongodb://0.0.0.0:27017/')
        .then(() => {
            console.log('Connect database successfully!')
        })
}

const disconnect = async () => {
    console('Database disconnected!')
    mongoose.disconnect()
}

module.exports = {connect, disconnect}