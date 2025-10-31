'use client';

import { FC } from 'react';
import { Tabs, TabsContent as TabsContentUI, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Tab {
  title: string;
  content: string;
}

interface TabsContentProps {
  tabs: Tab[];
}

export const TabsContent: FC<TabsContentProps> = ({ tabs }) => {
  // Generate tab IDs from titles
  const tabIds = tabs.map(tab =>
    tab.title.toLowerCase().replace(/\s+/g, '-')
  );

  return (
    <div className="my-6">
      <Tabs defaultValue={tabIds[0]} className="w-full">
        <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${tabs.length}, 1fr)` }}>
          {tabs.map((tab, index) => (
            <TabsTrigger key={tabIds[index]} value={tabIds[index]}>
              {tab.title}
            </TabsTrigger>
          ))}
        </TabsList>
        {tabs.map((tab, index) => (
          <TabsContentUI key={tabIds[index]} value={tabIds[index]} className="mt-4">
            <div
              className="prose prose-gray max-w-none"
              dangerouslySetInnerHTML={{ __html: tab.content }}
            />
          </TabsContentUI>
        ))}
      </Tabs>
    </div>
  );
};
