import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Clock, 
  User, 
  Calendar, 
  ArrowRight, 
  Loader2, 
  Share2, 
  Check, 
  Copy, 
  MessageCircle, 
  Linkedin,
  ListOrdered,
  ChevronDown,
  ChevronUp,
  BookOpen
} from 'lucide-react';
import { db } from '../firebase';
import { doc, getDoc, collection, query, where, limit, getDocs } from 'firebase/firestore';
import { blogPosts } from '../data/posts';

export const BlogPost = () => {
  const { id } = useParams();
  const [post, setPost] = useState<any>(null);
  const [relatedPosts, setRelatedPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [mobileTocOpen, setMobileTocOpen] = useState(false);

  useEffect(() => {
    const fetchPost = async () => {
      if (!id) return;
      setLoading(true);
      window.scrollTo(0, 0);
      try {
        const docRef = doc(db, 'posts', id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const postData = { id: docSnap.id, ...docSnap.data() } as any;
          setPost(postData);
          
          // Fetch related posts (prioritize same category, complete up to 3)
          let candidates: any[] = [];
          try {
            const q = query(
              collection(db, 'posts'),
              where('published', '==', true),
              limit(20)
            );
            const relatedSnap = await getDocs(q);
            candidates = relatedSnap.docs.map(d => ({ id: d.id, ...d.data() }));
          } catch (e) {
            console.error("Error querying firestore posts:", e);
          }

          if (candidates.length === 0) {
            candidates = blogPosts.map(p => ({ ...p, imageUrl: p.image }));
          } else {
            const existingIds = new Set(candidates.map(p => p.id));
            blogPosts.forEach(p => {
              if (!existingIds.has(p.id)) {
                candidates.push({ ...p, imageUrl: p.image });
              }
            });
          }

          const filtered = candidates.filter(p => p.id !== id);
          const sameCat = filtered.filter(
            p => p.category && postData.category && p.category.toLowerCase().trim() === postData.category.toLowerCase().trim()
          );
          const diffCat = filtered.filter(
            p => !p.category || !postData.category || p.category.toLowerCase().trim() !== postData.category.toLowerCase().trim()
          );

          setRelatedPosts([...sameCat, ...diffCat].slice(0, 3));
        } else {
          // Fallback to local post
          const local = blogPosts.find(p => p.id === id);
          if (local) {
            setPost({ ...local, imageUrl: local.image });
            const filtered = blogPosts.filter(p => p.id !== id).map(p => ({ ...p, imageUrl: p.image }));
            const sameCat = filtered.filter(
              p => p.category && local.category && p.category.toLowerCase().trim() === local.category.toLowerCase().trim()
            );
            const diffCat = filtered.filter(
              p => !p.category || !local.category || p.category.toLowerCase().trim() !== local.category.toLowerCase().trim()
            );
            setRelatedPosts([...sameCat, ...diffCat].slice(0, 3));
          }
        }
      } catch (error) {
        console.error("Error fetching post:", error);
        const local = blogPosts.find(p => p.id === id);
        if (local) {
          setPost({ ...local, imageUrl: local.image });
          const filtered = blogPosts.filter(p => p.id !== id).map(p => ({ ...p, imageUrl: p.image }));
          const sameCat = filtered.filter(
            p => p.category && local.category && p.category.toLowerCase().trim() === local.category.toLowerCase().trim()
          );
          const diffCat = filtered.filter(
            p => !p.category || !local.category || p.category.toLowerCase().trim() !== local.category.toLowerCase().trim()
          );
          setRelatedPosts([...sameCat, ...diffCat].slice(0, 3));
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [id]);

  // Parse HTML content to inject section IDs and extract H2 headings for the table of contents
  const { processedContent, headings } = useMemo(() => {
    if (!post || !post.content) return { processedContent: '', headings: [] };

    const extractedHeadings: { id: string; text: string }[] = [];
    let count = 0;

    // Quill content imported from rich text can contain literal &nbsp; strings.
    // Normalize them before rendering so paragraphs can wrap and the index shows readable titles.
    const normalizedHtml = post.content.replace(/&(amp;)?nbsp;/gi, ' ');

    // Replace <h2> tags with custom formatted headers containing unique IDs
    const modifiedHtml = normalizedHtml.replace(/<h2[^>]*>(.*?)<\/h2>/gi, (_match: string, innerText: string) => {
      count++;
      const sectionId = `secao-${count}`;
      const cleanText = innerText.replace(/<[^>]+>/g, '').trim();
      extractedHeadings.push({ id: sectionId, text: cleanText });

      return `
        <div id="${sectionId}" class="scroll-mt-32 pt-6 mb-4">
          <h2 class="text-xl sm:text-2xl font-extrabold text-[#43210D] font-heading flex items-start gap-3 leading-snug">
            <span class="w-2.5 h-2.5 rounded-full bg-[#E17541] inline-block mt-2 shrink-0"></span>
            <span>${innerText}</span>
          </h2>
        </div>
      `;
    });

    return { processedContent: modifiedHtml, headings: extractedHeadings };
  }, [post]);

  const handleScrollTo = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(`${post?.title || 'Artigo Studio B Marketing'}\n${window.location.href}`);
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleShareLinkedIn = () => {
    const url = encodeURIComponent(window.location.href);
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F3EDE0] flex items-center justify-center">
        <Loader2 className="text-[#FFC400] animate-spin" size={48} />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F3EDE0] text-[#43210D] px-6">
        <h1 className="text-3xl sm:text-4xl font-extrabold mb-4 font-heading">Artigo não encontrado</h1>
        <p className="text-[#43210D]/70 mb-8 font-sans font-medium text-sm">O conteúdo que você está procurando não existe ou foi removido.</p>
        <Link 
          to="/blog" 
          className="bg-[#FFC400] text-[#43210D] px-8 py-3 rounded-full font-bold flex items-center gap-2 transition-all hover:bg-[#43210D] hover:text-[#F3EDE0] font-sans uppercase text-xs tracking-wider shadow-md"
        >
          <ArrowLeft size={16} /> Voltar ao Blog
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F3EDE0] text-[#43210D] font-sans">
      
      {/* 1. HERO DO ARTIGO */}
      <section className="relative min-h-[480px] sm:min-h-[540px] w-full overflow-hidden bg-[#43210D] text-[#F3EDE0] pt-28 pb-16 flex flex-col justify-between">
        
        {/* Background Image & Overlay */}
        {post.imageUrl && (
          <div className="absolute inset-0 z-0">
            <img 
              src={post.imageUrl} 
              alt={post.title} 
              className="w-full h-full object-cover opacity-25"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-[#43210D]/90 via-[#43210D]/80 to-[#43210D]" />
          </div>
        )}

        <div className="max-w-7xl mx-auto px-6 w-full relative z-10 flex flex-col justify-between h-full">
          
          {/* Top Left Navigation */}
          <div>
            <Link 
              to="/blog" 
              className="inline-flex items-center gap-2 bg-[#F3EDE0]/10 hover:bg-[#FFC400] text-[#F3EDE0] hover:text-[#43210D] px-5 py-2.5 rounded-full font-extrabold text-xs uppercase tracking-wider transition-all font-sans backdrop-blur-md border border-[#F3EDE0]/20 shadow-md mb-8"
            >
              <ArrowLeft size={14} /> 
              VOLTAR PARA O BLOG
            </Link>
          </div>

          {/* Hero Content */}
          <div className="max-w-4xl">
            {/* Category & Read Time */}
            <div className="flex flex-wrap items-center gap-3 text-xs font-extrabold uppercase tracking-widest text-[#FFC400] mb-4 font-sans">
              <span className="bg-[#E17541] text-white px-3.5 py-1 rounded-full text-[11px] shadow-sm">
                {post.category || 'ARTIGO'}
              </span>
              <span className="text-white/40">•</span>
              <span className="flex items-center gap-1.5 text-[#F3EDE0]/90">
                <Clock size={14} className="text-[#FFC400]" /> 
                {post.time ? `${post.time.toUpperCase()} DE LEITURA` : '5 MIN DE LEITURA'}
              </span>
            </div>

            {/* Main Title */}
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#F3EDE0] leading-[1.15] mb-4 font-heading max-w-4xl">
              {post.title}
            </h1>

            {/* Subtitle / Excerpt / Description */}
            {post.description && (
              <p className="text-sm sm:text-base text-[#F3EDE0]/85 font-sans font-medium max-w-3xl leading-relaxed">
                "{post.description}"
              </p>
            )}
          </div>

        </div>
      </section>

      {/* 2. ÁREA DE LEITURA (MAIN EDITORIAL & SIDEBAR) */}
      <section className="w-full py-12 sm:py-16">
        <div className="max-w-[1200px] w-[calc(100%-48px)] mx-auto grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px] gap-12 lg:gap-16 items-start">
          
          {/* COLUNA PRINCIPAL / ARTIGO */}
          <main className="w-full max-w-[760px] min-w-0 [overflow-wrap:break-word]">
            
            {/* Meta Info Bar (Author & Date) */}
            <div className="flex flex-wrap items-center justify-between gap-4 text-xs font-bold text-[#43210D]/70 uppercase tracking-wider mb-8 pb-4 border-b border-[#CE892C]/30 font-sans">
              <div className="flex items-center gap-2">
                <User size={14} className="text-[#E17541]" /> 
                <span>{post.author || 'Studio B Marketing'}</span>
              </div>
              {post.date && (
                <div className="flex items-center gap-2">
                  <Calendar size={14} className="text-[#E17541]" /> 
                  <span>{post.date}</span>
                </div>
              )}
            </div>

            {/* Mobile "Neste Artigo" Accordion / Index Card */}
            {headings.length > 0 && (
              <div className="lg:hidden mb-10 bg-white border-2 border-[#CE892C]/40 rounded-2xl p-5 shadow-sm font-sans">
                <button
                  onClick={() => setMobileTocOpen(!mobileTocOpen)}
                  className="w-full flex items-center justify-between font-extrabold text-xs uppercase tracking-wider text-[#43210D] font-heading"
                >
                  <div className="flex items-center gap-2">
                    <ListOrdered size={16} className="text-[#E17541]" />
                    <span>NESTE ARTIGO ({headings.length})</span>
                  </div>
                  {mobileTocOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>

                {mobileTocOpen && (
                  <nav className="mt-4 pt-4 border-t border-[#CE892C]/20 flex flex-col gap-2">
                    {headings.map((item, idx) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          handleScrollTo(item.id);
                          setMobileTocOpen(false);
                        }}
                        className="text-left text-xs font-semibold text-[#43210D]/80 hover:text-[#E17541] transition-colors py-1 flex items-start gap-2"
                      >
                        <span className="text-[#E17541] font-bold font-heading shrink-0">
                          {String(idx + 1).padStart(2, '0')}.
                        </span>
                        <span className="leading-snug">{item.text}</span>
                      </button>
                    ))}
                  </nav>
                )}
              </div>
            )}

            {/* Article Main Body Content */}
            <article className="editorial-article text-[#43210D] w-full max-w-[760px] [overflow-wrap:break-word]">
              <div 
                className="prose prose-base sm:prose-lg max-w-none min-w-0 [overflow-wrap:anywhere]
                  prose-p:text-[#43210D]/90 prose-p:leading-relaxed prose-p:mb-6 prose-p:font-sans prose-p:text-base sm:prose-p:text-lg prose-p:text-justify prose-p:[hyphens:auto]
                  prose-headings:font-heading prose-headings:font-extrabold prose-headings:text-[#43210D] 
                  prose-h3:text-lg sm:prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3
                  prose-strong:text-[#43210D] prose-strong:font-bold 
                  prose-a:text-[#E17541] prose-a:font-bold hover:prose-a:underline
                  prose-blockquote:border-l-4 prose-blockquote:border-[#FFC400] prose-blockquote:bg-white/60 prose-blockquote:p-4 prose-blockquote:rounded-r-2xl prose-blockquote:italic prose-blockquote:text-[#43210D]
                  prose-ul:list-disc prose-ul:pl-6 prose-ul:mb-6 prose-li:mb-2
                  prose-img:rounded-3xl prose-img:border-2 prose-img:border-[#CE892C]/30 shadow-md"
                dangerouslySetInnerHTML={{ __html: processedContent }}
              />
            </article>

            {/* Tags Section */}
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-12 pt-8 border-t border-[#CE892C]/30 font-sans">
                {post.tags.map((tag: string) => (
                  <span 
                    key={tag} 
                    className="bg-white border border-[#CE892C]/40 text-[#43210D] text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider shadow-sm"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Mobile Share Buttons (Bottom of article) */}
            <div className="lg:hidden mt-10 p-6 bg-white border-2 border-[#CE892C]/30 rounded-3xl text-center shadow-sm font-sans">
              <p className="text-xs font-extrabold uppercase tracking-wider text-[#43210D] font-heading mb-4">
                COMPARTILHE ESTE ARTIGO
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={handleShareLinkedIn}
                  className="p-3 rounded-full bg-[#0A66C2] text-white hover:opacity-90 transition-all flex items-center gap-2 text-xs font-bold px-4 cursor-pointer"
                >
                  <Linkedin size={16} />
                  <span>LinkedIn</span>
                </button>

                <button
                  onClick={handleShareWhatsApp}
                  className="p-3 rounded-full bg-[#25D366] text-white hover:opacity-90 transition-all flex items-center gap-2 text-xs font-bold px-4 cursor-pointer"
                >
                  <MessageCircle size={16} />
                  <span>WhatsApp</span>
                </button>

                <button
                  onClick={handleCopyLink}
                  className="p-3 rounded-full bg-[#43210D] text-[#FFC400] hover:bg-[#E17541] hover:text-white transition-all flex items-center gap-2 text-xs font-bold px-4 cursor-pointer"
                >
                  {copied ? <Check size={16} className="text-[#25D366]" /> : <Copy size={16} />}
                  <span>{copied ? 'Copiado!' : 'Copiar Link'}</span>
                </button>
              </div>
            </div>

            {/* Mobile Related Articles */}
            {relatedPosts.length > 0 && (
              <div className="lg:hidden mt-6 bg-white border-2 border-[#CE892C]/30 rounded-3xl p-6 shadow-sm font-sans">
                <h3 className="font-heading font-extrabold text-xs uppercase tracking-wider text-[#43210D] mb-4 pb-3 border-b border-[#CE892C]/20 flex items-center gap-2">
                  <BookOpen size={16} className="text-[#E17541]" />
                  <span>Artigos relacionados</span>
                </h3>

                <div className="flex flex-col divide-y divide-[#CE892C]/20">
                  {relatedPosts.map((rel) => (
                    <Link
                      key={rel.id}
                      to={`/blog/${rel.id}`}
                      className="group py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3 text-left transition-all"
                    >
                      <div className="space-y-1 min-w-0 flex-1">
                        <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#E17541] font-sans block">
                          {rel.category || 'ARTIGO'}
                        </span>
                        <h4 className="text-xs sm:text-sm font-extrabold text-[#43210D] font-heading leading-snug group-hover:text-[#E17541] transition-colors line-clamp-2">
                          {rel.title}
                        </h4>
                      </div>
                      <ArrowRight size={16} className="text-[#E17541] shrink-0 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  ))}
                </div>
              </div>
            )}

          </main>

          {/* COLUNA LATERAL / SIDEBAR - EXACT PRESERVED VISUAL DESIGN & STICKY */}
          <aside className="hidden lg:flex flex-col gap-6 sticky top-[110px] w-[300px]">
            
            {/* Card 1: NESTE ARTIGO */}
            {headings.length > 0 && (
              <div className="bg-white border-2 border-[#CE892C]/30 rounded-3xl p-6 shadow-sm font-sans">
                <h3 className="font-heading font-extrabold text-xs uppercase tracking-wider text-[#43210D] mb-4 pb-3 border-b border-[#CE892C]/20 flex items-center gap-2">
                  <ListOrdered size={16} className="text-[#E17541]" />
                  <span>NESTE ARTIGO</span>
                </h3>

                <nav className="flex flex-col gap-3">
                  {headings.map((item, idx) => (
                    <button
                      key={item.id}
                      onClick={() => handleScrollTo(item.id)}
                      className="group text-left text-xs font-bold text-[#43210D]/80 hover:text-[#E17541] transition-all flex items-start gap-2.5 leading-snug cursor-pointer"
                    >
                      <span className="text-[#E17541] font-extrabold font-heading text-xs group-hover:translate-x-0.5 transition-transform shrink-0">
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                      <span className="group-hover:underline">{item.text}</span>
                    </button>
                  ))}
                </nav>
              </div>
            )}

            {/* Card 2: COMPARTILHE ESTE ARTIGO */}
            <div className="bg-white border-2 border-[#CE892C]/30 rounded-3xl p-6 shadow-sm font-sans">
              <h3 className="font-heading font-extrabold text-xs uppercase tracking-wider text-[#43210D] mb-4 pb-3 border-b border-[#CE892C]/20 flex items-center gap-2">
                <Share2 size={16} className="text-[#E17541]" />
                <span>COMPARTILHE ESTE ARTIGO</span>
              </h3>

              <div className="flex flex-col gap-2.5">
                <button
                  onClick={handleShareLinkedIn}
                  className="w-full py-2.5 px-4 rounded-full bg-[#0A66C2] text-white hover:opacity-95 transition-all text-xs font-bold flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                >
                  <Linkedin size={16} />
                  <span>LinkedIn</span>
                </button>

                <button
                  onClick={handleShareWhatsApp}
                  className="w-full py-2.5 px-4 rounded-full bg-[#25D366] text-white hover:opacity-95 transition-all text-xs font-bold flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                >
                  <MessageCircle size={16} />
                  <span>WhatsApp</span>
                </button>

                <button
                  onClick={handleCopyLink}
                  className="w-full py-2.5 px-4 rounded-full bg-[#43210D] text-[#FFC400] hover:bg-[#E17541] hover:text-white transition-all text-xs font-bold flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                >
                  {copied ? <Check size={16} className="text-[#25D366]" /> : <Copy size={16} />}
                  <span>{copied ? 'LINK COPIADO!' : 'COPIAR LINK'}</span>
                </button>
              </div>
            </div>

            {/* Card 3: ARTIGOS RELACIONADOS */}
            {relatedPosts.length > 0 && (
              <div className="bg-white border-2 border-[#CE892C]/30 rounded-3xl p-6 shadow-sm font-sans">
                <h3 className="font-heading font-extrabold text-xs uppercase tracking-wider text-[#43210D] mb-4 pb-3 border-b border-[#CE892C]/20 flex items-center gap-2">
                  <BookOpen size={16} className="text-[#E17541]" />
                  <span>Artigos relacionados</span>
                </h3>

                <div className="flex flex-col divide-y divide-[#CE892C]/20">
                  {relatedPosts.map((rel) => (
                    <Link
                      key={rel.id}
                      to={`/blog/${rel.id}`}
                      className="group py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3 text-left transition-all"
                    >
                      <div className="space-y-1 min-w-0 flex-1">
                        <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#E17541] font-sans block">
                          {rel.category || 'ARTIGO'}
                        </span>
                        <h4 className="text-xs sm:text-sm font-extrabold text-[#43210D] font-heading leading-snug group-hover:text-[#E17541] transition-colors line-clamp-2">
                          {rel.title}
                        </h4>
                      </div>
                      <ArrowRight size={16} className="text-[#E17541] shrink-0 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  ))}
                </div>
              </div>
            )}

          </aside>

        </div>
      </section>

      {/* 9. FINAL DO ARTIGO (CTA & CONTINUE LENDO) */}
      <section className="bg-[#43210D] text-[#F3EDE0] py-16 px-6 border-t border-[#CE892C]/40">
        <div className="max-w-7xl mx-auto">
          
          {/* CTA Box */}
          <div className="bg-[#43210D] border-2 border-[#CE892C] rounded-3xl p-8 sm:p-12 text-center max-w-4xl mx-auto shadow-2xl relative overflow-hidden mb-20">
            <span className="px-4 py-1.5 rounded-full bg-[#E17541] text-white text-[10px] sm:text-xs font-bold uppercase tracking-widest inline-block font-sans mb-4 shadow-sm">
              ESTRATÉGIA & BRANDING
            </span>

            <h3 className="text-2xl sm:text-4xl font-extrabold text-[#F3EDE0] mb-4 font-heading leading-tight">
              Gostou do conteúdo? Agora imagine essa estratégia aplicada à sua marca.
            </h3>

            <p className="text-[#F3EDE0]/80 text-xs sm:text-sm font-sans font-medium max-w-2xl mx-auto mb-8 leading-relaxed">
              Conte para a gente onde sua empresa está e onde você quer chegar. O Studio B Marketing transforma esse objetivo em estratégia, comunicação e execução.
            </p>

            <a 
              href={`https://wa.me/5511966558126?text=${encodeURIComponent(`Olá! Li o artigo "${post.title}" no site do Studio B Marketing e gostaria de conversar sobre um projeto.`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 bg-[#FFC400] text-[#43210D] hover:bg-[#E17541] hover:text-white px-8 py-4 rounded-full font-extrabold text-xs sm:text-sm uppercase tracking-wider transition-all font-sans shadow-lg cursor-pointer border border-[#CE892C]/40"
            >
              <span>CONVERSAR COM O STUDIO B MARKETING</span>
              <ArrowRight size={18} />
            </a>
          </div>

          {/* Continue Lendo (Posts Relacionados) */}
          {relatedPosts.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-10 pb-4 border-b border-[#F3EDE0]/15">
                <div>
                  <span className="text-[#FFC400] text-xs font-bold uppercase tracking-widest block font-sans mb-1">// PRÓXIMAS LEITURAS</span>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-[#F3EDE0] font-heading">CONTINUE LENDO</h3>
                </div>
                <Link to="/blog" className="text-xs font-bold uppercase tracking-wider text-[#FFC400] hover:text-white transition-colors font-sans flex items-center gap-1">
                  <span>VER TODOS OS ARTIGOS</span>
                  <ArrowRight size={14} />
                </Link>
              </div>

              <div className="grid md:grid-cols-3 gap-8">
                {relatedPosts.map((related) => (
                  <Link 
                    key={related.id} 
                    to={`/blog/${related.id}`}
                    className="group block bg-[#43210D] rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all border-2 border-[#CE892C]/30 hover:border-[#FFC400] flex flex-col hover:-translate-y-1.5"
                  >
                    <div className="h-48 relative overflow-hidden bg-[#2C1508]">
                      {related.imageUrl ? (
                        <img 
                          src={related.imageUrl} 
                          alt={related.title} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-80 group-hover:opacity-100"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full bg-[#2C1508] flex items-center justify-center text-white/30 font-sans text-xs">
                          [IMAGEM]
                        </div>
                      )}
                      <div className="absolute bottom-4 left-4">
                        <span className="bg-[#43210D] text-[#FFC400] border border-[#FFC400]/40 text-[10px] font-bold px-3 py-1 rounded-full uppercase font-sans">
                          {related.category}
                        </span>
                      </div>
                    </div>

                    <div className="p-6 flex-1 flex flex-col">
                      <h4 className="text-base font-extrabold mb-3 leading-snug group-hover:text-[#FFC400] transition-colors font-heading text-[#F3EDE0]">
                        {related.title}
                      </h4>
                      
                      <div className="flex items-center justify-between mt-auto pt-4 border-t border-[#F3EDE0]/10 font-sans text-[11px] font-bold text-[#F3EDE0]/60">
                        <div className="flex items-center gap-2">
                          <Clock size={12} className="text-[#FFC400]" />
                          <span>{related.time || '5 min'}</span>
                        </div>
                        <ArrowRight size={16} className="text-[#FFC400] group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

        </div>
      </section>

    </div>
  );
};

export default BlogPost;
