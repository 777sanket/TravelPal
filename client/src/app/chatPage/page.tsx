// import { ChatInterface } from "../components/ChatInterface";
import { ChatInterface1 } from "../components/chat1/ChatInterfacePage";

export default function ChatPage() {
  return (
    <div
      id="chat"
      className="container w-screen flex flex-col justify-center items-center py-16  px-2 mx-auto border-2 border-red-500 "
    >
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-gray-800 mb-4">
          Start Planning Your Trip
        </h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Tell our AI about your dream destination, dates, and preferences.
          We&apos;ll create a personalized itinerary just for you.
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-lg overflow-hidden flex ">
        <ChatInterface1 />
      </div>
    </div>
  );
}
