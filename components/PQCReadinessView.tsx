import React from 'react';
import type { CryptoAsset } from '../types';
import { Icon } from './Icon';

interface PQCReadinessViewProps {
  onBack: () => void;
}

const mockAssets: CryptoAsset[] = [
  { id: 'btc', name: 'Bitcoin', symbol: 'BTC', pqcStatus: 'Vulnerable' },
  { id: 'eth', name: 'Ethereum', symbol: 'ETH', pqcStatus: 'Pending' },
  { id: 'sol', name: 'Solana', symbol: 'SOL', pqcStatus: 'Vulnerable' },
  { id: 'ada', name: 'Cardano', symbol: 'ADA', pqcStatus: 'Pending' },
  { id: 'qsc', name: 'QuantumSafeCoin', symbol: 'QSC', pqcStatus: 'Migrated' },
  { id: 'xrp', name: 'Ripple', symbol: 'XRP', pqcStatus: 'Vulnerable' },
  { id: 'dot', name: 'Polkadot', symbol: 'DOT', pqcStatus: 'Pending' },
];

const StatusIndicator: React.FC<{ status: CryptoAsset['pqcStatus'] }> = ({ status }) => {
  const statusStyles = {
    Migrated: {
      container: 'bg-green-500/20 text-green-400 border border-green-500/30',
      indicator: 'bg-green-500'
    },
    Pending: {
      container: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
      indicator: 'bg-yellow-500'
    },
    Vulnerable: {
      container: 'bg-red-500/20 text-red-400 border border-red-500/30',
      indicator: 'bg-red-500'
    },
  };

  const styles = statusStyles[status];

  return (
    <span className={`inline-flex items-center gap-2 px-3 py-1 text-xs font-medium rounded-full ${styles.container}`}>
      <span className={`h-2 w-2 rounded-full ${styles.indicator}`}></span>
      <span>{status}</span>
    </span>
  );
};

const calculateOverallScore = (assets: CryptoAsset[]): number => {
  if (assets.length === 0) return 0;
  const scoreMap = {
    Migrated: 100,
    Pending: 50,
    Vulnerable: 0,
  };
  const totalScore = assets.reduce((acc, asset) => acc + scoreMap[asset.pqcStatus], 0);
  const maxScore = assets.length * 100;
  return Math.round((totalScore / maxScore) * 100);
};

const ReadinessScoreGauge: React.FC<{ score: number }> = ({ score }) => {
  const size = 160;
  const strokeWidth = 12;
  const center = size / 2;
  const radius = center - strokeWidth / 2;
  const circumference = 2 * Math.PI * radius;

  const progress = score / 100;
  const offset = circumference * (1 - progress);

  const getScoreColor = () => {
    if (score >= 75) return 'text-green-400';
    if (score >= 40) return 'text-yellow-400';
    return 'text-red-400';
  };
  
  const getStrokeColor = () => {
    if (score >= 75) return 'stroke-green-500';
    if (score >= 40) return 'stroke-yellow-500';
    return 'stroke-red-500';
  }

  return (
    <div className="flex flex-col items-center justify-center my-8 p-6 bg-gray-800/50 rounded-lg border border-gray-700">
      <h3 className="text-lg font-semibold text-gray-300 mb-4">Overall PQC Readiness Score</h3>
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="w-full h-full" viewBox={`0 0 ${size} ${size}`}>
          {/* Background circle */}
          <circle
            className="text-gray-700"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="transparent"
            r={radius}
            cx={center}
            cy={center}
          />
          {/* Progress circle */}
          <circle
            className={getStrokeColor()}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            fill="transparent"
            r={radius}
            cx={center}
            cy={center}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transform: 'rotate(-90deg)', transformOrigin: 'center', transition: 'stroke-dashoffset 0.5s ease-out' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-4xl font-bold ${getScoreColor()}`}>{score}%</span>
        </div>
      </div>
    </div>
  );
};


export const PQCReadinessView: React.FC<PQCReadinessViewProps> = ({ onBack }) => {
  const overallScore = calculateOverallScore(mockAssets);

  return (
    <div className="w-full max-w-4xl mx-auto p-4 md:p-8">
      <div className="flex justify-between items-center mb-6">
        <button onClick={onBack} className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 font-semibold">
          <Icon name="arrow-left" className="w-5 h-5" />
          Back to Generator
        </button>
      </div>

      <div className="text-center mb-8">
        <Icon name="shield-check" className="w-12 h-12 mx-auto text-cyan-400" />
        <h2 className="text-3xl font-bold text-white mt-4">PQC Readiness Audit</h2>
        <p className="mt-2 text-gray-400">Monitoring the industry's transition to post-quantum cryptography.</p>
      </div>

      <ReadinessScoreGauge score={overallScore} />
      
      <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-gray-700 mt-8">
        <div className="overflow-x-auto">
            <h3 className="text-xl font-bold text-white p-6 pb-2">Cryptographic Asset Inventory</h3>
            <table className="w-full min-w-full divide-y divide-gray-700">
                <thead className="bg-gray-900/50">
                    <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                            Asset
                        </th>
                         <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                            Symbol
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                            PQC Status
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                    {mockAssets.map((asset) => {
                       const rowIndicatorClasses = {
                          Migrated: 'border-l-4 border-green-500',
                          Pending: 'border-l-4 border-yellow-500',
                          Vulnerable: 'border-l-4 border-red-500',
                       };
                       return (
                        <tr key={asset.id} className={`transition-colors hover:bg-gray-700/50 ${rowIndicatorClasses[asset.pqcStatus]}`}>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-white">{asset.name}</div>
                            </td>
                             <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-400">{asset.symbol}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <StatusIndicator status={asset.pqcStatus} />
                            </td>
                        </tr>
                       )
                    })}
                </tbody>
            </table>
        </div>
      </div>

    </div>
  );
};
