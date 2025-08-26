import React, { useState, useEffect } from 'react';
import { Anime, AnimeBase, AnimeRelationEdge, AnimeRecommendationNode } from '../types';
import { getAnimeDetails } from '../services/anilistService';
import { ArrowLeftIcon, TvIcon } from './icons';

type DateInfo = { year: number; month: number; day: number } | null;

const formatDate = (date: DateInfo) => {
    if (!date || !date.year) return null;
    return new Date(date.year, (date.month || 1) - 1, date.day || 1).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric'
    });
};

const formatAiredDate = (startDate: DateInfo, endDate: DateInfo) => {
    const start = formatDate(startDate);
    const end = formatDate(endDate);
    if (start && end) return `${start} to ${end}`;
    if (start) return start;
    return 'TBA';
};

const formatSeason = (season: string | null, year: number | null) => {
    if (!season || !year) return null;
    return `${season.charAt(0).toUpperCase() + season.slice(1).toLowerCase()} ${year}`;
}

const formatStatus = (status: string | null) => {
    if(!status) return null;
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

const RelatedCard: React.FC<{
    anime: AnimeBase;
    onNavigate: (anime: Anime) => void;
    children?: React.ReactNode;
}> = ({ anime, onNavigate, children }) => {
    const handleNavigate = () => {
        // Construct a partial Anime object to satisfy the type for navigation
        const partialAnime: Partial<Anime> & Pick<Anime, 'id' | 'title' | 'coverImage'> = {
            id: anime.id,
            title: anime.title,
            coverImage: anime.coverImage,
        };
        onNavigate(partialAnime as Anime);
    };

    const coverImageUrl = anime.coverImage?.extraLarge;
    const title = anime.title.english || anime.title.romaji;

    return (
        <div 
            className="flex flex-col gap-2 cursor-pointer group"
            onClick={handleNavigate}
        >
            {coverImageUrl ? (
                <img 
                    src={coverImageUrl} 
                    alt={title} 
                    className="w-full h-auto rounded-md shadow-lg aspect-[2/3] object-cover transition-transform duration-300 group-hover:scale-105"
                />
            ) : (
                <div className="w-full bg-slate-800 rounded-md shadow-lg aspect-[2/3] flex items-center justify-center">
                    <TvIcon className="w-8 h-8 text-slate-600" />
                </div>
            )}
            <div className="text-center">
                <h4 className="text-sm font-semibold text-white truncate group-hover:whitespace-normal group-hover:line-clamp-2" title={title}>
                    {title}
                </h4>
                {children}
            </div>
        </div>
    );
};

const RelationsTab: React.FC<{ relations: { edges: AnimeRelationEdge[] }, onNavigate: (anime: Anime) => void }> = ({ relations, onNavigate }) => {
    if (!relations?.edges?.length) {
        return <p className="text-brand-text-muted">No relations found for this anime.</p>;
    }
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-4 gap-y-6">
            {relations.edges.map(edge => (
                <RelatedCard key={`${edge.relationType}-${edge.node.id}`} anime={edge.node} onNavigate={onNavigate}>
                    <p className="text-xs text-brand-text-muted capitalize">{edge.relationType.replace(/_/g, ' ').toLowerCase()}</p>
                </RelatedCard>
            ))}
        </div>
    );
};

const RecommendationsTab: React.FC<{ recommendations: { nodes: AnimeRecommendationNode[] }, onNavigate: (anime: Anime) => void }> = ({ recommendations, onNavigate }) => {
    if (!recommendations?.nodes?.length) {
        return <p className="text-brand-text-muted">No recommendations found for this anime.</p>;
    }
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-4 gap-y-6">
            {recommendations.nodes.map(node => (
                <RelatedCard key={node.mediaRecommendation.id} anime={node.mediaRecommendation} onNavigate={onNavigate}>
                    <p className="text-xs text-brand-text-muted">Recommended by {node.rating} users</p>
                </RelatedCard>
            ))}
        </div>
    );
};


export const AnimeDetail: React.FC<{
    anime: Anime;
    onClose: () => void;
    onNavigate: (anime: Anime) => void;
}> = ({ anime: initialAnime, onClose, onNavigate }) => {
    const [detailedAnime, setDetailedAnime] = useState<Anime | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState('summary');

    useEffect(() => {
        const fetchDetails = async () => {
            setIsLoading(true);
            setError(null);
            setDetailedAnime(null); // Clear previous details
            try {
                const data = await getAnimeDetails(initialAnime.id);
                setDetailedAnime(data);
            } catch (err) {
                setError("Could not load details for this anime.");
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDetails();
        // Reset tab to summary when anime changes
        setActiveTab('summary');
    }, [initialAnime.id]);

    const anime = detailedAnime || initialAnime;
    const title = anime.title.english || anime.title.romaji;
    const romajiTitle = anime.title.romaji;
    
    const coverImageUrl = anime.coverImage?.extraLarge;
    const bannerImageUrl = anime.bannerImage || coverImageUrl;

    const metadata = [
        { label: 'Japanese', value: anime.title.native },
        { label: 'Type', value: anime.type },
        { label: 'Episodes', value: anime.episodes },
        { label: 'Status', value: formatStatus(anime.status), colorClass: 'text-brand-accent' },
        { label: 'Duration', value: anime.duration ? `${anime.duration} min` : null },
        { label: 'Aired', value: formatAiredDate(anime.startDate, anime.endDate) },
        { label: 'Season', value: formatSeason(anime.season, anime.seasonYear), colorClass: 'text-brand-accent' },
        { label: 'Studio', value: anime.studios?.nodes?.[0]?.name },
    ];

    return (
        <div className="text-brand-text relative animate-fade-in">
            <div className="absolute top-4 left-4 z-30">
                <button 
                    onClick={onClose} 
                    className="bg-black/50 p-2 rounded-full hover:bg-black/80 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-accent"
                    aria-label="Go back to search results"
                >
                    <ArrowLeftIcon className="w-6 h-6" />
                </button>
            </div>

            <div className="h-56 md:h-80 w-full relative">
                {bannerImageUrl ? (
                    <img src={bannerImageUrl} alt={`${title} banner`} className="w-full h-full object-cover opacity-40" />
                ) : (
                    <div className="w-full h-full bg-slate-900" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-brand-bg-dark via-brand-bg-dark/70 to-transparent"></div>
            </div>

            <main className="relative z-10 -mt-24 md:-mt-36 px-4 pb-8">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-6 md:gap-8">
                    <aside className="w-full md:w-1/4 flex-shrink-0">
                        {coverImageUrl ? (
                            <img src={coverImageUrl} alt={title} className="w-full h-auto rounded-lg shadow-2xl aspect-[2/3]" />
                        ) : (
                            <div className="w-full bg-slate-800 rounded-lg shadow-2xl aspect-[2/3] flex items-center justify-center">
                                <TvIcon className="w-16 h-16 text-slate-600" />
                            </div>
                        )}
                    </aside>

                    <section className="w-full md:w-3/4 text-left">
                        <h1 className="text-3xl md:text-5xl font-bold">{title}</h1>
                        {title !== romajiTitle && <h2 className="text-lg md:text-xl text-brand-text-muted mb-4">{romajiTitle}</h2>}
                        
                        <div className="border-b border-slate-700 mt-4 mb-4">
                            <nav className="flex space-x-6">
                                {['Summary', 'Relations', 'Recommendations'].map(tabName => (
                                    <button
                                        key={tabName}
                                        onClick={() => setActiveTab(tabName.toLowerCase())}
                                        className={`pb-2 text-base font-semibold border-b-2 transition-colors ${activeTab === tabName.toLowerCase() ? 'border-brand-accent text-white' : 'border-transparent text-brand-text-muted hover:text-white'}`}
                                    >
                                        {tabName}
                                    </button>
                                ))}
                            </nav>
                        </div>
                        
                        <div className="flex flex-col lg:flex-row gap-6 md:gap-8">
                            <div className="lg:w-2/3">
                                {isLoading ? (
                                    <p className="text-brand-text-muted">Loading details...</p>
                                ) : error ? (
                                    <p className="text-red-400">{error}</p>
                                ) : (
                                    <>
                                        {activeTab === 'summary' && (
                                            <p className="text-brand-text-muted whitespace-pre-wrap leading-relaxed" dangerouslySetInnerHTML={{ __html: anime.description?.replace(/<br\s*\/?>/gi, '\n') || 'No summary available.' }}></p>
                                        )}
                                        {activeTab === 'relations' && anime.relations && <RelationsTab relations={anime.relations} onNavigate={onNavigate} />}
                                        {activeTab === 'recommendations' && anime.recommendations && <RecommendationsTab recommendations={anime.recommendations} onNavigate={onNavigate} />}
                                    </>
                                )}
                            </div>

                            <aside className="lg:w-1/3 space-y-2 text-sm">
                                {metadata.map(item => item.value ? (
                                    <div key={item.label}>
                                        <span className="font-bold text-white">{item.label}:</span>
                                        <span className={`text-brand-text-muted ml-2 ${item.colorClass || ''}`}>{item.value}</span>
                                    </div>
                                ) : null)}

                                {anime.externalLinks && anime.externalLinks.length > 0 && (
                                    <div>
                                        <span className="font-bold text-white">External Links:</span>
                                        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
                                            {anime.externalLinks.map(link => (
                                                <a href={link.url} target="_blank" rel="noopener noreferrer" key={link.site} className="text-brand-accent hover:underline">{link.site}</a>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                
                                {anime.genres && anime.genres.length > 0 && (
                                    <>
                                        <hr className="border-slate-700 !my-4"/>
                                        <div className="flex flex-wrap gap-2">
                                            {anime.genres.map(genre => (
                                                <span key={genre} className="bg-brand-secondary text-white text-xs font-semibold px-3 py-1 rounded-full">{genre}</span>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </aside>
                        </div>
                    </section>
                </div>
            </main>
        </div>
    );
};