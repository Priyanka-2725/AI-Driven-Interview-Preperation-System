import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { recordingService } from '../services/recordingService';
import { Recording } from '../types/recording';

export const ResultsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [recording, setRecording] = useState<Recording | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    recordingService.getRecording(id)
      .then(data => {
        setRecording(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.response?.data?.error?.message || err.message || 'Failed to load recording');
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !recording) {
    return (
      <div className="max-w-4xl mx-auto py-10 px-4 text-center">
        <div className="bg-red-50 text-red-700 p-6 rounded-xl border border-red-200">
          <h2 className="text-xl font-bold mb-2">Error Loading Results</h2>
          <p>{error || 'Recording not found'}</p>
          <Link to="/dashboard" className="mt-4 inline-block text-blue-600 hover:underline">
            &larr; Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const { fluencyResult, confidenceResult } = recording;

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Analysis Results</h1>
        <Link to="/record" className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition">
          New Recording
        </Link>
      </div>

      {recording.status === 'failed' && (
        <div className="bg-red-50 text-red-700 p-6 rounded-xl border border-red-200 mb-8">
          <h2 className="font-bold text-lg mb-2">Analysis Failed</h2>
          <p>{recording.failureReason}</p>
        </div>
      )}

      {recording.status === 'analyzed' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Fluency Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-blue-600 px-6 py-4">
              <h2 className="text-white font-bold text-xl">Fluency Score</h2>
            </div>
            <div className="p-6">
              <div className="flex items-end justify-between mb-6">
                <div>
                  <span className="text-5xl font-black text-gray-800">{fluencyResult?.score}</span>
                  <span className="text-gray-500 ml-1">/ 100</span>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-gray-50">
                  <span className="text-gray-600">Pace (WPM)</span>
                  <span className="font-semibold text-gray-800">{fluencyResult?.wpm.toFixed(1)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-50">
                  <span className="text-gray-600">Filler Words</span>
                  <span className="font-semibold text-gray-800">{fluencyResult?.fillerWordCount}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-50">
                  <span className="text-gray-600">Silence Ratio</span>
                  <span className="font-semibold text-gray-800">{(fluencyResult?.silenceRatio ? fluencyResult.silenceRatio * 100 : 0).toFixed(1)}%</span>
                </div>
              </div>

              {/* Penalties */}
              <div className="mt-6 bg-red-50 rounded-lg p-4">
                <h3 className="text-sm font-bold text-red-800 uppercase tracking-wide mb-3">Score Deductions</h3>
                <ul className="space-y-2 text-sm text-red-700">
                  {fluencyResult?.breakdown.wpmPenalty ? (
                    <li className="flex justify-between"><span>Pace Penalty:</span> <span>-{fluencyResult.breakdown.wpmPenalty}</span></li>
                  ) : null}
                  {fluencyResult?.breakdown.fillerPenalty ? (
                    <li className="flex justify-between"><span>Filler Penalty:</span> <span>-{fluencyResult.breakdown.fillerPenalty}</span></li>
                  ) : null}
                  {fluencyResult?.breakdown.silencePenalty ? (
                    <li className="flex justify-between"><span>Silence Penalty:</span> <span>-{fluencyResult.breakdown.silencePenalty}</span></li>
                  ) : null}
                  {!fluencyResult?.breakdown.wpmPenalty && !fluencyResult?.breakdown.fillerPenalty && !fluencyResult?.breakdown.silencePenalty && (
                    <li className="text-green-700 font-medium">Perfect! No deductions.</li>
                  )}
                </ul>
              </div>

              {/* Filler Breakdown */}
              {fluencyResult && Object.keys(fluencyResult.fillerWordBreakdown || {}).length > 0 && (
                 <div className="mt-6">
                    <h3 className="text-sm font-bold text-gray-700 mb-2">Filler Words Used:</h3>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(fluencyResult.fillerWordBreakdown).map(([word, count]) => (
                        <span key={word} className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                          "{word}" × {count}
                        </span>
                      ))}
                    </div>
                 </div>
              )}
            </div>
          </div>

          {/* Confidence Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden relative">
            <div className="bg-purple-600 px-6 py-4">
              <h2 className="text-white font-bold text-xl">Confidence Score</h2>
            </div>
            
            {/* SAMPLE BANNER - REQUIRED BY PART 4.3 */}
            {confidenceResult?.isSample && (
              <div className="bg-yellow-400 text-yellow-900 px-4 py-2 text-center text-sm font-bold shadow-sm">
                Sample data — full video-based confidence scoring is coming in a later week
              </div>
            )}
            
            <div className="p-6">
              <div className="flex items-end justify-between mb-6">
                <div>
                  <span className="text-5xl font-black text-gray-400">{confidenceResult?.score}</span>
                  <span className="text-gray-400 ml-1">/ 100</span>
                </div>
              </div>
              
              <div className="space-y-4 opacity-70">
                <div className="flex justify-between items-center py-2 border-b border-gray-50">
                  <span className="text-gray-600">Eye Contact</span>
                  <span className="font-semibold text-gray-800">{confidenceResult?.eyeContactPercent}%</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-50">
                  <span className="text-gray-600">Head Stability</span>
                  <span className="font-semibold text-gray-800 capitalize">{confidenceResult?.headStability}</span>
                </div>
              </div>

              <div className="mt-8 bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="text-sm text-gray-600 italic">
                  Note: {confidenceResult?.note || "This is sample data provided by the API for frontend testing."}
                </p>
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
};
