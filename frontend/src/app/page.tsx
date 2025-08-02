import Image from "next/image";
import Recorder from "@/app/Recorder/page";
import Prompt from "@/app/Result/page";
import Chat from "@/app/Chatbot/page";

export default function Home() {
  return (
    <>
      <Prompt />
      <Recorder />
      <Chat />
    </>
  );
}