import React, { useState, useMemo, useEffect } from 'react';
import type { CryptoAsset } from '../types';
import { Icon } from './Icon';

interface PQCReadinessViewProps {
  onBack: () => void;
}

const initialAssets: CryptoAsset[] = [
  { id: 'btc', name: 'Bitcoin', symbol: 'BTC', pqcStatus: 'Vulnerable', algorithm: 'ECDSA', isCritical: true },
  { id: 'eth', name: 'Ethereum', symbol: 'ETH', pqcStatus: 'Pending', algorithm: 'ECDSA' },
  { id: 'sol', name: 'Solana', symbol: 'SOL', pqcStatus: 'Vulnerable', algorithm: 'Ed25519' },
  { id: 'ada', name: 'Cardano', symbol: 'ADA', pqcStatus: 'Pending', algorithm: 'Ed25519' },
  { id: 'qsc', name: 'QuantumSafeCoin', symbol: 'QSC', pqcStatus: 'Migrated', algorithm: 'CRYSTALS-Dilithium' },
  { id: 'xrp', name: 'Ripple', symbol: 'XRP', pqcStatus: 'Vulnerable', algorithm: 'ECDSA' },
  { id: 'dot', name: 'Polkadot', symbol: 'DOT', pqcStatus: 'Pending', algorithm: 'Ed25519' },
  { id: 'avax', name: 'Avalanche', symbol: 'AVAX', pqcStatus: 'Migrated', algorithm: 'CRYSTALS-Kyber' },
];

const algorithms = [...new Set(initialAssets.map(a => a.algorithm))];

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
          <circle className="text-gray-700" stroke="currentColor" strokeWidth={strokeWidth} fill="transparent" r={radius} cx={center} cy={center} />
          <circle
            className={getStrokeColor()} stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" fill="transparent" r={radius} cx={center} cy={center}
            strokeDasharray={circumference} strokeDashoffset={offset} style={{ transform: 'rotate(-90deg)', transformOrigin: 'center', transition: 'stroke-dashoffset 0.5s ease-out' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-4xl font-bold ${getScoreColor()}`}>{score}%</span>
        </div>
      </div>
    </div>
  );
};

const Notification: React.FC<{ type: 'warning' | 'success'; message: string; onDismiss: () => void; }> = ({ type, message, onDismiss }) => {
    const styles = {
        warning: { bg: 'bg-yellow-900/50 border-yellow-500/30', iconColor: 'text-yellow-400', icon: 'exclamation-triangle' as const },
        success: { bg: 'bg-green-900/50 border-green-500/30', iconColor: 'text-green-400', icon: 'check-circle' as const },
    };
    const style = styles[type];
    return (
        <div className={`flex items-start p-4 rounded-lg border ${style.bg} mb-4`}>
            <div className="flex-shrink-0">
                <Icon name={style.icon} className={`w-6 h-6 ${style.iconColor}`} />
            </div>
            <div className="ml-3 flex-1">
                <p className="text-sm text-gray-300">{message}</p>
            </div>
            <div className="ml-4 flex-shrink-0">
                <button onClick={onDismiss} className="text-gray-400 hover:text-white">
                    <Icon name="x-circle" className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};

export const PQCReadinessView: React.FC<PQCReadinessViewProps> = ({ onBack }) => {
  const [assets] = useState<CryptoAsset[]>(initialAssets);
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [algorithmFilter, setAlgorithmFilter] = useState<string>('All');
  const [sortConfig, setSortConfig] = useState<{ key: keyof CryptoAsset; direction: 'ascending' | 'descending' } | null>({ key: 'name', direction: 'ascending' });
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    const initialNotifications = initialAssets
      .filter(asset => (asset.isCritical && asset.pqcStatus === 'Vulnerable') || asset.pqcStatus === 'Migrated')
      .map(asset => {
        if (asset.isCritical && asset.pqcStatus === 'Vulnerable') {
          return { id: `warn-${asset.id}`, type: 'warning', message: `Critical Asset Vulnerable: ${asset.name} (${asset.symbol}) is vulnerable to quantum attacks.` };
        }
        if (asset.pqcStatus === 'Migrated') {
          return { id: `succ-${asset.id}`, type: 'success', message: `Migration Complete: ${asset.name} (${asset.symbol}) has been successfully migrated to PQC.` };
        }
        return null;
      }).filter(Boolean);
    setNotifications(initialNotifications as any[]);
  }, []);
  
  const dismissNotification = (id: string) => {
    setNotifications(current => current.filter(n => n.id !== id));
  };

  const sortedAndFilteredAssets = useMemo(() => {
    let filteredAssets = [...assets];
    if (statusFilter !== 'All') {
      filteredAssets = filteredAssets.filter(asset => asset.pqcStatus === statusFilter);
    }
    if (algorithmFilter !== 'All') {
      filteredAssets = filteredAssets.filter(asset => asset.algorithm === algorithmFilter);
    }
    if (sortConfig !== null) {
      filteredAssets.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'ascending' ? 1 : -1;
        return 0;
      });
    }
    return filteredAssets;
  }, [assets, statusFilter, algorithmFilter, sortConfig]);

  const requestSort = (key: keyof CryptoAsset) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };
  
  const SortableHeader: React.FC<{ columnKey: keyof CryptoAsset, title: string }> = ({ columnKey, title }) => {
    const isSorted = sortConfig?.key === columnKey;
    return (
        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
            <button onClick={() => requestSort(columnKey)} className="flex items-center gap-1 group">
                <span>{title}</span>
                {isSorted ? (sortConfig?.direction === 'ascending' ? <Icon name="chevron-up" className="w-3 h-3"/> : <Icon name="chevron-down" className="w-3 h-3"/>) : <Icon name="chevron-down" className="w-3 h-3 text-gray-600 group-hover:text-gray-300"/>}
            </button>
        </th>
    );
  }

  const overallScore = calculateOverallScore(sortedAndFilteredAssets);

  return (
    <div className="w-full max-w-4xl mx-auto p-4 md:p-8">
      <div className="flex justify-between items-center mb-6">
        <button onClick={onBack} className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 font-semibold">
          <Icon name="arrow-left" className="w-5 h-5" /> Back to Generator
        </button>
      </div>

      <div className="text-center mb-8">
        <Icon name="shield-check" className="w-12 h-12 mx-auto text-cyan-400" />
        <h2 className="text-3xl font-bold text-white mt-4">PQC Readiness Audit</h2>
        <p className="mt-2 text-gray-400">Monitoring the industry's transition to post-quantum cryptography.</p>
      </div>

      <div className="space-y-4">
        {notifications.map(n => <Notification key={n.id} {...n} onDismiss={() => dismissNotification(n.id)} />)}
      </div>

      <ReadinessScoreGauge score={overallScore} />
      
      <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-gray-700 mt-8">
        <h3 className="text-xl font-bold text-white p-6 pb-2">Cryptographic Asset Inventory</h3>
        
        <div className="p-4 flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
                <label className="text-xs text-gray-400 block mb-1">Filter by Status</label>
                <div className="flex space-x-1 bg-gray-900/50 p-1 rounded-lg">
                    {['All', 'Migrated', 'Pending', 'Vulnerable'].map(status => (
                        <button key={status} onClick={() => setStatusFilter(status)} className={`w-full px-2 py-1 text-sm font-medium rounded-md transition-colors ${statusFilter === status ? 'bg-cyan-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>
                            {status}
                        </button>
                    ))}
                </div>
            </div>
            <div className="flex-1">
                <label htmlFor="algo-filter" className="text-xs text-gray-400 block mb-1">Filter by Algorithm</label>
                <select id="algo-filter" value={algorithmFilter} onChange={e => setAlgorithmFilter(e.target.value)} className="w-full bg-gray-900 border border-gray-700 text-white rounded-md px-3 py-1.5 focus:ring-cyan-500 focus:border-cyan-500 text-sm">
                    <option value="All">All Algorithms</option>
                    {algorithms.map(algo => <option key={algo} value={algo}>{algo}</option>)}
                </select>
            </div>
        </div>

        <div className="overflow-x-auto">
            <table className="w-full min-w-full divide-y divide-gray-700">
                <thead className="bg-gray-900/50">
                    <tr>
                        <SortableHeader columnKey="name" title="Asset" />
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Symbol</th>
                        <SortableHeader columnKey="algorithm" title="Algorithm" />
                        <SortableHeader columnKey="pqcStatus" title="PQC Status" />
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                    {sortedAndFilteredAssets.map((asset) => {
                       const rowIndicatorClasses = {
                          Migrated: 'border-l-4 border-green-500',
                          Pending: 'border-l-4 border-yellow-500',
                          Vulnerable: 'border-l-4 border-red-500',
                       };
                       return (
                        <tr key={asset.id} className={`transition-colors hover:bg-gray-700/50 ${rowIndicatorClasses[asset.pqcStatus]}`}>
                            <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm font-medium text-white">{asset.name}</div></td>
                            <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm text-gray-400">{asset.symbol}</div></td>
                            <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm text-gray-300 font-mono">{asset.algorithm}</div></td>
                            <td className="px-6 py-4 whitespace-nowrap"><StatusIndicator status={asset.pqcStatus} /></td>
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