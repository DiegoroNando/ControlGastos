import React, { useState, useEffect, useCallback, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { PageTitle, Alert, Card, LoadingSpinner, Button } from '../../components/common/CommonComponents';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import PermissionGuard from '../../components/admin/PermissionGuard';
import { UserRole, User, VoteRecord, CandidateBlock, ALL_CANDIDATE_BLOCKS, UserSex, ALL_USER_SEX, EducationalLevel, ALL_EDUCATIONAL_LEVELS, Post, AllBlockSettings } from '../../types';
import { getUsers, getVotes, getPosts, getBlockSettings } from '../../services/databaseService';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, Title, CategoryScale, LinearScale, PointElement, LineElement } from 'chart.js';
import { Doughnut, Line } from 'react-chartjs-2';
import { SUPERADMIN_CURP } from '../../constants';

// XLSX is loaded via CDN, declare it for TypeScript
declare global {
  interface Window { XLSX: any; }
}

ChartJS.register(ArcElement, Tooltip, Legend, Title, CategoryScale, LinearScale, PointElement, LineElement);

const chartColorsLight = {
  role: ['#611232', '#db2777', '#fb923c', '#64748b', '#fbbf24'],
  block: ['#611232', '#7E2A4F', '#9B436C', '#B85B89', '#D574A6', '#db2777', '#fb923c'],
  sex: ['#611232', '#db2777', '#64748b'],
  education: ['#611232', '#db2777', '#fb923c', '#fbbf24'],
  login: ['#611232', '#64748b'], 
  voting: ['#611232', '#94a3b8'], 
};

const chartColorsDark = {
  role: ['#CDA754', '#fbbf24', '#fb923c', '#94a3b8', '#B99340'],
  block: ['#CDA754', '#B99340', '#fbbf24', '#fb923c', '#fdba74', '#fed7aa', '#fde68a'],
  sex: ['#CDA754', '#fbbf24', '#94a3b8'],
  education: ['#CDA754', '#fbbf24', '#fb923c', '#fdba74'],
  login: ['#CDA754', '#94a3b8'], 
  voting: ['#CDA754', '#cbd5e1'], 
};

const DownloadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 mr-1.5">
    <path d="M10.75 2.75a.75.75 0 00-1.5 0v8.614L6.295 8.235a.75.75 0 10-1.09 1.03l4.25 4.5a.75.75 0 001.09 0l4.25-4.5a.75.75 0 00-1.09-1.03L10.75 11.364V2.75z" />
    <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
  </svg>
);

interface TopListItem {
  id: string;
  name: string;
  value: string | number; 
  valueClass?: string;
}

interface TopListCardProps {
  title: string;
  items: TopListItem[];
  emptyText?: string;
}

const TopListCard: React.FC<TopListCardProps> = ({ title, items, emptyText = "No hay datos disponibles." }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const maxValue = Math.max(...items.map(item => Number(item.value)));
  const showViewAllButton = title.includes("Candidatos con Más Votos");

  return (
    <>      <Card>
        <div className="flex flex-col space-y-1.5 p-6">
          <div className="flex justify-between items-center">
            <h3 className="tracking-tight text-base font-semibold text-text-primary dark:text-accent-gold">{title}</h3>
            {showViewAllButton && items.length > 0 && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="text-sm text-primary-maroon hover:text-primary-maroon/80 dark:text-accent-gold dark:hover:text-accent-gold/80 font-medium"
              >
                Ver todos
              </button>
            )}
          </div>
        </div>
        <div className="p-6 pt-0">
          {items.length > 0 ? (
            <div className="space-y-3">
              {title.includes("Candidatos con Más Votos")
                ? items.slice(0, 5).map((item, index) => (
                    <RankingItem
                      key={item.id}
                      position={index + 1}
                      name={item.name}
                      value={Number(item.value)}
                      maxValue={maxValue}
                    />
                  ))
                : <ul className="space-y-2.5">
                    {items.map((item) => (
                      <li key={item.id} className="flex justify-between items-center text-sm">
                        <span className="text-text-secondary dark:text-neutral-300 truncate pr-2" title={item.name}>{item.name}</span>
                        <span className={`font-medium ${item.valueClass || 'text-text-primary dark:text-neutral-100'}`}>
                          {typeof item.value === 'number' ? item.value : item.value} {title.toLowerCase().includes("votos") || title.toLowerCase().includes("participación") ? " voto(s)" : ""}
                        </span>
                      </li>
                    ))}
                  </ul>
              }
            </div>
          ) : (
            <p className="text-sm text-text-tertiary dark:text-neutral-400 text-center py-4">{emptyText}</p>
          )}
        </div>
      </Card>
      {showViewAllButton && (
        <FullRankingModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          rankings={items}
        />
      )}
    </>
  );
};

interface StatsCardProps {
  title: string;
  value: string | number;
  percentage: number;
  icon?: React.ReactNode;
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, percentage, icon }) => (
  <div className="spectra-card bg-gradient-card-light dark:bg-gradient-card-dark backdrop-blur-lg rounded-xl shadow-spectra-md p-6 relative overflow-hidden">
    <div className="absolute right-0 top-0 h-24 w-24 bg-primary-maroon/10 dark:bg-accent-gold/10 rounded-bl-[100%] -z-10" />
    <div className="flex justify-between items-start mb-4">
      <div>
        <h3 className="text-sm text-text-tertiary dark:text-neutral-400">{title}</h3>
        <p className="text-2xl font-bold text-text-primary dark:text-accent-gold mt-1">{value}</p>
      </div>
      {icon && (
        <div className="p-2 rounded-lg bg-primary-maroon/20 dark:bg-accent-gold/20">
          {icon}
        </div>
      )}
    </div>
    <div className="flex items-center">
      <div className="w-full bg-gray-200 dark:bg-neutral-700 rounded-full h-2.5">
        <div 
          className="bg-primary-maroon dark:bg-accent-gold h-2.5 rounded-full" 
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="ml-2 text-sm font-medium text-text-secondary dark:text-neutral-300">{percentage}%</span>
    </div>
  </div>
);

const UsersIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-primary-maroon dark:text-accent-gold">
    <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
  </svg>
);

const VoteIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-primary-maroon dark:text-accent-gold">
    <path d="M3.375 3C2.339 3 1.5 3.84 1.5 4.875v.75c0 1.036.84 1.875 1.875 1.875h17.25c1.035 0 1.875-.84 1.875-1.875v-.75C22.5 3.839 21.66 3 20.625 3H3.375z" />
    <path fillRule="evenodd" d="M3.087 9l.54 9.176A3 3 0 006.62 21h10.757a3 3 0 002.995-2.824L20.913 9H3.087zm6.133 2.845a.75.75 0 011.06 0l1.72 1.72 1.72-1.72a.75.75 0 111.06 1.06l-1.72 1.72 1.72 1.72a.75.75 0 11-1.06 1.06L12 15.685l-1.72 1.72a.75.75 0 11-1.06-1.06l1.72-1.72-1.72-1.72a.75.75 0 010-1.06z" clipRule="evenodd" />
  </svg>
);

const CandidateIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-primary-maroon dark:text-accent-gold">
    {/* Persona con badge de verificación - candidato elegible */}
    <path d="M12 2.25c-2.07 0-3.75 1.68-3.75 3.75s1.68 3.75 3.75 3.75 3.75-1.68 3.75-3.75S14.07 2.25 12 2.25z"/>
    <path d="M4.5 16.875c0-3.728 3.022-6.75 6.75-6.75h1.5c3.728 0 6.75 3.022 6.75 6.75v1.125c0 .207-.168.375-.375.375H4.875a.375.375 0 01-.375-.375v-1.125z"/>
    {/* Badge de verificación */}
    <circle cx="18" cy="6" r="3" fill="currentColor"/>
    <path d="M16.5 6l.75.75L19.5 5.25" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ParticipationIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-primary-maroon dark:text-accent-gold">
    <path fillRule="evenodd" d="M8.603 3.799A4.49 4.49 0 0112 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 013.498 1.307 4.491 4.491 0 011.307 3.497A4.49 4.49 0 0121.75 12a4.49 4.49 0 01-1.549 3.397 4.491 4.491 0 01-1.307 3.497 4.491 4.491 0 01-3.497 1.307A4.49 4.49 0 0112 21.75a4.49 4.49 0 01-3.397-1.549 4.49 4.49 0 01-3.498-1.306 4.491 4.491 0 01-1.307-3.498A4.49 4.49 0 012.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 011.307-3.497 4.49 4.49 0 013.497-1.307zm7.007 6.387a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
  </svg>
);

const AdminStatisticsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { resolvedTheme } = useTheme();  
  const [users, setUsers] = useState<User[]>([]);
  const [allVotes, setAllVotes] = useState<VoteRecord[]>([]);
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const [blockSettings, setBlockSettings] = useState<AllBlockSettings>(() => {
    const defaultSettings: AllBlockSettings = {} as AllBlockSettings;
    ALL_CANDIDATE_BLOCKS.forEach(block => {
      defaultSettings[block] = { isActive: true, candidateCountAtNominationEnd: undefined };
    });
    return defaultSettings;
  });
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isDownloadingReport, setIsDownloadingReport] = useState(false);

  const currentChartColors = resolvedTheme === 'dark' ? chartColorsDark : chartColorsLight;  
  
  const getDefaultBlockSettings = (): AllBlockSettings => {
    const defaultSettings: AllBlockSettings = {} as AllBlockSettings;
    ALL_CANDIDATE_BLOCKS.forEach(block => {
      defaultSettings[block] = { isActive: true, candidateCountAtNominationEnd: undefined };
    });
    return defaultSettings;
  };
  
  const fetchSystemData = useCallback(async () => {
    setIsLoadingData(true);
    try {
      const fetchedUsers = await getUsers();
      const fetchedVotes = await getVotes();
      const fetchedPosts = await getPosts();
      const fetchedBlockSettings = await getBlockSettings();
      
      setUsers(fetchedUsers.sort((a, b) => a.nombre.localeCompare(b.nombre)));
      setAllVotes(fetchedVotes);
      setAllPosts(fetchedPosts);
      setBlockSettings(fetchedBlockSettings);
    } catch (error) {
      console.error('Error fetching system data:', error);
      setUsers([]);
      setAllVotes([]);
      setAllPosts([]);
      setBlockSettings(getDefaultBlockSettings());
    } finally {
      setIsLoadingData(false);
    }
  }, []);

  useEffect(() => {
    fetchSystemData();
  }, [fetchSystemData]);

  const nonAdminUsers = useMemo(() => users.filter(u => u.curp !== SUPERADMIN_CURP), [users]);

  const totalRegisteredUsers = nonAdminUsers.length;
  const eligibleCandidatesCount = nonAdminUsers.filter(u => u.isRegisteredAsCandidate && u.isEligibleForVoting && u.profilePicUrl).length;
  
  const usersWithVotingRights = nonAdminUsers.filter(u => u.role === UserRole.USER || (u.role === UserRole.CANDIDATE && u.isEligibleForVoting));
  const usersWhoVotedCount = usersWithVotingRights.filter(u => u.votesCast && Object.keys(u.votesCast).length > 0).length;
  const votingParticipationPercentage = usersWithVotingRights.length > 0 
    ? ((usersWhoVotedCount / usersWithVotingRights.length) * 100).toFixed(1) + '%' 
    : '0%';
  const totalVotesInActiveBlocks = useMemo(() => {
    return allVotes.filter(v => blockSettings[v.blockOfCandidacy]?.isActive).length;
  }, [allVotes, blockSettings]);
  const topCandidatesByVotes = useMemo(() => {
    const voteCounts: Record<string, number> = {};
    allVotes.forEach(vote => {
      voteCounts[vote.candidateId] = (voteCounts[vote.candidateId] || 0) + 1;
    });
    return Object.entries(voteCounts)
      .map(([candidateId, count]) => {
        const candidate = users.find(u => u.id === candidateId);
        return {
          id: candidateId,
          name: candidate ? `${candidate.nombre} ${candidate.apellidoPaterno}` : 'Candidato Desconocido',
          value: count,
        };
      })
      .sort((a, b) => b.value - a.value); // Removí el slice para obtener todos los candidatos
  }, [allVotes, users]);

  const topBlocksByParticipation = useMemo(() => {
    const blockVoteCounts: Record<string, number> = {};
    allVotes.forEach(vote => {
       if (blockSettings[vote.blockOfCandidacy]?.isActive) {
            blockVoteCounts[vote.blockOfCandidacy] = (blockVoteCounts[vote.blockOfCandidacy] || 0) + 1;
       }
    });
    return Object.entries(blockVoteCounts)
      .map(([blockName, count]) => ({
        id: blockName,
        name: blockName,
        value: count,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 3);
  }, [allVotes, blockSettings]);

  const systemGeneralInfo = useMemo(() => [
    { id: 'total-users', name: 'Total Usuarios Registrados', value: totalRegisteredUsers },
    { id: 'total-candidates', name: 'Total Candidatos (Registrados)', value: nonAdminUsers.filter(u => u.isRegisteredAsCandidate).length },
    { id: 'total-eligible-candidates', name: 'Total Candidatos (Elegibles y Activos)', value: eligibleCandidatesCount },
    { id: 'total-posts', name: 'Total Publicaciones', value: allPosts.length },
    { id: 'total-votes-cast', name: 'Total Votos Emitidos (Bloques Activos)', value: totalVotesInActiveBlocks },
  ], [totalRegisteredUsers, nonAdminUsers, eligibleCandidatesCount, allPosts.length, totalVotesInActiveBlocks]);  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: resolvedTheme === 'dark' ? '#f1f5f9' : '#0f172a',
          font: { 
            size: 13,
            family: 'Inter, system-ui, sans-serif',
            weight: 500
          },
          padding: 20,
          boxWidth: 14,
          boxHeight: 14,
          borderRadius: 4,
          usePointStyle: true,
          pointStyle: 'rectRounded' as const,
          generateLabels: function(chart: any) {
            const data = chart.data;
            if (data.labels.length && data.datasets.length) {
              return data.labels.map((label: string, i: number) => ({
                text: label,
                fillStyle: data.datasets[0].backgroundColor[i],
                strokeStyle: data.datasets[0].backgroundColor[i],
                lineWidth: 0,
                pointStyle: 'rectRounded',
                hidden: false,
                index: i
              }));
            }
            return [];
          }
        },
      },
      title: { display: false },
      tooltip: {
        backgroundColor: resolvedTheme === 'dark' ? 'rgba(15, 23, 42, 0.98)' : 'rgba(255, 255, 255, 0.98)',
        titleColor: resolvedTheme === 'dark' ? '#f1f5f9' : '#0f172a',
        bodyColor: resolvedTheme === 'dark' ? '#cbd5e1' : '#334155',
        borderColor: resolvedTheme === 'dark' ? 'rgba(165, 127, 44, 0.35)' : 'rgba(97, 18, 50, 0.25)',
        borderWidth: 1,
        padding: 16,
        cornerRadius: 12,
        titleFont: {
          size: 14,
          family: 'Inter, system-ui, sans-serif',
          weight: 600
        },
        bodyFont: {
          size: 13,
          family: 'Inter, system-ui, sans-serif',
          weight: 500
        },
        displayColors: true,
        boxPadding: 6,
        usePointStyle: true,
        callbacks: {
          label: function(context: any) {
            let label = context.dataset.label || '';
            if (label) { label += ': '; }
            if (context.parsed !== null) {
              label += context.parsed.toLocaleString();
              const total = context.dataset.data.reduce((acc: number, val: number) => acc + val, 0);
              const percentage = total > 0 ? ((context.parsed / total) * 100).toFixed(1) + '%' : '0%';
              label += ` (${percentage})`;
            }
            return label;
          }
        }
      },
    },
    cutout: '68%',
    radius: '90%',
    elements: {
      arc: {
        borderWidth: 3,
        borderColor: resolvedTheme === 'dark' ? '#0f172a' : '#ffffff',
        hoverBorderWidth: 4,
        hoverBorderColor: resolvedTheme === 'dark' ? '#1e293b' : '#f8fafc',
        borderAlign: 'inner' as const
      }
    },
    animation: {
      animateRotate: true,
      animateScale: true,
      duration: 1200,
      easing: 'easeInOutQuart' as const
    },
    interaction: {
      intersect: false,
      mode: 'index' as const
    }
  }), [resolvedTheme]);

  const roleDistributionData = useMemo(() => {
    const counts = nonAdminUsers.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {} as Record<UserRole, number>);
    const labels = [UserRole.USER, UserRole.CANDIDATE].filter(role => counts[role] > 0);
    const data = labels.map(role => counts[role] || 0);
    return {
      labels,
      datasets: [{
        label: 'Usuarios por Rol',
        data,
        backgroundColor: currentChartColors.role.slice(0, data.length),
        borderColor: resolvedTheme === 'dark' ? '#1f2937' : '#ffffff',
        borderWidth: 2,
      }],
    };
  }, [nonAdminUsers, currentChartColors, resolvedTheme]);

  const candidatesByBlockData = useMemo(() => {
    const eligibleAndActiveBlockCandidates = nonAdminUsers.filter(u => 
        u.isRegisteredAsCandidate && 
        u.isEligibleForVoting && 
        blockSettings[u.assignedBlock]?.isActive
    );
    const counts = ALL_CANDIDATE_BLOCKS.reduce((acc, block) => {
      acc[block] = eligibleAndActiveBlockCandidates.filter(c => c.assignedBlock === block).length;
      return acc;
    }, {} as Record<CandidateBlock, number>);
    const activeBlockLabels = ALL_CANDIDATE_BLOCKS.filter(block => counts[block] > 0 && blockSettings[block]?.isActive);
    const data = activeBlockLabels.map(block => counts[block] || 0);
    return {
      labels: activeBlockLabels,
      datasets: [{
        label: 'Candidatos Elegibles (Bloques Activos)',
        data,
        backgroundColor: currentChartColors.block.slice(0, data.length),
        borderColor: resolvedTheme === 'dark' ? '#1f2937' : '#ffffff',
        borderWidth: 2,
      }],
    };
  }, [nonAdminUsers, currentChartColors, resolvedTheme, blockSettings]);

  const sexDistributionData = useMemo(() => {
    const counts = nonAdminUsers.reduce((acc, user) => {
      acc[user.sexo] = (acc[user.sexo] || 0) + 1;
      return acc;
    }, {} as Record<UserSex, number>);
    const labels = ALL_USER_SEX.filter(sex => counts[sex] > 0);
    const data = labels.map(sex => counts[sex] || 0);
    return {
      labels,
      datasets: [{
        label: 'Usuarios por Sexo',
        data,
        backgroundColor: currentChartColors.sex.slice(0, data.length),
        borderColor: resolvedTheme === 'dark' ? '#1f2937' : '#ffffff',
        borderWidth: 2,
      }],
    };
  }, [nonAdminUsers, currentChartColors, resolvedTheme]);
  
  const educationLevelData = useMemo(() => {
    const counts = nonAdminUsers.reduce((acc, user) => {
        const level = user.educationalLevel || EducationalLevel.BASICA;
        acc[level] = (acc[level] || 0) + 1;
        return acc;
    }, {} as Record<EducationalLevel, number>);
    const labels = ALL_EDUCATIONAL_LEVELS.filter(level => counts[level] > 0);
    const data = labels.map(level => counts[level] || 0);
     return {
      labels,
      datasets: [{
        label: 'Nivel Educativo',
        data,
        backgroundColor: currentChartColors.education.slice(0, data.length),
        borderColor: resolvedTheme === 'dark' ? '#1f2937' : '#ffffff',
        borderWidth: 2,
      }]
    };
  }, [nonAdminUsers, currentChartColors, resolvedTheme]);

  const loginStatusData = useMemo(() => {
    const loggedIn = nonAdminUsers.filter(u => u.hasLoggedInOnce).length;
    const notLoggedIn = nonAdminUsers.length - loggedIn;
    const labels = [];
    const data = [];
    if (loggedIn > 0) { labels.push('Han Iniciado Sesión'); data.push(loggedIn); }
    if (notLoggedIn > 0) { labels.push('No Han Iniciado Sesión'); data.push(notLoggedIn); }
    
    return {
      labels,
      datasets: [{
        label: 'Estado de Login',
        data,
        backgroundColor: currentChartColors.login.slice(0, data.length),
        borderColor: resolvedTheme === 'dark' ? '#1f2937' : '#ffffff',
        borderWidth: 2,
      }]
    };
  }, [nonAdminUsers, currentChartColors, resolvedTheme]);

  const votingParticipationChartData = useMemo(() => {
    const votedCount = usersWhoVotedCount;
    const notVotedCount = usersWithVotingRights.length - votedCount;
    const labels = [];
    const data = [];
    if (votedCount > 0) { labels.push('Han Votado'); data.push(votedCount); }
    if (notVotedCount > 0) { labels.push('No Han Votado (Elegibles)'); data.push(notVotedCount); }

    return {
      labels,
      datasets: [{
        label: 'Participación Votantes Elegibles',
        data,
        backgroundColor: currentChartColors.voting.slice(0, data.length),
        borderColor: resolvedTheme === 'dark' ? '#1f2937' : '#ffffff',
        borderWidth: 2,
      }]
    };
  }, [usersWhoVotedCount, usersWithVotingRights, currentChartColors, resolvedTheme]);  // Datos para el gráfico de líneas de tendencia de votos por bloque
  const votingTrendData = useMemo(() => {
    // Obtener las fechas de los últimos 7 días
    const today = new Date();
    const labels = Array.from({length: 7}, (_, i) => {
      const date = new Date(today);
      date.setDate(date.getDate() - (6 - i));
      return date.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric' });
    });

    // Crear un mapa de fechas para los últimos 7 días
    const last7Days = Array.from({length: 7}, (_, i) => {
      const date = new Date(today);
      date.setDate(date.getDate() - (6 - i));
      return date.toISOString().split('T')[0]; // Formato YYYY-MM-DD
    });

    // Obtener los bloques con actividad (hasta 5 bloques)
    const blockVoteCounts: Record<string, number> = {};
    allVotes.forEach(vote => {
      if (blockSettings[vote.blockOfCandidacy]?.isActive) {
        blockVoteCounts[vote.blockOfCandidacy] = (blockVoteCounts[vote.blockOfCandidacy] || 0) + 1;
      }
    });

    const activeBlocks = Object.entries(blockVoteCounts)
      .filter(([_, count]) => count > 0) // Solo bloques con actividad
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5) // Hasta 5 bloques
      .map(entry => entry[0]);

    // Para cada bloque activo, inicializar contadores por día
    const blockVotesByDay: Record<string, Record<string, number>> = {};
    
    activeBlocks.forEach(block => {
      blockVotesByDay[block] = {};
      last7Days.forEach(day => {
        blockVotesByDay[block][day] = 0;
      });
    });

    // Agrupar votos por día y bloque
    allVotes.forEach(vote => {
      const voteDate = new Date(vote.timestamp).toISOString().split('T')[0];
      if (last7Days.includes(voteDate) && activeBlocks.includes(vote.blockOfCandidacy)) {
        blockVotesByDay[vote.blockOfCandidacy][voteDate] = (blockVotesByDay[vote.blockOfCandidacy][voteDate] || 0) + 1;
      }
    });    // Enhanced colors for line chart blocks - Theme-aware with better contrast
    const blockColors = resolvedTheme === 'dark' 
      ? [
          { border: '#CDA754', background: 'rgba(205, 167, 84, 0.15)' },   // Gold SpectraUI
          { border: '#fbbf24', background: 'rgba(251, 191, 36, 0.15)' },  // Warm yellow
          { border: '#fb923c', background: 'rgba(251, 146, 60, 0.15)' },  // Orange 
          { border: '#B99340', background: 'rgba(185, 147, 64, 0.15)' },  // Dark gold
          { border: '#fdba74', background: 'rgba(253, 186, 116, 0.15)' }   // Light orange
        ]
      : [
          { border: '#611232', background: 'rgba(97, 18, 50, 0.1)' },     // Maroon SpectraUI
          { border: '#db2777', background: 'rgba(219, 39, 119, 0.1)' },   // Pink complementary
          { border: '#fb923c', background: 'rgba(251, 146, 60, 0.1)' },   // Orange
          { border: '#1e40af', background: 'rgba(30, 64, 175, 0.1)' },    // Blue
          { border: '#047857', background: 'rgba(4, 120, 87, 0.1)' }      // Emerald
        ];

    // Preparar datasets para el gráfico
    const datasets = activeBlocks.map((block, index) => {
      const data = last7Days.map(day => blockVotesByDay[block][day] || 0);
      // Verificar si el bloque tiene algún voto en los últimos 7 días
      const hasVotes = data.some(count => count > 0);
        if (!hasVotes) return null;
        return {
        label: `Bloque ${block}`,
        data,
        borderColor: blockColors[index].border,
        backgroundColor: blockColors[index].background,
        tension: 0.4,
        fill: true,
        pointRadius: 5,
        pointHoverRadius: 8,
        pointBackgroundColor: blockColors[index].border,
        pointBorderColor: resolvedTheme === 'dark' ? '#0f172a' : '#ffffff',
        pointBorderWidth: 3,
        pointHoverBorderWidth: 4,
        borderWidth: 3,
        borderCapStyle: 'round' as const,
        borderJoinStyle: 'round' as const,
        pointStyle: 'circle' as const,
        pointHoverBackgroundColor: blockColors[index].border,
        pointHoverBorderColor: resolvedTheme === 'dark' ? '#1e293b' : '#f8fafc',
        segment: {
          borderColor: (ctx: any) => ctx.p0.parsed.y === 0 ? 'transparent' : blockColors[index].border,
        }
      };
    }).filter(dataset => dataset !== null); // Eliminar bloques sin actividad

    return {
      labels,
      datasets
    };
  }, [allVotes, blockSettings]);  const lineChartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: resolvedTheme === 'dark' ? '#f1f5f9' : '#0f172a',
          font: { 
            size: 13,
            family: 'Inter, system-ui, sans-serif',
            weight: 500
          },
          boxWidth: 16,
          boxHeight: 16,
          padding: 20,
          borderRadius: 4,
          usePointStyle: true,
          pointStyle: 'rectRounded' as const
        },
      },
      title: { 
        display: false
      },
      tooltip: {
        backgroundColor: resolvedTheme === 'dark' ? 'rgba(15, 23, 42, 0.98)' : 'rgba(255, 255, 255, 0.98)',
        titleColor: resolvedTheme === 'dark' ? '#f1f5f9' : '#0f172a',
        bodyColor: resolvedTheme === 'dark' ? '#cbd5e1' : '#334155',
        borderColor: resolvedTheme === 'dark' ? 'rgba(165, 127, 44, 0.35)' : 'rgba(97, 18, 50, 0.25)',
        borderWidth: 1,
        padding: 16,
        cornerRadius: 12,
        titleFont: {
          size: 14,
          family: 'Inter, system-ui, sans-serif',
          weight: 600
        },
        bodyFont: {
          size: 13,
          family: 'Inter, system-ui, sans-serif',
          weight: 500
        },
        displayColors: true,
        boxPadding: 6,
        usePointStyle: true,
        callbacks: {
          label: function(context: any) {
            let label = context.dataset.label || '';
            if (label) { label += ': '; }
            label += context.parsed.y.toLocaleString() + ' votos';
            return label;
          }
        }
      }
    },
    scales: {
      y: {
        min: 0,
        beginAtZero: true,
        ticks: {
          color: resolvedTheme === 'dark' ? '#94a3b8' : '#64748b',
          padding: 12,
          maxTicksLimit: 6,
          precision: 0,
          font: {
            size: 12,
            family: 'Inter, system-ui, sans-serif',
            weight: 500
          },
          callback: function(value: any) {
            return value.toLocaleString();
          }
        },
        grid: {
          color: resolvedTheme === 'dark' ? 'rgba(51, 65, 85, 0.7)' : 'rgba(148, 163, 184, 0.35)',
          drawBorder: false,
          lineWidth: 1,
          drawTicks: false
        },
        border: {
          display: false
        },
        title: {
          display: true,
          text: 'Número de Votos',
          color: resolvedTheme === 'dark' ? '#94a3b8' : '#64748b',
          font: {
            size: 13,
            family: 'Inter, system-ui, sans-serif',
            weight: 600
          },
          padding: 16
        }
      },
      x: {
        ticks: {
          color: resolvedTheme === 'dark' ? '#94a3b8' : '#64748b',
          padding: 12,
          maxRotation: 0,
          autoSkip: true,
          autoSkipPadding: 20,
          font: {
            size: 12,
            family: 'Inter, system-ui, sans-serif',
            weight: 500
          }
        },
        grid: {
          display: false,
        },
        border: {
          display: false
        },
        title: {
          display: true,
          text: 'Últimos 7 días',
          color: resolvedTheme === 'dark' ? '#94a3b8' : '#64748b',
          font: {
            size: 13,
            family: 'Inter, system-ui, sans-serif',
            weight: 600
          },
          padding: 16
        }
      },
    },
    layout: {
      padding: {
        top: 20,
        right: 20,
        bottom: 20,
        left: 20
      }
    },
    elements: {
      line: {
        tension: 0.4,
        borderWidth: 3,
        borderCapStyle: 'round' as const,
        borderJoinStyle: 'round' as const,
        fill: true
      },
      point: {
        radius: 5,
        hoverRadius: 8,
        borderWidth: 3,
        backgroundColor: resolvedTheme === 'dark' ? '#0f172a' : '#ffffff',
        hoverBorderWidth: 4,
        pointStyle: 'circle' as const
      }
    },
    animation: {
      duration: 1400,
      easing: 'easeInOutQuart' as const
    }
  }), [resolvedTheme]);const ModernChartCard: React.FC<{ title: string; data: any; children?: React.ReactNode; type?: 'doughnut' | 'line' }> = ({ 
    title, 
    data, 
    children, 
    type = 'doughnut' 
  }) => {
    const totalValue = type === 'doughnut' 
      ? data.datasets?.[0]?.data?.reduce((acc: number, val: number) => acc + val, 0) || 0
      : data.datasets?.reduce((total: number, dataset: any) => 
          total + dataset.data.reduce((sum: number, value: number) => sum + value, 0), 0) || 0;
    
    const hasData = data.labels?.length > 0 && data.datasets?.length > 0 && 
      (type === 'doughnut' 
        ? data.datasets[0].data.some((d: number) => d > 0)
        : data.datasets.some((dataset: any) => dataset.data.some((d: number) => d > 0)));

    // Calculate statistics for line charts
    const maxValue = type === 'line' && hasData
      ? Math.max(...data.datasets.map((dataset: any) => Math.max(...dataset.data as number[])))
      : type === 'doughnut' && hasData
      ? Math.max(...data.datasets[0].data)
      : 0;

    const activeDatasets = type === 'line' ? data.datasets?.length || 0 : data.labels?.length || 0;

    return (
      <div className="spectra-chart-container spectra-chart-fade-in">
        <div className="spectra-chart-header">
          <h3 className="spectra-chart-title">{title}</h3>
          {hasData && (
            <p className="spectra-chart-subtitle">
              {type === 'doughnut' 
                ? `Total: ${totalValue.toLocaleString()} registros`
                : `${activeDatasets} series de datos activas`
              }
            </p>
          )}
          {children && (
            <div className="mt-2 p-2 bg-gradient-to-r from-primary-maroon/5 to-accent-gold/5 dark:from-accent-gold/5 dark:to-primary-maroon/5 rounded-lg border-l-3 border-primary-maroon dark:border-accent-gold">
              <p className="text-xs text-text-tertiary dark:text-neutral-400 font-medium">{children}</p>
            </div>
          )}
        </div>
        
        <div className={`spectra-chart-canvas ${type === 'doughnut' ? 'spectra-chart-doughnut' : 'spectra-chart-line'}`}>
          {hasData ? (
            <div className={`relative ${type === 'line' ? 'h-80 md:h-96' : 'h-64 md:h-80'}`}>
              {type === 'doughnut' ? (
                <Doughnut data={data} options={chartOptions} />
              ) : (
                <Line data={data} options={lineChartOptions} />
              )}
            </div>
          ) : (
            <div className="spectra-chart-empty">
              <div className="spectra-chart-empty-icon">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              {type === 'line' ? 'No hay datos de tendencia para mostrar' : 'No hay datos para mostrar'}
            </div>
          )}

          {/* Enhanced Statistics Panel */}
          {hasData && (
            <div className="spectra-chart-stats">
              {type === 'doughnut' ? (
                <>
                  <div className="spectra-chart-stat-item">
                    <span className="spectra-chart-stat-value">{data.labels.length}</span>
                    <span className="spectra-chart-stat-label">Categorías</span>
                  </div>
                  <div className="spectra-chart-stat-item">
                    <span className="spectra-chart-stat-value">{totalValue}</span>
                    <span className="spectra-chart-stat-label">Total</span>
                  </div>
                  <div className="spectra-chart-stat-item">
                    <span className="spectra-chart-stat-value">{maxValue}</span>
                    <span className="spectra-chart-stat-label">Máximo</span>
                  </div>
                  <div className="spectra-chart-stat-item">
                    <span className="spectra-chart-stat-value">
                      {Math.round((maxValue / totalValue) * 100)}%
                    </span>
                    <span className="spectra-chart-stat-label">Dominancia</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="spectra-chart-stat-item">
                    <span className="spectra-chart-stat-value">{activeDatasets}</span>
                    <span className="spectra-chart-stat-label">Series Activas</span>
                  </div>
                  <div className="spectra-chart-stat-item">
                    <span className="spectra-chart-stat-value">{totalValue}</span>
                    <span className="spectra-chart-stat-label">Total (7 días)</span>
                  </div>
                  <div className="spectra-chart-stat-item">
                    <span className="spectra-chart-stat-value">{maxValue}</span>
                    <span className="spectra-chart-stat-label">Pico Diario</span>
                  </div>
                  <div className="spectra-chart-stat-item">
                    <span className="spectra-chart-stat-value">
                      {data.labels?.length || 0}
                    </span>
                    <span className="spectra-chart-stat-label">Días</span>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const chartDataToSheetData = (chartLabels: string[], chartData: number[], valueHeader = 'Cantidad', labelHeader = 'Categoría') => {
    const total = chartData.reduce((acc, val) => acc + val, 0);
    return chartLabels.map((label, index) => {
      const value = chartData[index] || 0;
      const percentage = total > 0 ? ((value / total) * 100).toFixed(1) + '%' : '0%';
      return {
        [labelHeader]: label,
        [valueHeader]: value,
        'Porcentaje': percentage,
      };
    });
  };

  const getFormattedDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleDownloadReport = () => {
    if (!window.XLSX) {
      alert("La librería para generar Excel no está disponible.");
      return;
    }
    setIsDownloadingReport(true);

    const wb = window.XLSX.utils.book_new();

    const summaryReportData = [
      { 'Estadística': 'Total Usuarios Registrados', 'Valor': totalRegisteredUsers },
      { 'Estadística': 'Total Candidatos (Registrados)', 'Valor': nonAdminUsers.filter(u => u.isRegisteredAsCandidate).length },
      { 'Estadística': 'Total Candidatos (Elegibles y Activos)', 'Valor': eligibleCandidatesCount },
      { 'Estadística': 'Total Publicaciones', 'Valor': allPosts.length },
      { 'Estadística': 'Total Votos Emitidos (Bloques Activos)', 'Valor': totalVotesInActiveBlocks },
      { 'Estadística': 'Participación Votantes', 'Valor': votingParticipationPercentage },
    ];
    const summarySheet = window.XLSX.utils.json_to_sheet(summaryReportData);
    window.XLSX.utils.book_append_sheet(wb, summarySheet, "Resumen General");

    if (roleDistributionData.labels.length > 0) {
        const roleSheetData = chartDataToSheetData(roleDistributionData.labels, roleDistributionData.datasets[0].data, 'Cantidad', 'Rol');
        const roleSheet = window.XLSX.utils.json_to_sheet(roleSheetData);
        window.XLSX.utils.book_append_sheet(wb, roleSheet, "Usuarios por Rol");
    }
    
    if (candidatesByBlockData.labels.length > 0) {
        const blockSheetData = chartDataToSheetData(candidatesByBlockData.labels, candidatesByBlockData.datasets[0].data, 'Candidatos Elegibles', 'Bloque');
        const blockSheet = window.XLSX.utils.json_to_sheet(blockSheetData);
        window.XLSX.utils.book_append_sheet(wb, blockSheet, "Candidatos por Bloque");
    }

    if (sexDistributionData.labels.length > 0) {
        const sexSheetData = chartDataToSheetData(sexDistributionData.labels, sexDistributionData.datasets[0].data, 'Cantidad', 'Sexo');
        const sexSheet = window.XLSX.utils.json_to_sheet(sexSheetData);
        window.XLSX.utils.book_append_sheet(wb, sexSheet, "Usuarios por Sexo");
    }

    if (educationLevelData.labels.length > 0) {
        const eduSheetData = chartDataToSheetData(educationLevelData.labels, educationLevelData.datasets[0].data, 'Cantidad', 'Nivel Educativo');
        const eduSheet = window.XLSX.utils.json_to_sheet(eduSheetData);
        window.XLSX.utils.book_append_sheet(wb, eduSheet, "Usuarios por Nivel Educ.");
    }

    if (loginStatusData.labels.length > 0) {
        const loginSheetData = chartDataToSheetData(loginStatusData.labels, loginStatusData.datasets[0].data, 'Cantidad', 'Estado Login');
        const loginSheet = window.XLSX.utils.json_to_sheet(loginSheetData);
        window.XLSX.utils.book_append_sheet(wb, loginSheet, "Estado de Login Usuarios");
    }
    
    if (votingParticipationChartData.labels.length > 0) {
        const votingPartSheetData = chartDataToSheetData(votingParticipationChartData.labels, votingParticipationChartData.datasets[0].data, 'Cantidad', 'Participación Votación');
        const votingPartSheet = window.XLSX.utils.json_to_sheet(votingPartSheetData);
        window.XLSX.utils.book_append_sheet(wb, votingPartSheet, "Participación Votación");
    }

    if (topCandidatesByVotes.length > 0) {
        const topCandidatesSheetData = topCandidatesByVotes.map(item => ({ Candidato: item.name, Votos: item.value }));
        const topCandidatesSheet = window.XLSX.utils.json_to_sheet(topCandidatesSheetData);
        window.XLSX.utils.book_append_sheet(wb, topCandidatesSheet, "Top Candidatos (Votos)");
    }
    
    if (topBlocksByParticipation.length > 0) {
        const topBlocksSheetData = topBlocksByParticipation.map(item => ({ Bloque: item.name, Votos: item.value }));
        const topBlocksSheet = window.XLSX.utils.json_to_sheet(topBlocksSheetData);
        window.XLSX.utils.book_append_sheet(wb, topBlocksSheet, "Top Bloques (Votos)");
    }

    const fileName = `Reporte_Estadisticas_Votacion_${getFormattedDate()}.xlsx`;
    window.XLSX.writeFile(wb, fileName);
    setIsDownloadingReport(false);
  };  if (!currentUser || (currentUser.role !== UserRole.SUPERADMIN && currentUser.role !== UserRole.ADMIN)) {
    return <Alert type="error" title="Acceso Denegado" message="Esta sección es solo para Administradores." />;
  }

  return (
    <PermissionGuard section="statistics" requiredLevel="read">
      <PageTitle 
        title="Estadísticas del Sistema" 
        subtitle="Visualiza la distribución y participación de usuarios."
        actions={
          <Button onClick={handleDownloadReport} isLoading={isDownloadingReport} disabled={isLoadingData || isDownloadingReport}>
            <DownloadIcon />
            Descargar Reporte
          </Button>
        }
      />
      {isLoadingData ? (
        <div className="flex justify-center items-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">            <StatsCard 
              title="Total Usuarios Registrados"
              value={totalRegisteredUsers}
              percentage={Math.round((nonAdminUsers.filter(u => u.hasLoggedInOnce).length / (totalRegisteredUsers || 1)) * 100)}
              icon={<UsersIcon />}
            />
            <StatsCard 
              title="Total Votos"
              value={totalVotesInActiveBlocks}
              percentage={Math.round((totalVotesInActiveBlocks / (totalRegisteredUsers || 1)) * 100)}              icon={<VoteIcon />}
            />
            <StatsCard 
              title="Candidatos Elegibles"
              value={nonAdminUsers.filter(u => u.isRegisteredAsCandidate).length}
              percentage={Math.round((nonAdminUsers.filter(u => u.isRegisteredAsCandidate).length / (totalRegisteredUsers || 1)) * 100)}
              icon={<CandidateIcon />}
            />
            <StatsCard 
              title="Participación Votantes"
              value={usersWhoVotedCount}
              percentage={Math.round((usersWhoVotedCount / (totalRegisteredUsers || 1)) * 100)}
              icon={<ParticipationIcon />}
            />          </div>          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8" style={{ height: 'auto', minHeight: '750px' }}>
            <div className="lg:col-span-1 grid grid-cols-1 gap-6 h-full">
              <TopListCard title="Candidatos con Más Votos" items={topCandidatesByVotes} emptyText="Aún no hay votos registrados."/>
              <TopListCard title="Resumen General del Sistema" items={systemGeneralInfo} />
            </div>            <div className="lg:col-span-2 h-full flex flex-col">
              <ModernChartCard 
                title="Tendencia de Votos por Bloque" 
                data={votingTrendData} 
                type="line"
              >
                Muestra hasta 5 bloques con actividad en los últimos 7 días
              </ModernChartCard>
            </div>
          </div>          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            <ModernChartCard title="Usuarios por Rol" data={roleDistributionData} />
            <ModernChartCard title="Candidatos Elegibles por Bloque (Activos)" data={candidatesByBlockData}>
               Considera candidatos registrados, elegibles y en bloques activos.
            </ModernChartCard>
            <ModernChartCard title="Usuarios por Sexo" data={sexDistributionData} />
            <ModernChartCard title="Usuarios por Nivel Educativo" data={educationLevelData} />
            <ModernChartCard title="Usuarios por Estado de Login" data={loginStatusData}>
              Usuarios que han iniciado sesión al menos una vez.
            </ModernChartCard>
            <ModernChartCard title="Participación en Votación" data={votingParticipationChartData}>
              Usuarios (USER y CANDIDATE elegibles) que han emitido al menos un voto.
            </ModernChartCard>          </div>
        </div>
      )}
    </PermissionGuard>
  );
};

export default AdminStatisticsPage;

interface RankingItemProps {
  position: number;
  name: string;
  value: number;
  maxValue: number;
  isExpanded?: boolean;
}

const RankingItem: React.FC<RankingItemProps> = ({ position, name, value, maxValue, isExpanded }) => {
  const percentage = (value / maxValue) * 100;
  
  return (
    <div className={`relative flex items-center space-x-3 p-2 ${isExpanded ? 'hover:bg-neutral-50 dark:hover:bg-neutral-800/50' : ''} rounded-lg transition-colors`}>
      <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-custom-pink/10 dark:bg-custom-gold/10">
        <span className="text-sm font-semibold text-custom-pink dark:text-custom-gold">#{position}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="relative pt-1 flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-text-secondary dark:text-neutral-300 truncate" title={name}>
              {name}
            </span>
            <span className="text-sm font-semibold text-custom-pink dark:text-custom-gold ml-2">
              {value} votos
            </span>
          </div>
          <div className="h-2 rounded-full bg-neutral-200 dark:bg-neutral-700">
            <div
              className="h-2 rounded-full bg-custom-pink dark:bg-custom-gold transition-all duration-500"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

interface FullRankingModalProps {
  isOpen: boolean;
  onClose: () => void;
  rankings: TopListItem[];
}

const FullRankingModal: React.FC<FullRankingModalProps> = ({ isOpen, onClose, rankings }) => {
  if (!isOpen) return null;

  const maxValue = Math.max(...rankings.map(item => Number(item.value)));

  const modalContent = (
    <div className="fixed inset-0 z-[9999] overflow-y-auto" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
      <div className="flex items-center justify-center min-h-screen p-4">
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" 
          onClick={onClose} 
          style={{ position: 'fixed', zIndex: 9998 }} 
        />
        <div 
          className="relative bg-white dark:bg-neutral-900 rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden" 
          style={{ position: 'relative', zIndex: 9999 }}
        >
          <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-800">
            <h3 className="text-lg font-semibold text-text-primary dark:text-custom-gold">
              Ranking Completo de Candidatos
            </h3>
            <button
              onClick={onClose}
              className="text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="p-6 overflow-y-auto max-h-[calc(80vh-129px)]">
            <div className="space-y-3">
              {rankings.map((item, index) => (
                <RankingItem
                  key={item.id}
                  position={index + 1}
                  name={item.name}
                  value={Number(item.value)}
                  maxValue={maxValue}
                  isExpanded={true}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Usar portal para renderizar el modal en el body
  return ReactDOM.createPortal(modalContent, document.body);
};
