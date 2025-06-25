import React, { useState, useRef, useEffect } from "react";

interface Message {
  id: number;
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
}

const AIChatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Focus input when chat is opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
    }
  }, [isOpen]);

  const handleSendMessage = () => {
    if (inputText.trim() === "") return;

    // Add user message
    const userMessage: Message = {
      id: Date.now(),
      text: inputText,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setIsTyping(true);

    // Simulate bot response after a delay
    setTimeout(() => {
      const botMessage: Message = {
        id: Date.now() + 1,
        text: getBotResponse(inputText),
        sender: "bot",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const getBotResponse = (userInput: string): string => {
    const lowerInput = userInput.toLowerCase();

    if (
      lowerInput.includes("hola") ||
      lowerInput.includes("hi") ||
      lowerInput.includes("hello")
    ) {
      return "¡Hola! ¿En qué puedo ayudarte hoy?";
    } else if (lowerInput.includes("ayuda") || lowerInput.includes("help")) {
      return "Estoy aquí para ayudarte. ¿Qué información necesitas?";
    } else if (
      lowerInput.includes("gracias") ||
      lowerInput.includes("thanks")
    ) {
      return "¡De nada! Estoy aquí para ayudarte cuando lo necesites.";
    } else if (lowerInput.includes("adios") || lowerInput.includes("bye")) {
      return "¡Hasta luego! Que tengas un buen día.";
    } else {
      return "Lo siento, no entiendo tu pregunta. ¿Podrías reformularla?";
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Chat window */}
      {isOpen && (
        <div className="bg-[#104b43] rounded-lg shadow-xl w-80 md:w-96 h-96 mb-4 flex flex-col overflow-hidden transition-all duration-300 ease-in-out">
          {/* Chat header */}
          <div className="bg-[#104b43] p-3 flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-[#e2c694] flex items-center justify-center mr-2">
                <img
                  src="src\Assets\Logo\Gobi Logo.png"
                  alt="Gobi Logo"
                  className="h-5 w-5 object-contain"
                />
              </div>
              <span className="text-white font-medium">Gobi</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:text-gray-200 focus:outline-none"
            >
              <svg
                xmlns="src\Assets\Images\gobbi.png"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>

          {/* Messages area */}
          <div className="flex-1 overflow-y-auto p-4 bg-[#f0f0f0]">
            {messages.length === 0 && (
              <div className="text-center text-gray-400 my-8">
                <p>¡Hola! Soy tu asistente virtual.</p>
                <p className="mt-2">¿En qué puedo ayudarte hoy?</p>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`mb-4 ${
                  message.sender === "user" ? "text-right" : "text-left"
                }`}
              >
                <div
                  className={`inline-block p-3 rounded-lg max-w-[80%] ${
                    message.sender === "user"
                      ? "bg-[#e2c694] text-gray-800 rounded-br-none"
                      : "bg-white text-gray-800 rounded-bl-none"
                  }`}
                >
                  <p>{message.text}</p>
                  <span className="text-xs opacity-70 mt-1 block">
                    {formatTime(message.timestamp)}
                  </span>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="text-left mb-4">
                <div className="inline-block p-3 rounded-lg bg-white text-gray-800 rounded-bl-none">
                  <div className="flex space-x-1">
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0ms" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "150ms" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "300ms" }}
                    ></div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <div className="p-3 bg-[#f0f0f0] border-t border-gray-300">
            <div className="flex items-center">
              <input
                ref={inputRef}
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Escribe un mensaje..."
                className="flex-1 bg-white text-gray-800 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#104b43]"
              />
              <button
                onClick={handleSendMessage}
                disabled={inputText.trim() === ""}
                className="ml-2 bg-[#104b43] text-white rounded-full p-2 hover:bg-[#076055] focus:outline-none focus:ring-2 focus:ring-[#104b43] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Chat button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-[#104b43] text-white rounded-full p-4 shadow-lg hover:bg-[#076055] focus:outline-none focus:ring-2 focus:ring-[#104b43] focus:ring-offset-2 focus:ring-offset-gray-900 transition-all duration-300 ease-in-out transform hover:scale-110 animate-float relative"
        aria-label="Abrir chat"
      >
        <span className="absolute inset-0 rounded-full bg-[#104b43] animate-ping opacity-75"></span>
        {isOpen ? (
          <svg
            xmlns="src\Assets\Images\gobbi.png"
            className="h-6 w-6 relative z-10"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        ) : (
          <svg
            xmlns="src\Assets\Images\gobbi.png"
            className="h-6 w-6 relative z-10"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
            />
          </svg>
        )}
      </button>
    </div>
  );
};

export default AIChatbot;
