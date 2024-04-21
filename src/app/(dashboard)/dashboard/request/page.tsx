
import FriendRequest from '@/components/FriendRequest'
import { fetchRedis } from '@/helpers/redis'
import { authOptions } from '@/lib/auth'
import { getServerSession } from 'next-auth'
import { notFound } from 'next/navigation'
import { FC } from 'react'



const RequestPage: FC = async () => {
    const session = await getServerSession(authOptions)
    if(!session){
        notFound()
    }
    const incommingSenderIds = await fetchRedis("smembers" , `user:${session.user.id}:incoming_friend_requests`) as string[];
    const incommingFriendRequests = await Promise.all(
        incommingSenderIds.map(async (id) => {
            const friend = await fetchRedis("get", `user:${id}`) as string;
            const senderParsed = JSON.parse(friend)
          console.log("friend request",friend)
            return {
                senderId: id, 
                senderEmail: senderParsed.email, 
                senderImage: senderParsed.image,
                senderName: senderParsed.name
            };
        })
    )
    console.log("incommingFriendRequests" ,incommingFriendRequests)
  return  <main className='pt-8'>
  <h1 className="font-bold text-5xl mb-8">
      Add a friend
  </h1>
 <div className="w-full h-full ">
    <FriendRequest incommingFriendRequests={incommingFriendRequests} sessionId={session.user.id}/>
 </div>
</main>
}

export default RequestPage  