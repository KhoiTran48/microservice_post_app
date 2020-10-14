const express = require("express")
const bodyParser = require("body-parser")
const {randomBytes} = require("crypto")
const cors = require("cors")
const axios = require('axios')

const app = express()
app.use(bodyParser.json())
app.use(cors())

const posts = {}

app.get('/posts/:id/comments', (req, res)=>{
    res.send(posts[req.params.id] || [])
})

app.post('/posts/:id/comments', async (req, res)=>{
    const postId = req.params.id
    const {content} = req.body
    const id = randomBytes(4).toString('hex')
    let comments = posts[postId] || []
    comments.push({id, content, status: 'pending'})
    posts[postId] = comments
    await axios.post('http://event-bus-srv:4005/events',{
        type: 'CommentCreated',
        data: {
            id,
            content,
            postId,
            status: 'pending'
        }
    })
    res.status(201).send(comments)
})

app.post('/events', (req, res)=>{
    const {type, data} = req.body
    if (type == 'CommentUpdated') {
        const {postId, id, status} = data
        const comments = posts[postId]
        const comment = comments.find((cmt)=>{
            return cmt.id == id 
        })
        if(comment){
            comment.status = status
        }
    }
    res.send({})
})

app.listen(4001, ()=>{
    console.log('Listening on 4001')
})
