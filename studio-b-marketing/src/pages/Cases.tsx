import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { motion } from 'motion/react';
import { Eye, FolderKanban, ArrowUpRight, ArrowRight, Sparkles } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { ProjectItem } from '../types/project';

interface CasesProps {
  onOpenModal: () => void;
}

export const Cases: React.FC<CasesProps> = ({ onOpenModal }) => {
  const [activeCategory, setActiveCategory] = useState<string>('TODOS');
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const categories = [
    'TODOS',
    'BRANDING',
    'SOCIAL MEDIA',
    'WEB',
    'TELECOM & TECH',
    'OUTROS SEGMENTOS'
  ];

  useEffect(() => {
    // Real-time listener for Firestore projects
    const q = query(collection(db, 'projects'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docsData: ProjectItem[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as ProjectItem));

      // Rule: Somente projetos com status "Publicado" devem aparecer no site público
      const publishedOnly = docsData.filter(p => p.status === 'Publicado' || (p as any).status === undefined);
      
      // Sort by order ascending
      publishedOnly.sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));

      setProjects(publishedOnly);
      setLoading(false);
    }, (error) => {
      console.error("Erro ao carregar projetos do Firestore:", error);
      setProjects([]);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Filter projects by activeCategory safely
  const filteredProjects = projects.filter(p => {
    if (activeCategory === 'TODOS') return true;
    
    const cat = (p.category || '').toUpperCase().trim();
    const seg = (p.segment || '').toUpperCase().trim();
    const tags = Array.isArray(p.tags) ? p.tags.map(t => t.toUpperCase()) : [];

    if (activeCategory === 'BRANDING') {
      return cat.includes('BRANDING') || seg.includes('BRANDING') || tags.some(t => t.includes('BRANDING') || t.includes('MARCA'));
    }
    if (activeCategory === 'SOCIAL MEDIA') {
      return cat.includes('SOCIAL') || cat.includes('REDES') || seg.includes('SOCIAL') || tags.some(t => t.includes('SOCIAL') || t.includes('REELS'));
    }
    if (activeCategory === 'WEB') {
      return cat.includes('WEB') || cat.includes('UI') || seg.includes('WEB') || tags.some(t => t.includes('WEB') || t.includes('UI') || t.includes('SITE'));
    }
    if (activeCategory === 'TELECOM & TECH') {
      return cat.includes('TELECOM') || cat.includes('TECH') || cat.includes('ISP') || seg.includes('TELECOM') || seg.includes('TECH') || tags.some(t => t.includes('TELECOM') || t.includes('TECH') || t.includes('FIBRA'));
    }
    if (activeCategory === 'OUTROS SEGMENTOS') {
      return cat.includes('OUTROS') || seg.includes('OUTROS') || (!cat.includes('BRANDING') && !cat.includes('SOCIAL') && !cat.includes('WEB') && !cat.includes('TELECOM'));
    }

    return cat === activeCategory;
  });

  return (
    <div className="pt-28 pb-16 bg-[#F3EDE0] text-[#43210D] min-h-screen">
      
      {/* Header / Hero Banner */}
      <section className="px-6 py-16 sm:py-20 border-b border-[#CE892C]/30 bg-gradient-to-b from-[#F3EDE0] to-white/50">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="px-4 py-1.5 rounded-full bg-[#E17541] text-white text-xs font-extrabold uppercase tracking-widest inline-block font-sans mb-4 shadow-sm">
              PORTFÓLIO // CASES SELECIONADOS
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-6xl font-extrabold text-[#43210D] tracking-tight font-heading mb-6"
          >
            Projetos selecionados. <span className="text-[#E17541]">Ideias que ganharam vida.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-base sm:text-lg text-[#43210D]/80 font-sans font-medium max-w-2xl mx-auto"
          >
            Conheça alguns dos projetos desenvolvidos pelo Studio B Marketing através de estratégia, design e comunicação.
          </motion.p>
        </div>
      </section>

      {/* Main Content Section */}
      <section className="py-16 px-6">
        <div className="max-w-7xl mx-auto">
          
          {/* Category Filters Toolbar */}
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-12">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-5 py-2.5 rounded-full text-xs font-extrabold uppercase tracking-wider transition-all duration-300 font-sans border cursor-pointer ${
                  activeCategory === cat
                    ? 'bg-[#43210D] text-[#FFC400] border-[#FFC400] shadow-md scale-105'
                    : 'bg-white/80 text-[#43210D]/80 border-[#CE892C]/30 hover:bg-white hover:border-[#CE892C]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Loading Indicator */}
          {loading ? (
            <div className="text-center py-20 flex flex-col items-center justify-center">
              <div className="w-10 h-10 border-4 border-[#CE892C] border-t-transparent rounded-full animate-spin mb-3"></div>
              <p className="font-sans text-xs font-extrabold uppercase tracking-widest text-[#43210D]/60">
                Carregando cases...
              </p>
            </div>
          ) : projects.length === 0 ? (
            /* Empty State when NO published projects exist */
            <div className="bg-white border-2 border-[#CE892C]/30 rounded-3xl p-12 sm:p-16 text-center max-w-3xl mx-auto shadow-sm">
              <div className="w-16 h-16 bg-[#F3EDE0] rounded-2xl flex items-center justify-center mx-auto mb-4 border border-[#CE892C]/30 text-[#E17541]">
                <FolderKanban size={32} />
              </div>
              <h3 className="text-2xl font-extrabold font-heading text-[#43210D] mb-2">
                Nenhum projeto publicado no momento.
              </h3>
              <p className="text-sm text-[#43210D]/70 font-sans font-medium max-w-md mx-auto mb-8">
                Novos cases serão adicionados em breve.
              </p>
              <button
                onClick={onOpenModal}
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-[#43210D] text-[#FFC400] hover:bg-[#FFC400] hover:text-[#43210D] transition-all font-extrabold text-xs uppercase tracking-wider font-sans cursor-pointer shadow-md"
              >
                <span>SOLICITAR ORÇAMENTO OU APRESENTAÇÃO</span>
                <ArrowUpRight size={16} />
              </button>
            </div>
          ) : filteredProjects.length === 0 ? (
            /* Empty state for specific category filter with no matches */
            <div className="bg-white border-2 border-[#CE892C]/30 rounded-3xl p-12 text-center max-w-2xl mx-auto shadow-sm">
              <Sparkles size={36} className="mx-auto text-[#E17541] mb-3" />
              <h3 className="text-xl font-extrabold font-heading text-[#43210D] mb-2">
                Nenhum case cadastrado na categoria "{activeCategory}"
              </h3>
              <p className="text-xs text-[#43210D]/70 font-sans mb-6">
                Tente escolher outra categoria ou navegue por "TODOS" para ver todo o nosso portfólio.
              </p>
              <button
                onClick={() => setActiveCategory('TODOS')}
                className="px-6 py-2.5 rounded-full bg-[#43210D] text-[#FFC400] font-extrabold text-xs uppercase tracking-wider font-sans hover:bg-[#E17541] hover:text-white transition-all"
              >
                VER TODOS OS CASES
              </button>
            </div>
          ) : (
            /* Projects Cards Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredProjects.map((project) => {
                const targetSlug = project.slug || project.id;

                return (
                  <motion.div 
                    layout
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={project.id}
                    className="group bg-white rounded-3xl overflow-hidden border-2 border-[#CE892C]/30 hover:border-[#FFC400] transition-all flex flex-col justify-between shadow-sm hover:shadow-xl"
                  >
                    <div>
                      {/* Project Cover Image */}
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

                        {/* Client Badge (if present) */}
                        {project.client && (
                          <div className="absolute top-4 right-4">
                            <span className="bg-[#E17541] text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider font-sans shadow-sm">
                              {project.client}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Project Content Body */}
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

                    {/* Card Footer Button */}
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
          )}

        </div>
      </section>

      {/* CTA Bottom Banner */}
      <section className="py-16 px-6 bg-[#43210D] text-[#F3EDE0] mt-12">
        <div className="max-w-4xl mx-auto text-center">
          <span className="px-3.5 py-1 rounded-full bg-[#FFC400] text-[#43210D] text-xs font-extrabold uppercase tracking-widest inline-block font-sans mb-4">
            SUA MARCA É O PRÓXIMO CASE
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold font-heading text-[#F3EDE0] mb-4">
            Pronto para transformar sua comunicação visual?
          </h2>
          <p className="text-sm sm:text-base text-[#F3EDE0]/80 font-sans font-medium mb-8 max-w-xl mx-auto">
            Agende um diagnóstico com nossos estrategistas e receba uma análise do posicionamento do seu negócio.
          </p>
          <button
            onClick={onOpenModal}
            className="px-8 py-4 rounded-full bg-[#FFC400] text-[#43210D] hover:bg-white transition-all font-extrabold text-xs sm:text-sm uppercase tracking-wider inline-flex items-center gap-2 shadow-xl cursor-pointer font-sans"
          >
            <span>CRIAR MEU CASE DE SUCESSO</span>
            <ArrowUpRight size={18} />
          </button>
        </div>
      </section>

    </div>
  );
};
