import React, { useEffect, useState } from 'react'
import { dummyRecentMessagesData } from '../assets/assets'
import { Link } from 'react-router-dom'
import moment from 'moment'
import { useAuth, useUser } from '@clerk/clerk-react'
import api from '../api/axios'
import toast from 'react-hot-toast'

const RecentMessages = () => {

    const [messages, setMessages] = useState([])
    const {user} = useUser()
    const {getToken} = useAuth()

    const fetchRecentMessages = async () => {
        try {
          const token = await getToken()
            const { data } = await api.get('/api/message/user/recent-messages', {
                headers: { Authorization: `Bearer ${token}` }
            })
            if(data.success){
                // Group messages by sender and get the latest message for each sender
                const groupedMessages = data.messages.reduce((acc, message)=>{
                    const senderId = message.from_user_id?._id;
                    if(!senderId) return acc;
                    if(!acc[senderId] || new Date(message.createdAt || 0) > new Date(acc[senderId].createdAt || 0)){
                        acc[senderId] = message
                    }
                    return acc;
                }, {})

                // Sort messages by date
                const sortedMessages = Object.values(groupedMessages).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))

                setMessages(sortedMessages)
            }else{
                toast.error("Failed to fetch recent messages")
            }
        } catch (error) {
             toast.error("Failed to load recent messages. Please try again.")
        }
    }

    useEffect(()=>{
        if(user){
            fetchRecentMessages()
            const intervalId = setInterval(fetchRecentMessages, 30000)
            return ()=> {clearInterval(intervalId)}
        }
        
    },[user])

  return (
    <div className='bg-white max-w-xs mt-4 p-4 min-h-20 rounded-md shadow text-xs text-slate-800'>
      <h3 className='font-semibold text-slate-8 mb-4'>Recent Messages</h3>
      <div className='flex flex-col max-h-56 overflow-y-scroll no-scrollbar'>
        {
            messages.map((message, index)=>{
                const senderId = message.from_user_id?._id;
                if(!senderId) return null;
                return (
                <Link to={`/messages/${senderId}`} key={index} className='flex items-start gap-2 py-2 hover:bg-slate-100'>
                    <img src={message.from_user_id?.profile_picture || '/default-avatar.png'} alt="" className='w-8 h-8 rounded-full'/>
                    <div className='w-full'>
                        <div className='flex justify-between'>
                            <p className='font-medium'>{message.from_user_id?.full_name || 'Unknown User'}</p>
                            <p className='text-[10px] text-slate-400'>{message.createdAt ? moment(message.createdAt).fromNow() : ''}</p>
                        </div>
                        <div className='flex justify-between'>
                            <p className='text-gray-500'>{message.text ? message.text : 'Media'}</p>
                            {message.seen === false && <p className='bg-indigo-500 text-white w-4 h-4 flex items-center justify-center rounded-full text-[10px]'>1</p>}
                        </div>
                    </div>
                    
                </Link>
                )
            })
        }
      </div>
    </div>
  )
}

export default RecentMessages
