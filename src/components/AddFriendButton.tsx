"use client";
import { FC, useState } from "react";
import Button from "./ui/Button";
import toast from "react-hot-toast";
import { addFriendValidator } from "@/lib/validations/add-friend";
import axios, { AxiosError } from "axios";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

interface AddFriendButtonProps {}
type FormData = z.infer<typeof addFriendValidator>;

const AddFriendButton: FC<AddFriendButtonProps> = ({}) => {
  const [showSuccessState, setShowSuccessState] = useState<boolean>(false);

  const { register, handleSubmit, setError , formState:{errors} } = useForm<FormData>({
    resolver: zodResolver(addFriendValidator),
  });

  const addFriend = async (email: string) => {
    try {
      const validateEmail = addFriendValidator.parse({ email });
      await axios.post(`/api/friends/add`, { email: validateEmail });
      setShowSuccessState(true);
    } catch (error) {
      console.log(error);
      if (error instanceof z.ZodError) {
          toast.error(error.message)
        setError("email", { message: error.message });
        return;

      }
      if (error instanceof AxiosError) {
        setError("email", { message: error.response?.data });
          toast.error(error.response?.data)
        return;
      }
      setError("email", { message: "somthing went wrong"});
    }
  };

  const onSubmiting = (data: FormData) => {
    addFriend(data.email);
  };
  return (
    <form className="max-w-sm" onSubmit={handleSubmit(onSubmiting)}> 
      <label
        htmlFor="email"
        className="block text-sm font-medium leading-6 text-gray-900"
      >
        Add friend by E-Mail
      </label>
      <div className="mt-2 flex gap-4">
        <input
          {...register("email")}
          type="text"
          className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
          placeholder="you@example.com"
        />
        <Button>Add</Button>
      </div>
      <p className="mt-1 text-red-600 text-sm ">{errors.email?.message}</p>
      {
        showSuccessState && <p className="mt-1 text-green-600 text-sm ">Friend added</p>
      }
    </form>
  );
};

export default AddFriendButton;
