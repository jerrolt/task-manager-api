const mongoose = require('mongoose')
const validator = require('validator')


const taskSchema = new mongoose.Schema({
    description: {
        type: String,
        required: true,
        trim: true
    },
    completed: {
        type: Boolean,
        default: false
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    }
}, { 
    timestamps: true
})

// HOW TO GET THE task.owner property NOT just the ObjectId(gsdafsdafds)
// const task = await Task.findOne({ _id: req.param.id })
// await task.populate('owner').execPopulate()

// Middleware for the task model.  
// Use async/await for dealing with promises
// Use function not ES6 arrow func bc we binding to this
taskSchema.pre('save', async function(next){
    const task = this // referring to the task object
    const sentences = []
   
    task.description.split('.').filter((s)=>{
        return s !== undefined && s.length > 0 
    }).forEach((s) => {
        const modified = s.trim().toLowerCase()
        sentences.push(modified.charAt(0).toUpperCase() + modified.substr(1, modified.length - 1))
    })
    task.description = sentences.join('. ') + '.'

    next()
})

const Task = mongoose.model('Task', taskSchema)

module.exports = Task