import ChatInput from "@/components/ChatInput";
import Messages from "@/components/Messages";
import { fetchRedis } from "@/helpers/redis";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { messageArrayValedator } from "@/lib/validations/message";
import { getServerSession } from "next-auth";
import Image from "next/image";
import { notFound } from "next/navigation";
import { FC } from "react";

interface ChatPageProps {
  params: {
    chatId: string;
  };
}
const getChatMessage = async (chatId: string) => {
  try {
    const results: string[] = await fetchRedis(
      'zrange',
      `chat:${chatId}:messages`,
      0,
      -1
    )
    console.log("resultsss : ", results);
    const dbMessage = results.map((message) => {
    return  JSON.parse(message) as Message;
    });
    const revercedDbMessages = dbMessage.reverse();
    const messages = messageArrayValedator.parse(revercedDbMessages);
    return messages;
  } catch (error) {
    notFound();
  }
};
const ChatPage: FC<ChatPageProps> = async ({ params }: ChatPageProps) => {
  const session = await getServerSession(authOptions);
  if (!session) {
    notFound();
  }
  const {chatId} = params
  const { user } = session;
  const [chatId1, chatId2] = params.chatId.split("--");
  if (user.id !== chatId1 && user.id !== chatId2) {
    notFound();
  }
  const chatPartnerId = user.id === chatId1 ? chatId2 : chatId1;
  const chatPartner = (await db.get(`user:${chatPartnerId}`)) as User;
  const initialMessages = await getChatMessage(params.chatId);
  return (
    <div className="flex-1 justify-between flex flex-col h-full max-h-[calc(100vh-6rem)]">
      <div className="flex sm:items-center justify-between py-3 border-b-2 border-gray-200">
        <div className="relative flex items-center space-x-4">
            <div className="relative">
                <div className="relative w-8 sm:w-12 h-8 sm:h-12">
                    <Image fill referrerPolicy='no-referrer' src={chatPartner?.image} alt={chatPartner.name} className="rounded-full"/>
                </div>
            </div>
            <div className='flex flex-col leading-tight'>
            <div className='text-xl flex items-center'>
              <span className='text-gray-700 mr-3 font-semibold'>
                {chatPartner.name}
              </span>
            </div>

            <span className='text-sm text-gray-600'>{chatPartner.email}</span>
          </div>
          </div>
      </div>

      <Messages initialMessages ={initialMessages} sessionId={session.user.id} sessionImg={session.user.image}  chatId={chatId} 
      chatPartner={chatPartner} 
       />
      <ChatInput chatId={chatId} chatPartner={chatPartner}/>
    </div>
  );
};

export default ChatPage;
