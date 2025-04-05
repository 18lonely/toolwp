const mongoose = require('mongoose')

const profileSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    base: {
        type: String,
        require: true
    },
    proxy: {
        type: String,
        require: false
    },
    storage: {
        type: String,
        require: false
    }
})

module.exports = mongoose.model('Profile', profileSchema)