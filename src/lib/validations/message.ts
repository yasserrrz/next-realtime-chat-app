import { z } from "zod";


export const messageValedator = z.object({
    id: z.string(),
    senderId: z.string(),
    receiverId: z.string(),
    text: z.string(),
    timestamp: z.number(),
})

export const messageArrayValedator = z.array(messageValedator)

export type Message = z.infer<typeof messageValedator>