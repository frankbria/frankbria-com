import { FC } from 'react';

interface YouTubeEmbedProps {
  videoId: string;
}

export const YouTubeEmbed: FC<YouTubeEmbedProps> = ({ videoId }) => {
  return (
    <div className="my-6 relative w-full" style={{ paddingBottom: '56.25%' }}>
      <iframe
        className="absolute top-0 left-0 w-full h-full rounded-lg shadow-md"
        src={`https://www.youtube.com/embed/${videoId}`}
        title="YouTube video player"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    </div>
  );
};
