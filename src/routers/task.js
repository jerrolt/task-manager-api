const express = require('express')
const Task = require('../models/task')
const auth = require('../middleware/auth')

const router = new express.Router()

// Create/Add Task
router.post('/tasks', auth, async (req, res) => {
    const task = new Task({
        ...req.body,
        owner: req.user._id
    })
    
    try {
        await task.save()
        res.status(201).send(task)
    } catch(e) {
        res.status(400).send(e)
    }
})

//Get All Tasks
// Filters: GET /tasks?completed=true OR /tasks?completed=false
// Pagination: GET /task?limit=10&skip=10
// Sorting: GET /task?sortBy=createdAt_desc
router.get('/tasks', auth, async (req, res) => {
    try {
        // user.tasks filters 
        const match = {}
        if(req.query.completed) {
            switch (req.query.completed) {
                case 'true':
                    match.completed = true
                    break;
                case 'false':
                    match.completed = false
                    break;
                default:
                    break;
            }
        }

        //  user.tasks sort 
        const sort = {}
        if(req.query.sortBy) {
            const parts = req.query.sortBy.split('_')
            sort[parts[0]] = parts[1] === 'desc' ? -1 : 1
        }

        // Populate user.tasks using filters and join definitions
        await req.user.populate({
            path: 'tasks',
            match,
            options: {
                limit: parseInt(req.query.limit),
                skip: parseInt(req.query.skip),
                sort
            }
        }).execPopulate()

        res.send(req.user.tasks)
    } catch(e) {
        res.status(500).send(e)
    }
})


router.get('/tasks/:id', auth, async (req, res) => {
    const _id = req.params.id
    try {
        const task = await Task.findOne({ owner: req.user._id })
        if(!task) {
            return res.status(404).send()
        }
        res.send(task)
    } catch(e) {
        res.status(500).send(e)
    }
})

router.patch('/tasks/:id', auth, async (req, res) => {
    const updates = Object.keys(req.body)
    const allowedUpdates = ['description', 'completed']
    const isValidUpdate = updates.every((update) => allowedUpdates.includes(update))

    if(!isValidUpdate) {
        return res.status(400).send({ error: 'invalid update' })
    }

    try {
        // const task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
        // const task = await Task.findById(req.params.id)
        const task = await Task.findOne({ _id: req.params.id, owner: req.user._id })

        if(!task) {
            return res.status(404).send()
        }
        updates.forEach(field => task[field] = req.body[field])
        await task.save()
        res.send(task)
    } catch(e) {
        res.status(400).send(e)
    }
})

router.delete('/tasks/:id', auth, async (req, res) => {
    try {
        // const task = await Task.findByIdAndDelete(req.params.id)
        const task = await Task.findOneAndDelete({ _id: req.params.id, owner: req.user._id })
        if(!task) {
            return res.status(404).send()
        }
        res.send(task)
    } catch(e) {
        res.status(500).send(e)
    }  
})

module.exports = router