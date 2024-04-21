"use client"

import { pusherClient } from '@/lib/pusher'
import { chatHrefConstructor, toPusherKey } from '@/lib/utils'
import { usePathname, useRouter } from 'next/navigation'
import { FC, useEffect, useState } from 'react'
import toast, { type Toast } from 'react-hot-toast'
import UnseenToastNotifi from './UnseenToastNotifi'

interface SidebarChatListProps {
  friends: User[]
  sessionId: string
}
interface NewMessage extends Message {
  senderImg: string
  senderName: string
}

const SidebarChatList: FC<SidebarChatListProps> = ({friends , sessionId}:SidebarChatListProps) => {

    const router = useRouter()
  const pathname = usePathname()
  const [unseenMessages, setUnseenMessages] = useState<Message[]>([])

  useEffect(()=>{
    pusherClient.subscribe(toPusherKey(`user:${sessionId}:chats`))
    pusherClient.subscribe(toPusherKey(`user:${sessionId}:friends`))

    const newFriendHandler = ()=>{
      router.refresh()
      window.location.reload();
    }
    const chatHandler = (message:NewMessage)=>{
      console.log("New chat >>>>>", message)
      const shouldNotify = pathname !== `/dashboard/chat/${chatHrefConstructor(sessionId , message.senderId)}`;
      if(!shouldNotify){
        return
      }
      toast.custom(( t: Toast)=> (<UnseenToastNotifi t={t} senderId={message.senderId} senderImg={message.senderImg}  senderName={message.senderName} sessionId={sessionId} senderMessage={message.text} />)
      )
      setUnseenMessages((prev)=>[message , ...prev])
    }

    pusherClient.bind(`new_message` , chatHandler)
    pusherClient.bind(`new_friend` , newFriendHandler)

    return ()=>{
      pusherClient.unsubscribe(toPusherKey(`user:${sessionId}:chats`))
      pusherClient.unsubscribe(toPusherKey(`user:${sessionId}:friends`))

      pusherClient.unbind(`new_message` , chatHandler)
      pusherClient.unbind(`new_friend` , newFriendHandler)
    }
  } , [pathname , sessionId , router])


  useEffect(() => {
    if (pathname?.includes('chat')) {
      setUnseenMessages((prev) => {
        return prev.filter((msg) => !pathname.includes(msg.senderId))
      })
    }
  }, [pathname])


  return <ul role='list' className='max-h-[25rem] overflow-y-auto -mx-2 space-y-1'>
  {friends.sort().map((friend) => {
    const unseenMessagesCount = unseenMessages.filter((unseenMsg) => {
      return unseenMsg.senderId === friend.id
    }).length

    return (
      <li key={friend.id}>
        <a
          href={`/dashboard/chat/${chatHrefConstructor(
            sessionId,
            friend.id
          )}`}
          className='text-gray-700 hover:text-indigo-600 hover:bg-gray-50 group flex items-center gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold'>
          {friend.name}
          {unseenMessagesCount > 0 ? (
            <div className='bg-indigo-600 font-medium text-xs text-white w-4 h-4 rounded-full flex justify-center items-center'>
              {unseenMessagesCount}
            </div>
          ) : null}
        </a>
      </li>
    )
  })}
</ul>
}

export default SidebarChatList