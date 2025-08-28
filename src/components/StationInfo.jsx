import React from 'react';
import { MapPin, Radio, Tv, Globe, Clock, Users, Signal } from 'lucide-react';
import useGlobeStore from '../store/useGlobeStore';

const StationInfo = () => {
  const { selectedStation } = useGlobeStore();

  if (!selectedStation || !selectedStation.geo_lat || !selectedStation.geo_long) {
    return null;
  }

  const isRadio = selectedStation.type === 'radio';
  const formatNumber = (num) => {
    if (!num) return 'N/A';
    return num.toLocaleString();
  };

  const formatTags = (tags) => {
    if (!tags || typeof tags !== 'string') return [];
    return tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
  };

  return (
    <div className="absolute bottom-4 left-4 bg-black/90 backdrop-blur-sm rounded-lg p-4 text-white max-w-sm z-30">
      <div className="flex items-start space-x-3">
        {/* Station Icon */}
        <div className={`p-2 rounded-lg ${isRadio ? 'bg-cyan-500/20' : 'bg-orange-500/20'}`}>
          {isRadio ? (
            <Radio className={`w-5 h-5 ${isRadio ? 'text-cyan-400' : 'text-orange-400'}`} />
          ) : (
            <Tv className={`w-5 h-5 ${isRadio ? 'text-cyan-400' : 'text-orange-400'}`} />
          )}
        </div>

        {/* Station Details */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm truncate mb-1">
            {selectedStation.name}
          </h3>
          
          <div className="space-y-1 text-xs text-gray-300">
            {/* Location */}
            <div className="flex items-center space-x-1">
              <MapPin className="w-3 h-3" />
              <span>
                {selectedStation.state && `${selectedStation.state}, `}
                {selectedStation.country}
              </span>
            </div>

            {/* Coordinates */}
            <div className="flex items-center space-x-1">
              <Globe className="w-3 h-3" />
              <span>
                {parseFloat(selectedStation.geo_lat).toFixed(2)}°, {parseFloat(selectedStation.geo_long).toFixed(2)}°
              </span>
            </div>

            {/* Technical Info */}
            {selectedStation.codec && (
              <div className="flex items-center space-x-1">
                <Signal className="w-3 h-3" />
                <span>
                  {selectedStation.codec}
                  {selectedStation.bitrate && ` • ${selectedStation.bitrate}kbps`}
                </span>
              </div>
            )}

            {/* Popularity (for radio stations) */}
            {isRadio && selectedStation.clickcount !== undefined && (
              <div className="flex items-center space-x-1">
                <Users className="w-3 h-3" />
                <span>
                  {formatNumber(selectedStation.clickcount)} clicks
                  {selectedStation.votes !== undefined && ` • ${selectedStation.votes} votes`}
                </span>
              </div>
            )}

            {/* Last Check */}
            {selectedStation.lastcheckok !== undefined && (
              <div className="flex items-center space-x-1">
                <Clock className="w-3 h-3" />
                <span className={selectedStation.lastcheckok ? 'text-green-400' : 'text-red-400'}>
                  {selectedStation.lastcheckok ? 'Online' : 'Offline'}
                </span>
              </div>
            )}
          </div>

          {/* Tags */}
          {selectedStation.tags && (
            <div className="mt-2">
              <div className="flex flex-wrap gap-1">
                {formatTags(selectedStation.tags).slice(0, 4).map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-0.5 bg-white/10 rounded text-xs"
                  >
                    {tag}
                  </span>
                ))}
                {formatTags(selectedStation.tags).length > 4 && (
                  <span className="px-2 py-0.5 bg-white/10 rounded text-xs">
                    +{formatTags(selectedStation.tags).length - 4} more
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Languages */}
          {selectedStation.language && (
            <div className="mt-1 text-xs text-gray-400">
              Languages: {selectedStation.language}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StationInfo;

