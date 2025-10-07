'use client';

import { ChatBox } from '@/components';

export default function Home() {
  return (
    <div className="h-screen flex flex-col">
      <ChatBox className="flex-1" />
    </div>
  );
}
