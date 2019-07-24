const express = require('express')
require('./db/mongoose')
const userRouter = require('./routers/user')
const taskRouter = require('./routers/task')

const app = express()
//const port = process.env.PORT || 3000
const port = process.env.PORT //get this from ./config/dev.env

// req.method - GET, POST, PATCH/PUT, DELETE
// req.path - /users, /users/login, /users/:id
// req.baseUrl - 
// req.body
// req.params
// req.query
// req.url
// res.status(503).send()
// res.render('home.hbs')

/* Custom MIDDLEWARE  Example */
// app.use((req, res, next) => {
//     console.log(req.method, req.path)
//     if(req.path.includes('/users') && req.method === 'GET'){
//         next()
//     } else {
//         res.status(503).send('Site is temporarily under to maintenance.')
//     }   
// })



app.use(express.json())
app.use(userRouter)
app.use(taskRouter)

app.listen(port, () => {
    console.log(`Server running on port ${port}`)
})


//Example toJSON - how it works
// const pet = {
//     type: 'Dog',
//     name: 'Junior'
// }
// console.log(pet)
//Override toJSON on pet object. JSON.stringify calls .toJSON before converting the object
// pet.toJSON = function(){
//     const pet = this
//     delete pet.type
//     delete pet.name
//     //console.log(petObj)
//     return pet
// }
// console.log(JSON.stringify(pet))


// Test Section
// const Task = require('./models/task')
// const User = require('./models/user')
// const main = async () => {
//     const task = await Task.findById('5d336f0e7af6f05d0217b2d9')
    // await task.populate('owner').execPopulate()
    // console.log(task.owner)

//     const user = await User.findById('5d33346cfe011d5baa335500')
//     await user.populate('tasks').execPopulate()
//     console.log(user.tasks)
// }

// main()