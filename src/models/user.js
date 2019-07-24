const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const Task = require('./task')

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    age: {
        type: Number,
        validate(value) {
            if(value < 0) {
                throw new Error('Invalid age. Must be positive')
            }
        }
    },
    email: {
        type: String,
        unique: true,
        required: true,
        trim: true,
        validate(value) {
            if(!validator.isEmail(value)) {
                throw new Error('Invalid email address')
            }
        }
    },
    password: {
        type: String,
        required: true,
        trim: true,
        minlength: 7,
        validate(value) {
            if(value.toLowerCase().includes('password')) {
                throw new Error('Invalid password.  Cannot contain password.')
            }
        }
    },
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }],
    avatar: {
        type: Buffer
    }
}, { 
    timestamps: true
})

//tasks field to the User document.  Virtual field Task.owner == User._id
userSchema.virtual('tasks', {
    ref: 'Task',
    localField: '_id',
    foreignField: 'owner'
})


// toJSON happens on JSON.stringify automatically
// This only runs on res.send(user) -- GET /user/profile, POST /users, PATCH /users
userSchema.methods.toJSON = function(){
    const user = this
    //.toObject is a method provided by mongoose like isModified on the password
    const userObj = user.toObject()  //strip off the extra mongoose data from user so its a plain object

    delete userObj.password
    delete userObj.tokens
    delete userObj.avatar

    return userObj
}


// are accessible on individual user instances (when a user instance is created)
userSchema.methods.generateAuthToken = async function() {
    const user = this
    const token = jwt.sign({_id: user._id.toString()}, process.env.JWT_SECRET, {expiresIn: '7 days'})
    
    user.tokens = user.tokens.concat({ token })
    await user.save()

    return token
}

// statics - 
// are accessible on the user Model (static method)
userSchema.statics.findByCredentials = async (email, password) => {
    const user = await User.findOne({email})

    if(!user) {
        throw new Error('Unable to login')
    }

    const isMatch = await bcrypt.compare(password, user.password)
    
    if(!isMatch) {
        throw new Error('Unable to login')
    }

    return user
}

//use middleware
//use function not arrow bc we need to bind 'this'
//'this' refers to the document being saved
userSchema.pre('save', async function(next) {
    const user = this
    
    //isModified is a mongoose methods for checking if a field has been modified
    if(user.isModified('password')) {
        user.password = await bcrypt.hash(user.password, 8)
    }

    next()
})

//middleware to cascade delete all user related tasks
userSchema.pre('remove', async function(next){
    const user = this
    await Task.deleteMany({ owner: user._id})
    next()
})

const User = mongoose.model('User', userSchema)

module.exports = User