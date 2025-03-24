const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const monitorSchema = new Schema({
    id: {
        type: int,
        required: true
    },
    brand: {
        type: String,
        required: true
    },
    Model: {
        type: String,
        required: true
    },
    stock: {
        type: Number,
        required: true
    },
    price: {
        type: Number,   
        required: true
    }
})

module.exports = mongoose.model('monitor', monitorSchema)