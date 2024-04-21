import { fetchRedis } from "@/helpers/redis";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { nanoid } from "nanoid";
import { messageValedator } from "@/lib/validations/message";
import { db } from "@/lib/db";
import { pusherServer } from "@/lib/pusher";
import { toPusherKey } from "@/lib/utils";

export async function POST(req: Request) {
  try {
    const { chatId, text }: { text: string; chatId: string } = await req.json();
    const session = await getServerSession(authOptions);
    if (!session) {
      return new Response("Unauthorized", { status: 401 });
    }
    const [userTd1, userId2] = chatId.split("--");
    if (session.user.id !== userTd1 && session.user.id !== userId2) {
      return new Response("Unauthorized", { status: 401 });
    }
    const friendId = session.user.id === userTd1 ? userId2 : userTd1;
    const userFriends = (await fetchRedis(
      "smembers",
      `user:${session.user.id}:friends`
    )) as string[];
    const isFriend = userFriends.includes(friendId);
    if (!isFriend) {
      return new Response("Unauthorized", { status: 401 });
    }
    const rawSender = (await fetchRedis(
      "get",
      `user:${session.user.id}`
    )) as string;

    const sender = JSON.parse(rawSender) as User;
    
    const timestamp = Date.now();
    // send message >>>>
    const messageData: Message = {
        id: nanoid(),
        senderId: session.user.id,
        text,
        receiverId:friendId,
        timestamp,
    };
    const message = messageValedator.parse(messageData);

    pusherServer.trigger(toPusherKey(`chat:${chatId}`) , "incomming-message" , message )
    
    pusherServer.trigger(toPusherKey(`user:${friendId}:chats`) ,`new_message` , {
      ...message,
      senderName: sender.name,
      senderImg: sender.image,
    } )
    await db.zadd(`chat:${chatId}:messages`, {
        score: timestamp,
        member: JSON.stringify(message),
      })
  
    return new Response("OK");
  } catch (error) {
    if (error instanceof Error) {
      return new Response(error.message, { status: 500 });
    }

    return new Response("Internal Server Error", { status: 500 });
  }
}
