import { fetchRedis } from "@/helpers/redis"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { pusherServer } from "@/lib/pusher"
import { toPusherKey } from "@/lib/utils"
import { getServerSession } from "next-auth"
import { z } from "zod"

export async function POST(req:Request){
    try {
        const body = await req.json()
        const {id:idToAdd} = z.object({id:z.string()}).parse(body)
        const session = await getServerSession(authOptions);
        if(!session){
            return new Response(`Unauthorized`, {status:401});
        }
        if(idToAdd === session.user.id){
            return new Response(`You can't add yourself as a friend`, {status:400});
        }
        //check if the user is allready added
        const isAllreadyAdded = (await fetchRedis( "sismember" , `user:${session.user.id}:friends`, idToAdd ))
        if(isAllreadyAdded){
            return new Response(`You are already friends`, {status:400});
        }
        const hasFriendrequest = await fetchRedis( "sismember" , `user:${session.user.id}:incoming_friend_requests` , idToAdd)
        // console.log("hasFriendrequest???" , hasFriendrequest) 
        if(!hasFriendrequest){
            return new Response("no friend request", {status:400})
        }
        pusherServer.trigger(toPusherKey(`user:${idToAdd}:friends`), "new_friend", {})
        await db.sadd(`user:${session.user.id}:friends`, idToAdd)
        await db.sadd(`user:${idToAdd}:friends`, session.user.id)

        await db.srem(`user:${session.user.id}:incoming_friend_requests`, idToAdd)
        
        return new Response("OK")
    } catch (error) {
        if(error instanceof z.ZodError){
            return new Response(`Invalid request payload`, { status: 422 });
        }
        return new Response("Invalid request ", { status: 400 });
    }
}