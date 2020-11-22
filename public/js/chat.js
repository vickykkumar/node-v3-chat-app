const socket=io()

const $messageForm = document.querySelector('#message-form')
const $messageFormInput=$messageForm.querySelector('input')
const $messageFormButton=$messageForm.querySelector('button')
const $sendLocationButton=document.querySelector('#send-location')
const $messages=document.querySelector('#messages')

const {username, room}=Qs.parse(location.search,{ignoreQueryPrefix:true})

const autoScroll=()=>{
    const $newMessage=$messages.lastElementChild
    const newMessageStyles=getComputedStyle($newMessage)
    const newMessageMargin=parseInt(newMessageStyles.marginBottom)
    const newMessageheight=$newMessage.offsetHeight + newMessageMargin
    

    const visibleHeight = $messages.offsetHeight

    const contentHeight=$messages.scrollHeight

    const scrolloffset=$messages.scrollTop + visibleHeight

    if(containerHeight - newMessageheight <= scrolloffset)
    {
        $messages.scrollTop = $messages.scrollHeight
    }
}

const messageTemplate=document.querySelector('#message-template').innerHTML
const locationmessageTemplate=document.querySelector('#locationmessage-template').innerHTML
const sidebarTemplate=document.querySelector('#sidebar-template').innerHTML

socket.on('message',(message)=>{
    console.log(message)
    const html=Mustache.render(messageTemplate,{
        username:message.username,
        message:message.text,
        createdAt:moment(message.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend',html)
    autoScroll()
})

socket.on('locationmessage',(url)=>{
    const html=Mustache.render(locationmessageTemplate,{
        username:url.username,
        url:url.url,
        createdAt:moment(url.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend',html)
    autoScroll()
})

socket.on('roomData',({room,users})=>{
    const html=Mustache.render(sidebarTemplate,{
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML=html
})

$messageForm.addEventListener('submit',(e)=>{
    e.preventDefault()
    $messageFormButton.setAttribute('disabled','disabled')
    const message=e.target.elements.message.value
    socket.emit('sendMessage',message,(error)=>{
        $messageFormButton.removeAttribute('disabled')
        $messageFormInput.value=''
        $messageFormInput.focus()
        if(error){
            return console.log(error)
        }
        console.log('message delivered!')
    })
})

$sendLocationButton.addEventListener('click',()=>{
    
    if(!navigator.geolocation)
    {
        return alert('geolocation location is not support by your broser')
    }

    $sendLocationButton.setAttribute('disabled','disabled')

    navigator.geolocation.getCurrentPosition((position)=>{
        
        socket.emit('sendLocation',{
            latitude:position.coords.latitude,
            longitude:position.coords.longitude
        },()=>{
            $sendLocationButton.removeAttribute('disabled')
            console.log('Location shared!')
        })
    })
})

socket.emit('join',{username,room},(error)=>{
    if(error){
        alert(error)
        location.href='/'
    }
})