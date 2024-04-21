import Button from "@/components/ui/Button";
import { db } from "@/lib/db";
import Image from "next/image";

export default async function Home() {
  await db.set("hello" ,"hello" )
  return (
   <>
   <div className="">
     <Button >Hello</Button>
   </div>
   </>
  );
}
