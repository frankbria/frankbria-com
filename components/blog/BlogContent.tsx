'use client';

import { FC, useMemo } from 'react';
import { PodcastSubscribeButton } from './PodcastSubscribeButton';
import { YouTubeEmbed } from './YouTubeEmbed';
import { AudioPlayer } from './AudioPlayer';
import { TabsContent } from './TabsContent';

interface BlogContentProps {
  content: string;
}

export const BlogContent: FC<BlogContentProps> = ({ content }) => {
  const renderedContent = useMemo(() => {
    // Parse podcast subscribe markers: {{podcast-subscribe:SHOW_ID}}
    content = content.replace(
      /\{\{podcast-subscribe:([^}]+)\}\}/g,
      '<div data-component="podcast-subscribe" data-show-id="$1"></div>'
    );

    // Parse YouTube markers: {{youtube:VIDEO_ID}}
    content = content.replace(
      /\{\{youtube:([^}]+)\}\}/g,
      '<div data-component="youtube" data-video-id="$1"></div>'
    );

    // Parse audio markers: {{audio:URL}}
    content = content.replace(
      /\{\{audio:([^}]+)\}\}/g,
      '<div data-component="audio" data-url="$1"></div>'
    );

    // Parse tabs - this is more complex as it needs to capture content between markers
    const tabsRegex = /\{\{tabs-start\}\}(.*?)\{\{\/tabs\}\}/gs;
    content = content.replace(tabsRegex, (match, tabsContent) => {
      // Extract individual tabs
      const tabRegex = /\{\{tab:([^}]+)\}\}(.*?)\{\{\/tab\}\}/gs;
      const tabs: Array<{ title: string; content: string }> = [];
      let tabMatch;

      while ((tabMatch = tabRegex.exec(tabsContent)) !== null) {
        tabs.push({
          title: tabMatch[1],
          content: tabMatch[2].trim()
        });
      }

      if (tabs.length > 0) {
        // Base64 encode the JSON to avoid issues with quotes and special characters in HTML attributes
        const tabsJson = JSON.stringify(tabs);
        // Use browser-native btoa for base64 encoding (works in both SSR and client)
        const tabsBase64 = typeof window !== 'undefined'
          ? btoa(encodeURIComponent(tabsJson))
          : Buffer.from(tabsJson).toString('base64');
        return `<div data-component="tabs" data-tabs-b64="${tabsBase64}"></div>`;
      }

      return match; // Return original if parsing failed
    });

    return content;
  }, [content]);

  // Split content by component markers and render
  const renderContent = () => {
    const parts: JSX.Element[] = [];
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = renderedContent;

    let key = 0;

    const processNode = (node: ChildNode): JSX.Element | string | null => {
      if (node.nodeType === Node.TEXT_NODE) {
        return node.textContent || '';
      }

      if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as HTMLElement;

        // Handle our custom components
        if (element.dataset.component) {
          switch (element.dataset.component) {
            case 'podcast-subscribe':
              return (
                <PodcastSubscribeButton
                  key={`podcast-${key++}`}
                  showId={element.dataset.showId!}
                />
              );

            case 'youtube':
              return (
                <YouTubeEmbed
                  key={`youtube-${key++}`}
                  videoId={element.dataset.videoId!}
                />
              );

            case 'audio':
              return (
                <AudioPlayer
                  key={`audio-${key++}`}
                  audioUrl={element.dataset.url!}
                />
              );

            case 'tabs':
              try {
                // Decode base64 encoded tabs data
                const tabsBase64 = element.dataset.tabsB64!;
                const tabsJson = decodeURIComponent(atob(tabsBase64));
                const tabs = JSON.parse(tabsJson);
                return (
                  <TabsContent
                    key={`tabs-${key++}`}
                    tabs={tabs}
                  />
                );
              } catch (e) {
                console.error('Failed to parse tabs data:', e, element.dataset);
                return null;
              }
          }
        }

        // Regular HTML element - preserve it
        const childrenContent = Array.from(element.childNodes).map(processNode).filter(Boolean);
        return (
          <div
            key={`element-${key++}`}
            className={element.className}
            dangerouslySetInnerHTML={{ __html: element.outerHTML }}
          />
        );
      }

      return null;
    };

    Array.from(tempDiv.childNodes).forEach(node => {
      const processed = processNode(node);
      if (processed) {
        parts.push(processed as JSX.Element);
      }
    });

    return parts;
  };

  // For SSR, render the raw HTML; client-side will hydrate with components
  if (typeof window === 'undefined') {
    return (
      <div
        className="prose prose-gray max-w-none"
        dangerouslySetInnerHTML={{ __html: renderedContent }}
      />
    );
  }

  return (
    <div className="prose prose-gray max-w-none">
      {renderContent()}
    </div>
  );
};
