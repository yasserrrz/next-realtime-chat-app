import { fetchRedis } from "@/helpers/redis";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { pusherServer } from "@/lib/pusher";
import { toPusherKey } from "@/lib/utils";
import { addFriendValidator } from "@/lib/validations/add-friend";
import { getServerSession } from "next-auth";
import { z } from "zod";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email: emailToAdd } = addFriendValidator.parse(body.email);
    const RESTResponse = await fetch(
      `${process.env.UPSTASH_REDIS_REST_URL}/get/user:email:${emailToAdd}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`,
        },
        cache: "no-store",
      }
    );
    const data = (await RESTResponse.json()) as { result: string | null };
    const idToAdd = await fetchRedis("get", `user:email:${emailToAdd}`) as string;
    
    const session = await getServerSession(authOptions);
    if (!idToAdd) {
      return new Response(`This person dose not exist.`, { status: 400 });
    }
    if (!session) {
      return new Response(`Unauthorized`, { status: 401 });
    }
    if (idToAdd === session.user.id) {
      return new Response(`You can't add yourself as a friend`, {
        status: 400,
      });
    }
    //check if the user is allready added
    const isAllreadyAdded = (await fetchRedis(
      "sismember",
      `user:${idToAdd}:incoming_friend_requests`,
      session.user.id
    )) as boolean;
    if (isAllreadyAdded) {
      return new Response(`This person is allready added this user`, {
        status: 400,
      });
    }
    const isAllreadyFriend = (await fetchRedis(
      "sismember",
      `user:${session.user.id}:friends`,
      idToAdd
    )) as boolean;
    if (isAllreadyFriend) {
      return new Response(`This person is allready Friend`, { status: 400 });
    }
    pusherServer.trigger(toPusherKey(`user:${idToAdd}:incoming_friend_requests`), "incoming_friend_requests" , {
      senderId:session.user.id,
      senderEmail:session.user.email, 
      senderImage: session.user.image,
      senderName:session.user.name
    })
    //send friend request
    db.sadd(`user:${idToAdd}:incoming_friend_requests`, session.user.id);
    return new Response(`OK`);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response(`Invalid request payload`, { status: 422 });
    }
    return new Response("Invalid request ", { status: 400 });
  }
}
