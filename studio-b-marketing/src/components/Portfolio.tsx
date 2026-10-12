import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '../firebase';
import { ArrowUpRight, Eye, Sparkles } from 'lucide-react';
import { ProjectItem } from '../types/project';

export const Portfolio: React.FC = () => {
  const [highlightedProjects, setHighlightedProjects] = useState<ProjectItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'projects'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docsData: ProjectItem[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as ProjectItem));

      // Filter: status = 'Publicado' AND highlightHome = true
      const featured = docsData.filter(p => {
        const isPublished = p.status === 'Publicado' || (p as any).status === undefined;
        const isHighlight = p.highlightHome === true || (p as any).highlightHome === 'Sim';
        return isPublished && isHighlight;
      });

      // Sort by order
      featured.sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));

      setHighlightedProjects(featured);
      setLoading(false);
    }, (err) => {
      console.error("Erro ao carregar cases em destaque da Home:", err);
      setHighlightedProjects([]);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <section id="portfolio" className="py-24 bg-[#F3EDE0] text-[#43210D] border-t border-[#CE892C]/30 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-14 pb-6 border-b border-[#CE892C]/30">
          <div>
            <span className="px-3.5 py-1 rounded-full bg-[#E17541] text-white text-xs font-bold uppercase tracking-wider mb-4 inline-block font-sans shadow-sm">
              PORTFÓLIO EM DESTAQUE
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-[#43210D] tracking-tight font-heading">
              Projetos Selecionados. <span className="text-[#E17541]">Ideias que Ganharam Vida.</span>
            </h2>
          </div>

          <Link
            to="/cases"
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#E17541] hover:text-[#43210D] transition-colors mt-4 md:mt-0 font-sans"
          >
            <span>VER TODOS OS CASES</span>
            <ArrowUpRight size={16} />
          </Link>
        </div>

        {/* Featured Projects Grid */}
        {loading ? (
          <div className="text-center py-12 text-xs font-bold font-sans uppercase tracking-wider text-[#43210D]/60">
            Carregando destaques...
          </div>
        ) : highlightedProjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {highlightedProjects.map((project) => {
              const targetSlug = project.slug || project.id;

              return (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="group bg-white rounded-3xl overflow-hidden border-2 border-[#CE892C]/30 hover:border-[#FFC400] transition-all flex flex-col justify-between shadow-sm hover:shadow-xl"
                >
                  <div>
                    {/* Cover Image */}
                    <div className="h-60 relative overflow-hidden bg-[#43210D]">
                      {project.imageUrl ? (
                        <img
                          src={project.imageUrl}
                          alt={project.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-90 group-hover:opacity-100"
                          referrerPolicy="no-referrer"
                          onError={(event) => { event.currentTarget.style.display = 'none'; }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[#FFC400]/40 font-heading font-extrabold text-sm">
                          STUDIO B MARKETING
                        </div>
                      )}

                      {/* Category Badge */}
                      {project.category && (
                        <div className="absolute top-4 left-4">
                          <span className="bg-[#43210D] text-[#FFC400] text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider font-sans border border-[#FFC400]/40 shadow-sm">
                            {project.category}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-6">
                      {project.client && (
                        <p className="text-[11px] font-extrabold text-[#E17541] uppercase tracking-wider mb-1 font-sans">
                          {project.client}
                        </p>
                      )}

                      <h3 className="text-xl font-extrabold text-[#43210D] mb-3 font-heading leading-tight group-hover:text-[#E17541] transition-colors">
                        {project.title}
                      </h3>

                      {(project.shortDescription || project.fullDescription) && (
                        <p className="text-[#43210D]/80 text-xs sm:text-sm font-sans font-medium leading-relaxed line-clamp-3">
                          {project.shortDescription || project.fullDescription}
                        </p>
                      )}

                      {/* Tags */}
                      {project.tags && project.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-4">
                          {project.tags.map((tag, tIdx) => (
                            <span key={tIdx} className="text-[10px] font-bold font-sans text-[#E17541] bg-[#F3EDE0] px-2.5 py-0.5 rounded-md border border-[#CE892C]/20">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Link */}
                  <div className="px-6 pb-6 pt-2">
                    <Link
                      to={`/cases/${targetSlug}`}
                      className="w-full py-3.5 rounded-xl bg-[#F3EDE0] hover:bg-[#FFC400] text-[#43210D] font-extrabold text-xs uppercase tracking-wider transition-all duration-300 font-sans flex items-center justify-center gap-2 border border-[#CE892C]/30 cursor-pointer shadow-sm"
                    >
                      <Eye size={16} />
                      <span>VER DETALHES DO CASE</span>
                    </Link>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : null}

        {/* Global Action Link */}
        <div className="text-center">
          <Link
            to="/cases"
            className="inline-flex items-center justify-center gap-3 px-9 py-4.5 rounded-full bg-[#43210D] text-[#FFC400] hover:bg-[#FFC400] hover:text-[#43210D] transition-all duration-300 font-extrabold text-xs sm:text-sm uppercase tracking-wider font-sans shadow-xl border border-[#FFC400]/40 hover:border-[#43210D] hover:scale-105"
          >
            <span>CONHECER TODOS OS CASES</span>
            <ArrowUpRight size={18} />
          </Link>
        </div>

      </div>
    </section>
  );
};
