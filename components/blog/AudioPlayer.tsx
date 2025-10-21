import { FC } from 'react';

interface AudioPlayerProps {
  audioUrl: string;
}

export const AudioPlayer: FC<AudioPlayerProps> = ({ audioUrl }) => {
  return (
    <div className="my-6 w-full max-w-2xl mx-auto">
      <div className="bg-gray-50 rounded-lg p-4 shadow-md">
        <audio
          controls
          className="w-full"
          preload="metadata"
        >
          <source src={audioUrl} type="audio/mpeg" />
          <source src={audioUrl} type="audio/mp3" />
          Your browser does not support the audio element.
        </audio>
      </div>
    </div>
  );
};
