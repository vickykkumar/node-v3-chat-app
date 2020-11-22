const path=require('path')
const http=require('http')
const express=require('express')
const socketio=require('socket.io')
const Filter=require('bad-words')
const {generateMessage, generateLocationMessage}=require('./utils/message')
const {addUser,removeUser,getUser,getUserInRoom}=require('./utils/users')



const port=process.env.PORT || 3000
const publicDirectoryPath=path.join(__dirname,'../public')

const app=express()
const server=http.createServer(app)
const io=socketio(server)

app.use(express.static(publicDirectoryPath))

let count=0
let message='welcome to the app'
io.on('connection',(socket)=>{
    console.log('new websocket connection')
  
    socket.on('join',({username,room},callback)=>{
        const {error,user}=addUser({ id:socket.id,username,room})

        if(error)
        {
            return  callback(error)
        }

        socket.join(user.room)

        socket.emit('message',generateMessage('Admin','welcome'))
        socket.broadcast.to(room).emit('message',generateMessage('admin',`${user.username} has joined`))
        io.to(user.room).emit('roomData',{
            room:user.room,
            users:getUserInRoom(user.room)
        })
        callback()
    })

    socket.on('sendMessage',(message,callback)=>{
        const user= getUser(socket.id)
        const filter=new Filter()

        if(filter.isProfane(message)){
            return callback('profanity is not allowed')
        }

        io.to(user.room).emit('message',generateMessage(user.username,message))
        callback()
    })
    socket.on('disconnect',()=>{
        const user=removeUser(socket.id)
        if(user){
            io.to(user.room).emit('message',generateMessage('admin',`${user.username} has left!`))
            io.to(user.room).emit('roomData',{
                room:user.room,
                users:getUserInRoom(user.room)
            })
        }
    })

    socket.on('sendLocation',(coords,callback)=>{
        const user= getUser(socket.id)

        io.to(user.room).emit('locationmessage',generateLocationMessage(user.username,`https://google.com/maps?q=${coords.latitude},${coords.longitude}`))
        callback()
    })

    
})

server.listen(port,()=>{
    console.log('server is up')
})