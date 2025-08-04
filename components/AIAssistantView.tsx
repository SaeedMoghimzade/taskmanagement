import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI } from "@google/genai";
import { type Task } from '../types';
import { PaperAirplaneIcon } from './icons/PaperAirplaneIcon';

declare global {
    interface Window {
      marked: {
        parse(markdown: string): string;
      };
    }
}

interface Message {
  role: 'user' | 'model';
  text: string;
}

interface AIAssistantViewProps {
  tasks: Task[];
}

const LoadingDots: React.FC = () => (
    <div className="flex items-center gap-1">
        <span className="h-2 w-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
        <span className="h-2 w-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
        <span className="h-2 w-2 bg-slate-400 rounded-full animate-bounce"></span>
    </div>
);

const AIAssistantView: React.FC<AIAssistantViewProps> = ({ tasks }) => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: 'سلام! من دستیار هوش مصنوعی شما هستم. چطور می‌توانم در تحلیل تسک‌ها و مدیریت پروژه به شما کمک کنم؟ برای مثال، می‌توانید بپرسید «بزرگترین ریسک‌های پروژه من چیست؟» یا «برای تسک‌های انجام نشده اولویت‌بندی پیشنهاد بده»' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = useCallback(async () => {
    if (input.trim() === '' || isLoading) return;

    const userMessage: Message = { role: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

      const systemInstruction = `شما یک مدیر محصول و دستیار مدیریت پروژه در سطح جهانی هستید. نقش شما ارائه مشاوره های هوشمندانه، تحلیل لیست تسک های ارائه شده، شناسایی ریسک های بالقوه، پیشنهاد بهبود و پاسخ به سوالات مربوط به بهترین شیوه های مدیریت محصول است.
      همیشه لیست تسک های فعلی را که در قالب JSON ارائه می شود به عنوان زمینه اصلی پاسخ های خود در نظر بگیرید. مختصر، کاربردی و همیشه با لحنی مفید و حرفه ای پاسخ دهید.
      تسک هایی با وضعیت 'انجام شده' (Done) را به عنوان تکمیل شده در نظر بگیرید. تسک های 'در حال انجام' (In Progress) فعال هستند.
      تحلیل های خود را بر اساس داده های ارائه شده انجام دهید و پاسخ ها را با فرمت Markdown ارائه کنید.`;
      
      const taskContext = `**لیست تسک‌های فعلی (JSON):**\n\`\`\`json\n${JSON.stringify(tasks, null, 2)}\n\`\`\``;
      
      // We send the last few messages for context, not the entire history to save tokens.
      const historyContext = messages.slice(-6).map(msg => `${msg.role === 'user' ? 'کاربر' : 'دستیار'}: ${msg.text}`).join('\n');
      
      const fullPrompt = `${taskContext}\n\n**تاریخچه گفتگو (اخیر):**\n${historyContext}\n\n**سوال جدید کاربر:**\n${input}`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: fullPrompt,
        config: {
          systemInstruction: systemInstruction,
        },
      });

      const modelMessage: Message = { role: 'model', text: response.text };
      setMessages(prev => [...prev, modelMessage]);

    } catch (error) {
      console.error("Error calling Gemini API:", error);
      const errorMessage: Message = { role: 'model', text: 'متاسفانه در ارتباط با سرویس هوش مصنوعی خطایی رخ داد. لطفا دوباره تلاش کنید.' };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, messages, tasks]);

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-4rem)] bg-white/70 dark:bg-slate-800/50 backdrop-blur-md rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-lg overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {messages.map((message, index) => (
                <div key={index} className={`flex items-end gap-3 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-white ${message.role === 'user' ? 'bg-sky-500' : 'bg-violet-500'}`}>
                        {message.role === 'user' ? 'ش' : 'AI'}
                    </div>
                    <div
                        className={`prose max-w-xl p-4 rounded-2xl ${message.role === 'user'
                                ? 'bg-sky-100 dark:bg-sky-900/60 rounded-br-none text-slate-800 dark:text-slate-200'
                                : 'bg-slate-100 dark:bg-slate-700/60 rounded-bl-none text-slate-800 dark:text-slate-200'
                            }`}
                    >
                        {message.role === 'model' && index === messages.length - 1 && isLoading ? (
                            <LoadingDots />
                        ) : (
                             <div className="prose prose-slate dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: window.marked.parse(message.text) }} />
                        )}
                    </div>
                </div>
            ))}
             {isLoading && messages[messages.length-1].role === 'user' && (
                 <div className="flex items-end gap-3 flex-row">
                    <div className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-white bg-violet-500">
                        AI
                    </div>
                    <div className="max-w-xl p-4 rounded-2xl bg-slate-100 dark:bg-slate-700/60 rounded-bl-none">
                        <LoadingDots />
                    </div>
                 </div>
             )}
            <div ref={messagesEndRef} />
        </div>
        
        <div className="p-4 bg-slate-100/80 dark:bg-slate-900/50 border-t border-slate-200/50 dark:border-slate-700/50">
            <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="flex items-center gap-4">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                    placeholder="از دستیار خود بپرسید..."
                    disabled={isLoading}
                    className="flex-1 w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all disabled:opacity-60"
                />
                <button
                    type="submit"
                    disabled={isLoading || input.trim() === ''}
                    className="flex-shrink-0 w-12 h-12 bg-sky-600 text-white rounded-full flex items-center justify-center transition-all duration-300 hover:bg-sky-700 disabled:bg-sky-400 disabled:cursor-not-allowed transform hover:scale-110 active:scale-100"
                    aria-label="ارسال پیام"
                >
                    <PaperAirplaneIcon />
                </button>
            </form>
        </div>
    </div>
  );
};

export default AIAssistantView;