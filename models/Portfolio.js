const mongoose = require("mongoose")

const Schema = mongoose.Schema;
const PortfolioSchema = Schema({
    title: {
        type: String,
        require: true,
        trim: true
    },
    description: {
        type: String,
        require: true,
        trim: true
    }
})

const Portfolio = mongoose.model("Portfolie", PortfolioSchema)

module.exports = Portfolio;