import { ChatInterface4 } from "../components/chatInterface/ChatInterfacePage4";

export default function ChatPage() {
  return (
    <div
      id="chat"
      className="container w-screen flex flex-col justify-center items-center py-5  px-2 mx-auto  "
    >
      <div className="text-center mb-5">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">
          Start Planning Your Trip
        </h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Tell our AI about your dream destination, dates, and preferences.
          We&apos;ll create a personalized itinerary just for you.
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-lg overflow-hidden flex ">
        <ChatInterface4 />
      </div>
    </div>
  );
}
