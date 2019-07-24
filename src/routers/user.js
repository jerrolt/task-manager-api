const express = require('express')
const multer = require('multer')
const sharp = require('sharp')
const User = require('../models/user')
const auth = require('../middleware/auth')
const { sendWelcomeEmail, sendCancelEmail } = require('../emails/account')
const router = new express.Router()

/* Avatar Routes */

// POST avatar - upload users image - save in mongodb
const upload = multer({
    //dest: 'avatars', //use if storing on the server
    limits: {
        fileSize: 1000000
    },
    fileFilter(req, file, cb) {
        if(!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
            return cb(new Error('File must be jpg, jpeg or png'))
        }
        cb(undefined, true)
    }
})
router.post('/users/profile/avatar', auth, upload.single('avatar'), async (req, res) => {
    const buffer = await sharp(req.file.buffer).resize({
        width: 250,
        height: 250
    }).png().toBuffer()
    
    req.user.avatar = buffer

    await req.user.save()
    res.send()
}, (error, req, res, next) => {
    res.status(400).send({error: error.message})
})


// DELETE avatar
router.delete('/users/profile/avatar', auth, async (req, res) => {   
    req.user.avatar = undefined
    await req.user.save()
    res.send()
})


// GET avatar
router.get('/users/:id/avatar', async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
        res.set('Content-Type','image/png')
        res.send(user.avatar)
    } catch(e) {
        res.status(404).send()
    }
})


// Create (SignUp)
router.post('/users', async (req, res) => {
    const user = new User(req.body)
    
    try {
        await user.save()
        sendWelcomeEmail(user.email, user.name)
        const token = await user.generateAuthToken()
        res.status(201).send({ user, token })
    } catch(e) {
        res.status(400).send(e)
    }
})

// Read
// Account/Profile
router.get('/users/profile', auth, async (req, res) => {
    try {
        res.send(req.user)
    } catch(e) {
        console.log('caught here')
        res.status(500).send(e)
    }
})

router.get('/users/:id', auth, async (req, res) => {
    const _id = req.params.id

    try { 
        const user = await User.findById(_id)
        if(!user) {
            return res.status(404).send()
        }
        res.send(user)
    } catch(e) {
        res.status(500).send(e)
    }
})

router.get('/users', auth, async (req, res) => {
    try {
        const users = await User.find({})
        res.send(users)
    } catch(e) {
        res.status(500).send(e)
    }
})


// Update
// router.patch('/users/:id', async (req, res) => {
//     const updates = Object.keys(req.body)
//     const allowedUpdates = ['name', 'email', 'password', 'age']
//     const isValidUpdate = updates.every((update) => allowedUpdates.includes(update))
    
//     if(!isValidUpdate) {
//         return res.status(400).send({ error: 'invalid update' })
//     }

//     try {
//         // const user = await User.findByIdAndUpdate(req.params.id, req.body, {new: true, runValidators: true})       
//         const user = await User.findById(req.params.id)           
//         if(!user) {
//             return res.status(404).send()
//         }
//         updates.forEach((element) => user[element] = req.body[element]);
//         await user.save()
//         res.send(user)
//     } catch(e) {
//         res.status(400).send(e)
//     }
// })
router.patch('/users/profile', auth, async (req, res) => {
    const fields = Object.keys(req.body)
    const allowed = ['name', 'email', 'password', 'age']
    const isValid = fields.every((field) => allowed.includes(field))
    
    if(!isValid) {
        return res.status(400).send({ error: 'invalid update' })
    }

    try {
        fields.forEach((field) => req.user[field] = req.body[field])       
        await req.user.save()
        res.send(req.user)
    } catch(e) {
        res.status(400).send(e)
    }
})



// Delete
// router.delete('/users/:id', auth, async (req, res) => {
//     try {
//         const user = await User.findByIdAndDelete(req.params.id)
//         if(!user) {
//             return res.status(404).send()
//         }
//         res.send(user)
//     } catch(e) {
//         res.status(500).send(e)
//     }  
// })

router.delete('/users/profile', auth, async (req, res) => {
    try {
        // req.user.remove().then((user) => res.send(user)).catch((error) => res.status(405).send())      
        // OR
        await req.user.remove()
        sendCancelEmail(req.user.email, req.user.name)
        res.send(req.user)      
    } catch(e) {
        res.status(500).send(e)
    }  
})


/* 
 * Authentication Routes
 */

// Login
router.post('/users/login', async (req, res) => {
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password)
        const token = await user.generateAuthToken()
        res.send({ user, token })
    } catch(e) {
        res.status(400).send()
    }
})

// Logout
router.post('/users/logout',  auth, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter((token) => token.token !== req.token)
        await req.user.save()
        res.send()
    } catch(e) {
        res.status(500).send()
    }
})

// /users/logoutAll
router.post('/users/logoutAll', auth, async (req, res) => {
    try {
        req.user.tokens = []
        await req.user.save()
        res.send()
    } catch(e) {
        res.status(500).send()
    }
})

module.exports = router