
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Navigate, Link } from 'react-router-dom';
import { User, Post } from '../types';
import { getUserByCurp, getPostsByCandidate, updatePostReactions } from '../services/databaseService';
import { ProfileCard } from '../components/profile/ProfileComponents';
import { PostList } from '../components/post/PostComponents';
import { PageTitle, LoadingSpinner, Card, Alert, Button } from '../components/common/CommonComponents';
import { useAuth } from '../contexts/AuthContext';
import { ROUTES } from '../constants';

const CandidatePublicProfilePage: React.FC = () => {
  const { candidateId } = useParams<{ candidateId: string }>();
  const { currentUser } = useAuth();
  const [candidate, setCandidate] = useState<User | null | undefined>(undefined); 
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [alertMessage, setAlertMessage] = useState<{type: 'success'|'error'|'info', text: string} | null>(null);
  const fetchCandidateData = useCallback(async () => {
    if (!candidateId) {
      setCandidate(null);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setTimeout(async () => {
        const foundCandidate = await getUserByCurp(candidateId);
        if (foundCandidate && foundCandidate.isRegisteredAsCandidate && foundCandidate.hasLoggedInOnce) {
        setCandidate(foundCandidate);
        // Posts fetched here will not have transientVideoFile
        setPosts(await getPostsByCandidate(candidateId));
        } else {
        setCandidate(null); 
        }
        setIsLoading(false);
    }, 300);
  }, [candidateId]);

  useEffect(() => {
    fetchCandidateData();
  }, [fetchCandidateData]);
  const handlePostReaction = async (postId: string, reactionType: 'like' | 'dislike') => {
    if (!currentUser) {
      setAlertMessage({type: 'info', text: "Debes iniciar sesión para reaccionar a las publicaciones."});
      setTimeout(() => setAlertMessage(null), 3000);
      return;
    }
    const updatedPost = await updatePostReactions(postId, currentUser.id, reactionType);
    if (updatedPost) {
      // Ensure transientVideoFile is preserved if it somehow existed (though unlikely for this page)
      setPosts(prevPosts => prevPosts.map(p => p.id === postId ? { ...updatedPost, transientVideoFile: p.transientVideoFile || updatedPost.transientVideoFile } : p));
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (candidate === null) {
    return (
        <div className="text-center py-10">
            <PageTitle title="Candidato No Encontrado" />
            <p className="text-text-secondary dark:text-neutral-400">El perfil del candidato que buscas no existe, no es un candidato válido, o aún no ha iniciado sesión en el sistema.</p>
            <Link to={ROUTES.VIEW_CANDIDATES} className="mt-6">
                <Button variant="secondary">Volver a la lista de candidatos</Button>
            </Link>
        </div>
    );
  }
  
  if(!candidate) return <Navigate to={ROUTES.VIEW_CANDIDATES} replace />; 
  return (
    <div className="space-y-8">
      {alertMessage && <Alert type={alertMessage.type} message={alertMessage.text} onClose={() => setAlertMessage(null)} className="mb-6"/>}
      <PageTitle 
        title={`Perfil de ${candidate.nombre} ${candidate.apellidoPaterno}`} 
        subtitle={`Propuestas y actividad de ${candidate.assignedBlock}`} 
      />
      
      {!candidate.profilePicUrl && (
        <Alert type="warning" title="Perfil Incompleto" message="Este candidato aún no ha subido su foto de perfil. Las publicaciones están visibles, pero no se puede votar por él/ella hasta que complete su perfil." />
      )}      {/* Three-column layout: 1 column for profile, 2 columns for publications */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left column - Profile Information (1/3 width) */}
        <div className="w-full">
          <ProfileCard user={candidate} isPublicView={true} />
        </div>

        {/* Right columns - Publications (2/3 width) */}
        <div className="w-full lg:col-span-2">
          <Card title="Publicaciones del Candidato">
            {posts.length > 0 ? (
              <PostList posts={posts} onReaction={handlePostReaction} currentUserId={currentUser?.id}/>
            ) : (
              <p className="text-text-secondary dark:text-neutral-400 text-center py-6">Este candidato aún no ha realizado ninguna publicación.</p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CandidatePublicProfilePage;
