"use client";
import { pusherClient } from "@/lib/pusher";
import { toPusherKey } from "@/lib/utils";
import { User } from "lucide-react";
import Link from "next/link";
import { FC, useEffect, useState } from "react";

interface FriendRequestSidebarOptionsProps {
  sessionId: string;
  initialunseenRequestCount: number;
}

const FriendRequestSidebarOptions: FC<FriendRequestSidebarOptionsProps> = ({
  initialunseenRequestCount,
  sessionId,
}) => {
  const [unseenRequestCount, setUnseenRequestCount] = useState<number>(
    initialunseenRequestCount
  );
  useEffect(()=>{
    pusherClient.subscribe(
      toPusherKey(`user:${sessionId}:incoming_friend_requests`)
    );
    const friendRequestHandelerCount = ( ) => {
     setUnseenRequestCount((prev)=>prev+1)
    };
    
    pusherClient.bind(`incoming_friend_requests`, friendRequestHandelerCount);

    return () => {
      pusherClient.unsubscribe(
        toPusherKey(`user:${sessionId}:incoming_friend_requests`)
      );
      pusherClient.unbind(`incoming_friend_requests`, friendRequestHandelerCount);
    };
  },[sessionId , unseenRequestCount])
  return (
    <Link
      href="/dashboard/request"
      className="text-gray-700 hover:text-indigo-600 hover:bg-gray-50 group flex items-center gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold"
    >
      <div className="text-gray-400 border-gray-200 group-hover:border-indigo-600 group-hover:text-indigo-600 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border text-[0.625rem] font-medium bg-white">
        <User className="h-4 w-4" />
      </div>
      <p className="truncate">Friend request</p>
      {unseenRequestCount > 0 ? (
        <div className="rounded-full h-5 w-5 flex items-center justify-center text-sm text-white bg-indigo-600 ">
          {unseenRequestCount}
        </div>
      ) : null}
    </Link>
  );
};

export default FriendRequestSidebarOptions;
