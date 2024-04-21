"use client";
import { pusherClient } from "@/lib/pusher";
import { toPusherKey } from "@/lib/utils";
import axios from "axios";
import { Check, User, UserPlus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { FC, useEffect, useState } from "react";

interface FriendRequestProps {
  incommingFriendRequests: IncommingFriendRequest[];
  sessionId: string;
}

const FriendRequest: FC<FriendRequestProps> = ({
  incommingFriendRequests,
  sessionId,
}) => {
  const router = useRouter();
  const [friendRequests, setFriendRequests] = useState<
    IncommingFriendRequest[]
  >(incommingFriendRequests);

  useEffect(() => {
    pusherClient.subscribe(
      toPusherKey(`user:${sessionId}:incoming_friend_requests`)
    );
    const friendRequestHandeler = ({senderId , senderEmail , senderImage ,senderName }:IncommingFriendRequest ) => {
      console.log("friendRequestHandeler");
      setFriendRequests((prev)=> [...prev , {senderId , senderEmail , senderImage , senderName}])
    };

    
    pusherClient.bind(`incoming_friend_requests`, friendRequestHandeler);
   
    return () => {
      pusherClient.unsubscribe(
        toPusherKey(`user:${sessionId}:incoming_friend_requests`)
      );
      pusherClient.unbind(`incoming_friend_requests`, friendRequestHandeler);
    };
  }),[sessionId];

  const acceptFrendRequest = async (senderId: string) => {
    await axios.post(`/api/friends/accept`, { id: senderId });
    setFriendRequests((previous) => {
      return previous.filter((request) => request.senderId !== senderId);
    });
    window.location.reload();
  };
  const denyFrendRequest = async (senderId: string) => {
    await axios.post(`/api/friends/deny`, { id: senderId });
    setFriendRequests((previous) => {
      return previous.filter((request) => request.senderId !== senderId);
    });
    window.location.reload();
  };
  return (
    <>
      {friendRequests.length === 0 ? (
        <p className="text-sm text-zinc-500">Nothing to show....</p>
      ) : (
        friendRequests.map((request) => {
          return (
            <div className="flex gap-4 items-center" key={request.senderId}>
              <UserPlus className="text-black" />
              <p className="font-medium text-lg">{request.senderEmail}</p>
              <button
                onClick={() => {
                  acceptFrendRequest(request.senderId);
                }}
                className="w-8 h-8 bg-indigo-600 hover:bg-indigo-700 grid place-items-center rounded-full transition hover:shadow-md"
                aria-label="accept friend"
              >
                <Check className="font-semibold text-white w-3/4 h-3/4" />
              </button>

              <button
                onClick={() => {
                  denyFrendRequest(request.senderId);
                }}
                className="w-8 h-8 bg-red-600 hover:bg-red-700 grid place-items-center rounded-full transition hover:shadow-md"
                aria-label="deny friend"
              >
                <X className="font-semibold text-white w-3/4 h-3/4" />
              </button>
            </div>
          );
        })
      )}
    </>
  );
};

export default FriendRequest;
