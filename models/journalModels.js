const mongoose = require('mongoose')

const journalSchema = mongoose.Schema(
    {
        Title: {
            type: String,
            required: [true, "Please Enter Title"]
        },
        Description: {
            type: String,
            required: [true, "Please Enter Description"]
        },
        Likes: {
            type: Number,
            required: false,
            default: 0
        },
        Date:{
            type: Date,
            default: Date.now
        },
        Photo: {
            type: String,
            required: false
        }

    }
)

const Journals = mongoose.model('JournalEntry', journalSchema);

module.exports = Journals;