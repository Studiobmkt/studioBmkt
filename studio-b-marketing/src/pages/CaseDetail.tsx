import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  ArrowUpRight, 
  CheckCircle2, 
  ExternalLink, 
  Sparkles, 
  Tag, 
  Building2, 
  Layers,
  X,
  ChevronRight
} from 'lucide-react';
import { ProjectItem } from '../types/project';

interface CaseDetailProps {
  onOpenModal: () => void;
}

export const CaseDetail: React.FC<CaseDetailProps> = ({ onOpenModal }) => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<ProjectItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState<string | null>(null);

  useEffect(() => {
    const fetchProject = async () => {
      if (!slug) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        // Try searching by slug first
        const q = query(collection(db, 'projects'), where('slug', '==', slug));
        const snap = await getDocs(q);

        if (!snap.empty) {
          const docData = snap.docs[0];
          const data = { id: docData.id, ...docData.data() } as ProjectItem;
          // Only show if Published
          if (data.status === 'Publicado' || (data as any).status === undefined) {
            setProject(data);
          } else {
            setProject(null);
          }
        } else {
          // Fallback search by doc ID if slug is doc ID
          const docRef = doc(db, 'projects', slug);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = { id: docSnap.id, ...docSnap.data() } as ProjectItem;
            if (data.status === 'Publicado' || (data as any).status === undefined) {
              setProject(data);
            } else {
              setProject(null);
            }
          } else {
            setProject(null);
          }
        }
      } catch (error) {
        console.error("Erro ao carregar detalhes do case:", error);
        setProject(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen pt-32 pb-20 bg-[#F3EDE0] text-[#43210D] flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#CE892C] border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="font-sans text-xs font-extrabold uppercase tracking-widest text-[#43210D]/60">
          Carregando informações do case...
        </p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen pt-32 pb-20 bg-[#F3EDE0] text-[#43210D] flex flex-col items-center justify-center px-6">
        <div className="max-w-md w-full bg-white border-2 border-[#CE892C]/30 p-8 rounded-3xl text-center shadow-lg">
          <div className="w-16 h-16 bg-[#F3EDE0] rounded-2xl flex items-center justify-center mx-auto mb-4 border border-[#CE892C]/30 text-[#E17541]">
            <Sparkles size={32} />
          </div>
          <h2 className="text-2xl font-extrabold font-heading text-[#43210D] mb-2">
            Case não encontrado
          </h2>
          <p className="text-xs text-[#43210D]/70 font-sans font-medium mb-6">
            O projeto solicitado não foi localizado ou ainda não foi publicado.
          </p>
          <Link
            to="/cases"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#43210D] text-[#FFC400] font-extrabold text-xs uppercase tracking-wider font-sans hover:bg-[#FFC400] hover:text-[#43210D] transition-all"
          >
            <ArrowLeft size={16} />
            <span>Voltar para Portfólio</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-28 pb-20 bg-[#F3EDE0] text-[#43210D] min-h-screen">
      {/* Breadcrumb & Navigation */}
      <div className="max-w-7xl mx-auto px-6 mb-8">
        <div className="flex items-center gap-2 text-xs font-sans font-bold text-[#43210D]/60">
          <Link to="/cases" className="hover:text-[#E17541] transition-colors flex items-center gap-1">
            <ArrowLeft size={14} />
            <span>PORTFÓLIO / CASES</span>
          </Link>
          <ChevronRight size={12} className="text-[#CE892C]" />
          <span className="text-[#E17541] truncate max-w-[200px] sm:max-w-xs">{project.title}</span>
        </div>
      </div>

      {/* Case Header Banner */}
      <section className="max-w-7xl mx-auto px-6 mb-12">
        <div className="bg-white border-2 border-[#CE892C]/30 rounded-3xl p-8 sm:p-12 shadow-md relative overflow-hidden">
          <div className="flex flex-wrap items-center gap-2 mb-6">
            {project.category && (
              <span className="px-3.5 py-1 rounded-full bg-[#43210D] text-[#FFC400] text-[11px] font-extrabold uppercase font-sans tracking-wider border border-[#FFC400]/40">
                {project.category}
              </span>
            )}
            {project.segment && (
              <span className="px-3.5 py-1 rounded-full bg-[#E17541]/10 text-[#E17541] border border-[#E17541]/30 text-[11px] font-extrabold uppercase font-sans tracking-wider">
                {project.segment}
              </span>
            )}
            {project.client && (
              <span className="px-3.5 py-1 rounded-full bg-[#F3EDE0] text-[#43210D] border border-[#CE892C]/30 text-[11px] font-extrabold uppercase font-sans tracking-wider flex items-center gap-1.5">
                <Building2 size={12} className="text-[#E17541]" />
                {project.client}
              </span>
            )}
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold font-heading text-[#43210D] leading-tight mb-6 max-w-4xl">
            {project.title}
          </h1>

          {project.shortDescription && (
            <p className="text-base sm:text-xl text-[#43210D]/80 font-sans font-medium leading-relaxed max-w-3xl">
              {project.shortDescription}
            </p>
          )}

          {project.externalLink && (
            <div className="mt-8 pt-6 border-t border-[#CE892C]/20 flex items-center gap-4">
              <a
                href={project.externalLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#43210D] text-[#FFC400] hover:bg-[#FFC400] hover:text-[#43210D] transition-all font-extrabold text-xs uppercase tracking-wider font-sans shadow-sm"
              >
                <span>Visitar Projeto / Site</span>
                <ExternalLink size={16} />
              </a>
            </div>
          )}
        </div>
      </section>

      {/* Main Cover Image */}
      {project.imageUrl && (
        <section className="max-w-7xl mx-auto px-6 mb-16">
          <div className="rounded-3xl overflow-hidden border-2 border-[#CE892C]/40 shadow-xl bg-[#43210D] aspect-video sm:aspect-[21/9] relative group">
            <img
              src={project.imageUrl}
              alt={project.title}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
              onError={(event) => { event.currentTarget.style.display = 'none'; }}
            />
          </div>
        </section>
      )}

      {/* Case Details Content Grid */}
      <section className="max-w-7xl mx-auto px-6 mb-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Info Column (Left 2 cols) */}
          <div className="lg:col-span-2 space-y-8">
            {/* Challenge & Solution Cards */}
            {(project.challenge || project.solution) && (
              <div className="grid sm:grid-cols-2 gap-6">
                {project.challenge && (
                  <div className="bg-white border-2 border-[#CE892C]/30 p-6 rounded-3xl shadow-sm">
                    <span className="text-xs font-extrabold text-[#E17541] uppercase tracking-wider block mb-2 font-sans">
                      O DESAFIO
                    </span>
                    <p className="text-sm text-[#43210D]/90 font-sans leading-relaxed font-medium">
                      {project.challenge}
                    </p>
                  </div>
                )}

                {project.solution && (
                  <div className="bg-[#43210D] text-[#F3EDE0] border-2 border-[#CE892C] p-6 rounded-3xl shadow-md">
                    <span className="text-xs font-extrabold text-[#FFC400] uppercase tracking-wider block mb-2 font-sans">
                      A SOLUÇÃO DO STUDIO B
                    </span>
                    <p className="text-sm text-[#F3EDE0]/90 font-sans leading-relaxed font-medium">
                      {project.solution}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Full Description */}
            {project.fullDescription && (
              <div className="bg-white border-2 border-[#CE892C]/30 p-8 rounded-3xl shadow-sm space-y-4">
                <h3 className="text-xl font-extrabold font-heading text-[#43210D]">
                  Sobre o Projeto
                </h3>
                <div className="text-sm sm:text-base text-[#43210D]/85 font-sans leading-relaxed whitespace-pre-line font-medium">
                  {project.fullDescription}
                </div>
              </div>
            )}

            {/* Results Section (ONLY if real result exists) */}
            {project.results && project.results.trim() !== '' && (
              <div className="bg-gradient-to-r from-[#FFC400] to-[#E17541] text-[#43210D] p-8 rounded-3xl shadow-lg border-2 border-[#43210D]/20">
                <span className="text-xs font-extrabold uppercase tracking-widest block mb-2 font-sans opacity-80">
                  RESULTADOS ALCANÇADOS
                </span>
                <h4 className="text-xl sm:text-2xl font-extrabold font-heading leading-snug">
                  {project.results}
                </h4>
              </div>
            )}

            {/* Gallery Section */}
            {project.gallery && project.gallery.length > 0 && (
              <div className="bg-white border-2 border-[#CE892C]/30 p-8 rounded-3xl shadow-sm">
                <h3 className="text-xl font-extrabold font-heading text-[#43210D] mb-6">
                  Galeria do Projeto
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {project.gallery.map((imgUrl, idx) => (
                    <div
                      key={idx}
                      onClick={() => setActiveImage(imgUrl)}
                      className="group cursor-pointer rounded-2xl overflow-hidden border border-[#CE892C]/30 aspect-video bg-[#43210D] relative"
                    >
                      <img
                        src={imgUrl}
                        alt={`Galeria ${idx + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                        onError={(event) => { event.currentTarget.style.display = 'none'; }}
                      />
                      <div className="absolute inset-0 bg-[#43210D]/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-[#FFC400]">
                        <span className="text-xs font-extrabold font-sans uppercase tracking-wider bg-[#43210D] px-3 py-1.5 rounded-full border border-[#FFC400]">
                          Ampliar
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar Info Column (Right 1 col) */}
          <div className="space-y-6">
            {/* Meta Box */}
            <div className="bg-white border-2 border-[#CE892C]/30 p-6 rounded-3xl shadow-sm space-y-6">
              <h3 className="text-lg font-extrabold font-heading text-[#43210D] border-b border-[#CE892C]/20 pb-4">
                Ficha Técnica
              </h3>

              {project.client && (
                <div>
                  <span className="text-[10px] font-extrabold text-[#43210D]/50 uppercase tracking-wider block mb-1 font-sans">
                    CLIENTE
                  </span>
                  <p className="text-sm font-bold text-[#43210D] font-sans">{project.client}</p>
                </div>
              )}

              {project.category && (
                <div>
                  <span className="text-[10px] font-extrabold text-[#43210D]/50 uppercase tracking-wider block mb-1 font-sans">
                    CATEGORIA
                  </span>
                  <p className="text-sm font-bold text-[#43210D] font-sans">{project.category}</p>
                </div>
              )}

              {project.segment && (
                <div>
                  <span className="text-[10px] font-extrabold text-[#43210D]/50 uppercase tracking-wider block mb-1 font-sans">
                    SEGMENTO DE MERCADO
                  </span>
                  <p className="text-sm font-bold text-[#43210D] font-sans">{project.segment}</p>
                </div>
              )}

              {/* Services List */}
              {project.services && project.services.length > 0 && (
                <div className="pt-4 border-t border-[#CE892C]/20">
                  <span className="text-[10px] font-extrabold text-[#43210D]/50 uppercase tracking-wider block mb-3 font-sans">
                    SERVIÇOS REALIZADOS
                  </span>
                  <ul className="space-y-2">
                    {project.services.map((srv, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs font-bold text-[#43210D] font-sans">
                        <CheckCircle2 size={14} className="text-[#E17541] shrink-0 mt-0.5" />
                        <span>{srv}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Tags */}
              {project.tags && project.tags.length > 0 && (
                <div className="pt-4 border-t border-[#CE892C]/20">
                  <span className="text-[10px] font-extrabold text-[#43210D]/50 uppercase tracking-wider block mb-2 font-sans">
                    TAGS
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {project.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] font-extrabold font-sans text-[#E17541] bg-[#F3EDE0] px-2.5 py-1 rounded-md border border-[#CE892C]/30"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Quick CTA Box */}
            <div className="bg-[#43210D] text-[#F3EDE0] border-2 border-[#CE892C] p-6 rounded-3xl shadow-lg text-center">
              <Sparkles size={28} className="text-[#FFC400] mx-auto mb-3" />
              <h4 className="text-lg font-extrabold font-heading mb-2">
                Quer um projeto para sua marca?
              </h4>
              <p className="text-xs text-[#F3EDE0]/80 font-sans mb-6">
                Fale com o Studio B e eleve seu posicionamento de mercado.
              </p>
              <button
                onClick={onOpenModal}
                className="w-full py-3.5 rounded-xl bg-[#FFC400] text-[#43210D] hover:bg-white transition-all font-extrabold text-xs uppercase tracking-wider font-sans flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <span>FALAR COM UM ESTRATEGISTA</span>
                <ArrowUpRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Bottom Banner */}
      <section className="py-16 px-6 bg-[#43210D] text-[#F3EDE0]">
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
          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={onOpenModal}
              className="px-8 py-4 rounded-full bg-[#FFC400] text-[#43210D] hover:bg-white transition-all font-extrabold text-xs sm:text-sm uppercase tracking-wider inline-flex items-center gap-2 shadow-xl cursor-pointer font-sans"
            >
              <span>CRIAR MEU CASE DE SUCESSO</span>
              <ArrowUpRight size={18} />
            </button>
            <Link
              to="/cases"
              className="px-8 py-4 rounded-full bg-white/10 hover:bg-white/20 text-[#F3EDE0] transition-all font-extrabold text-xs sm:text-sm uppercase tracking-wider inline-flex items-center gap-2 font-sans border border-white/20"
            >
              <span>VER OUTROS CASES</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Image Lightbox Modal */}
      <AnimatePresence>
        {activeImage && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-8 bg-[#43210D]/90 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative max-w-5xl w-full max-h-[90vh] bg-[#43210D] rounded-3xl p-2 border-2 border-[#FFC400] shadow-2xl flex flex-col items-center justify-center overflow-hidden"
            >
              <button
                onClick={() => setActiveImage(null)}
                className="absolute top-4 right-4 z-10 p-2 bg-[#43210D] text-[#FFC400] rounded-full border border-[#FFC400] hover:bg-[#FFC400] hover:text-[#43210D] transition-colors"
              >
                <X size={20} />
              </button>
              <img
                src={activeImage}
                alt="Galeria ampliada"
                className="max-h-[80vh] w-auto max-w-full object-contain rounded-2xl"
                referrerPolicy="no-referrer"
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
