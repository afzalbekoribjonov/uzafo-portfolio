'use client';

import {ArrowUpRight, Compass, Copy, MessageCircle, Move, Send, Sparkles, X} from 'lucide-react';
import {useLocale, useTranslations} from 'next-intl';
import {useEffect, useMemo, useRef, useState, useSyncExternalStore} from 'react';
import blogPosts from '@/data/blog-posts.json';
import knowledge from '@/data/chat-knowledge.json';
import discussions from '@/data/discussions.json';
import profile from '@/data/profile.json';
import projects from '@/data/projects.json';
import site from '@/data/site.json';
import {usePathname, useRouter} from '@/i18n/navigation';
import {applyProfileContactOverrides, applySiteContactOverrides} from '@/lib/contact';
import type {
  BlogPost,
  ChatAction,
  ChatIntent,
  ChatKnowledge,
  Discussion,
  Locale,
  Profile,
  Project,
  SiteData
} from '@/lib/types';
import {cn, resolveText} from '@/lib/utils';

type ChatMessage = {
  id: string;
  role: 'assistant' | 'user';
  text: string;
  actions?: ChatAction[];
};

type AssistantPosition = {
  x: number;
  y: number;
};

const defaultPosition: AssistantPosition = {x: 24, y: 24};
const defaultPositionSnapshot = JSON.stringify(defaultPosition);
const positionStoreKey = 'uzafo-ai-widget-position';
const positionListeners = new Set<() => void>();
let cachedPositionSnapshot = defaultPositionSnapshot;
const minViewportOffset = 12;
const bubbleSize = 64;
const knowledgeData = knowledge as ChatKnowledge;
const profileData = applyProfileContactOverrides(profile as Profile);
const siteData = applySiteContactOverrides(site as SiteData);
const projectData = projects as Project[];
const blogData = blogPosts as BlogPost[];
const discussionData = discussions as Discussion[];

function getStoredPositionSnapshot() {
  if (typeof window === 'undefined') {
    return cachedPositionSnapshot;
  }

  const nextSnapshot = window.localStorage.getItem(positionStoreKey) ?? defaultPositionSnapshot;
  if (nextSnapshot !== cachedPositionSnapshot) {
    cachedPositionSnapshot = nextSnapshot;
  }
  return cachedPositionSnapshot;
}

function parseStoredPosition(snapshot: string): AssistantPosition {
  try {
    const parsed = JSON.parse(snapshot) as Partial<AssistantPosition>;
    if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
      return {x: parsed.x, y: parsed.y};
    }
  } catch {}

  return defaultPosition;
}

function subscribeToStoredPosition(listener: () => void) {
  positionListeners.add(listener);

  if (typeof window !== 'undefined') {
    window.addEventListener('storage', listener);
  }

  return () => {
    positionListeners.delete(listener);
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', listener);
    }
  };
}

function writeStoredPosition(position: AssistantPosition) {
  const snapshot = JSON.stringify(position);
  cachedPositionSnapshot = snapshot;

  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(positionStoreKey, snapshot);
  positionListeners.forEach((listener) => listener());
}

function clampPositionToViewport(position: AssistantPosition, width: number, height: number): AssistantPosition {
  if (typeof window === 'undefined') {
    return position;
  }

  const maxX = Math.max(minViewportOffset, window.innerWidth - width - minViewportOffset);
  const maxY = Math.max(minViewportOffset, window.innerHeight - height - minViewportOffset);

  return {
    x: Math.min(maxX, Math.max(minViewportOffset, position.x)),
    y: Math.min(maxY, Math.max(minViewportOffset, position.y))
  };
}

function createMessageId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeInput(value: string) {
  return value
    .toLowerCase()
    .replace(/[ʻ’'`]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function findBestIntent(input: string) {
  const normalized = normalizeInput(input);
  const direct = knowledgeData.intents.find((intent) => intent.id === normalized);

  if (direct) return direct;

  let bestIntent: ChatIntent | null = null;
  let bestScore = 0;

  for (const intent of knowledgeData.intents) {
    const score = intent.keywords.reduce((total, keyword) => {
      const normalizedKeyword = normalizeInput(keyword);

      if (!normalizedKeyword || !normalized.includes(normalizedKeyword)) {
        return total;
      }

      return total + normalizedKeyword.split(' ').length + 1;
    }, 0);

    if (score > bestScore) {
      bestScore = score;
      bestIntent = intent;
    }
  }

  return bestScore > 0 ? bestIntent : null;
}

function routeAction(label: string, href: string): ChatAction {
  return {type: 'route', label, href};
}

function externalAction(label: string, href: string): ChatAction {
  return {type: 'external', label, href};
}

function copyAction(label: string, value: string): ChatAction {
  return {type: 'copy', label, value};
}

type FloatingAiAssistantShellProps = {
  locale: Locale;
};

export function FloatingAiAssistant() {
  const locale = useLocale() as Locale;
  const pathname = usePathname();

  return <FloatingAiAssistantShell key={`${locale}:${pathname}`} locale={locale} />;
}

function FloatingAiAssistantShell({locale}: FloatingAiAssistantShellProps) {
  const t = useTranslations('chat');
  const router = useRouter();
  const dragOffset = useRef({x: 0, y: 0});
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const bubbleRef = useRef<HTMLButtonElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const storedPositionSnapshot = useSyncExternalStore(
    subscribeToStoredPosition,
    getStoredPositionSnapshot,
    () => defaultPositionSnapshot
  );
  const storedPosition = useMemo(
    () => parseStoredPosition(storedPositionSnapshot),
    [storedPositionSnapshot]
  );
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');

  const quickPrompts = knowledgeData.quickPrompts;
  const quickRoutes = knowledgeData.quickRoutes;
  const compactActions = useMemo(() => [...quickPrompts, ...quickRoutes], [quickPrompts, quickRoutes]);
  const latestBlogPost = useMemo(
    () => [...blogData].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt)).find((post) => post.featured) ?? [...blogData].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))[0] ?? null,
    []
  );
  const latestDiscussion = useMemo(
    () => [...discussionData].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0] ?? null,
    []
  );
  const featuredProject = useMemo(() => projectData[0] ?? null, []);

  const createAssistantMessage = (text: string, actions?: ChatAction[]): ChatMessage => ({
    id: createMessageId('assistant'),
    role: 'assistant',
    text,
    actions
  });

  const createWelcomeMessage = () =>
    createAssistantMessage(resolveText(knowledgeData.greeting, locale), [
      quickPrompts[0],
      quickPrompts[1],
      quickRoutes[1],
      quickRoutes[4]
    ]);

  const [messages, setMessages] = useState<ChatMessage[]>(() => [createWelcomeMessage()]);

  const getIntentResponse = (intent: ChatIntent) => {
    switch (intent.id) {
      case 'help':
        return createAssistantMessage(resolveText(intent.reply, locale), [
          quickRoutes[1],
          quickRoutes[2],
          quickRoutes[3],
          quickRoutes[4]
        ]);
      case 'about':
        return createAssistantMessage(
          `${resolveText(profileData.tagline, locale)} ${resolveText(profileData.summary, locale)}`,
          [
            routeAction(locale === 'uz' ? 'Haqimda sahifasini ochish' : 'Open about page', '/about'),
            routeAction(locale === 'uz' ? 'Resume sahifasini ochish' : 'Open resume', '/resume')
          ]
        );
      case 'stack': {
        const categories = profileData.techCategories
          .map((category) => `${resolveText(category.title, locale)}: ${category.items.slice(0, 4).join(', ')}`)
          .join(locale === 'uz' ? '. ' : '. ');

        return createAssistantMessage(
          locale === 'uz'
            ? `Asosiy stack quyidagicha: ${categories}. Hozirgi fokus: ${profileData.stats[2]?.value ?? 'Next.js + Python + AI'}.`
            : `The core stack looks like this: ${categories}. Current focus: ${profileData.stats[2]?.value ?? 'Next.js + Python + AI'}.`,
          [
            routeAction(locale === 'uz' ? 'Texnologiyalarni ko‘rish' : 'View technologies', '/about'),
            routeAction(locale === 'uz' ? 'Amaliy loyihalarni ochish' : 'Open practical work', '/portfolio')
          ]
        );
      }
      case 'work':
        return createAssistantMessage(
          locale === 'uz'
            ? `Fokus mahsulotga yaqin web ilovalar, admin panellar, API arxitekturasi, deploy jarayonlari va AI integratsiyalarida. ${resolveText(profileData.availability, locale)}.`
            : `The focus is on product-oriented web apps, admin panels, API architecture, deployment workflows, and AI integrations. ${resolveText(profileData.availability, locale)}.`,
          [
            routeAction(locale === 'uz' ? 'Portfolio ochish' : 'Open portfolio', '/portfolio'),
            routeAction(locale === 'uz' ? 'Resume ko‘rish' : 'View resume', '/resume')
          ]
        );
      case 'portfolio': {
        const title = featuredProject ? resolveText(featuredProject.title, locale) : null;
        const tags = featuredProject?.tags.slice(0, 3).join(', ');

        return createAssistantMessage(
          locale === 'uz'
            ? `Portfolio bo'limida ${projectData.length} ta loyiha bor. U yerda case study, stack, status va media bloklari ko'rsatiladi. ${title ? `Boshlash uchun "${title}" loyihasini ko'rishingiz mumkin.` : ''}${tags ? ` Asosiy texnologiyalar: ${tags}.` : ''}`
            : `The portfolio currently includes ${projectData.length} projects. It highlights case studies, stack choices, status, and media blocks. ${title ? `A strong starting point is "${title}".` : ''}${tags ? ` Core technologies include ${tags}.` : ''}`,
          featuredProject
            ? [
                routeAction(locale === 'uz' ? 'Tanlangan loyihani ochish' : 'Open featured project', `/portfolio/${featuredProject.slug}`),
                routeAction(locale === 'uz' ? 'Barcha loyihalarni ko‘rish' : 'Browse all projects', '/portfolio')
              ]
            : [routeAction(locale === 'uz' ? 'Portfolio ochish' : 'Open portfolio', '/portfolio')]
        );
      }
      case 'blog': {
        const title = latestBlogPost ? resolveText(latestBlogPost.title, locale) : null;

        return createAssistantMessage(
          locale === 'uz'
            ? `Blog bo'limida ${blogData.length} ta yozuv bor. U yerda dasturlash, tizimlar va amaliy tajribalar haqida materiallar jamlangan.${title ? ` Hozir ko‘rishga arziydigan yozuvlardan biri "${title}".` : ''}`
            : `The blog currently includes ${blogData.length} posts. It collects writing about programming, systems, and practical development work.${title ? ` One good post to start with is "${title}".` : ''}`,
          latestBlogPost
            ? [
                routeAction(locale === 'uz' ? 'So‘nggi postni ochish' : 'Open a recent post', `/blog/${latestBlogPost.slug}`),
                routeAction(locale === 'uz' ? 'Blog bo‘limiga o‘tish' : 'Go to the blog', '/blog')
              ]
            : [routeAction(locale === 'uz' ? 'Blogni ochish' : 'Open blog', '/blog')]
        );
      }
      case 'discussions': {
        const title = latestDiscussion ? resolveText(latestDiscussion.title, locale) : null;

        return createAssistantMessage(
          locale === 'uz'
            ? `Muhokama bo'limida ${discussionData.length} ta mavzu bor. Bu yer savol-javob, yechim muhokamasi va rich-text reply oqimi uchun ishlatiladi.${title ? ` Hozirgi faol mavzulardan biri "${title}".` : ''}`
            : `There are ${discussionData.length} discussion topics right now. The area is designed for Q&A, solution-oriented threads, and rich-text replies.${title ? ` One active topic is "${title}".` : ''}`,
          latestDiscussion
            ? [
                routeAction(locale === 'uz' ? 'Mavzuni ochish' : 'Open a discussion', `/discussions/${latestDiscussion.slug}`),
                routeAction(locale === 'uz' ? 'Barcha muhokamalar' : 'Browse discussions', '/discussions')
              ]
            : [routeAction(locale === 'uz' ? 'Muhokamalarni ochish' : 'Open discussions', '/discussions')]
        );
      }
      case 'resume':
        return createAssistantMessage(
          locale === 'uz'
            ? `Resume sahifasi ${profileData.experienceYears}+ yillik tajriba, ko'nikmalar, ta'lim va ish yo'nalishini jamlaydi. U yerda qisqa summary va amaliy fokus ham berilgan.`
            : `The resume page brings together ${profileData.experienceYears}+ years of experience, skills, education, and working direction. It also includes a concise summary and practical focus areas.`,
          [
            routeAction(locale === 'uz' ? 'Resume sahifasini ochish' : 'Open resume', '/resume'),
            routeAction(locale === 'uz' ? 'Haqimda sahifasini ko‘rish' : 'View about page', '/about')
          ]
        );
      case 'contact': {
        const socialNames = siteData.socials
          .filter((item) => item.name !== 'Phone')
          .map((item) => item.name)
          .join(', ');

        return createAssistantMessage(
          locale === 'uz'
            ? `Menga ${profileData.email} yoki ${profileData.phone} orqali bog'lanishingiz mumkin. ${resolveText(profileData.availability, locale)}. Joylashuv: ${profileData.location}. Qo'shimcha kanallar: ${socialNames}.`
            : `You can reach me via ${profileData.email} or ${profileData.phone}. ${resolveText(profileData.availability, locale)}. Location: ${profileData.location}. Additional channels: ${socialNames}.`,
          [
            copyAction(locale === 'uz' ? 'Emaildan nusxa olish' : 'Copy email', profileData.email),
            copyAction(locale === 'uz' ? 'Telefon raqamini nusxalash' : 'Copy phone number', profileData.phone),
            ...siteData.socials.map((item) => externalAction(item.name, item.href))
          ]
        );
      }
      case 'admin':
        return createAssistantMessage(resolveText(intent.reply, locale), [
          routeAction(locale === 'uz' ? 'Kirish sahifasini ochish' : 'Open sign-in page', '/auth/sign-in'),
          routeAction(locale === 'uz' ? 'Admin bo‘limini ochish' : 'Open admin area', '/admin')
        ]);
      default:
        return createAssistantMessage(resolveText(intent.reply, locale), intent.actions);
    }
  };

  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTo({top: scrollRef.current.scrollHeight, behavior: 'smooth'});
  }, [messages]);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const syncPosition = () => {
      const activeElement = open ? panelRef.current : bubbleRef.current;
      const width = activeElement?.offsetWidth ?? bubbleSize;
      const height = activeElement?.offsetHeight ?? bubbleSize;
      const nextPosition = clampPositionToViewport(storedPosition, width, height);

      if (nextPosition.x !== storedPosition.x || nextPosition.y !== storedPosition.y) {
        writeStoredPosition(nextPosition);
      }
    };

    const frameId = window.requestAnimationFrame(syncPosition);
    window.addEventListener('resize', syncPosition);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener('resize', syncPosition);
    };
  }, [open, storedPosition]);

  const style = useMemo(
    () => ({right: `${storedPosition.x}px`, bottom: `${storedPosition.y}px`}),
    [storedPosition]
  );

  function onPointerDown(event: React.PointerEvent<HTMLButtonElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    dragOffset.current = {x: event.clientX - bounds.left, y: event.clientY - bounds.top};

    const handleMove = (moveEvent: PointerEvent) => {
      const x = Math.max(16, window.innerWidth - moveEvent.clientX - (bounds.width - dragOffset.current.x));
      const y = Math.max(16, window.innerHeight - moveEvent.clientY - (bounds.height - dragOffset.current.y));

      writeStoredPosition({
        x: Math.min(window.innerWidth - 72, x),
        y: Math.min(window.innerHeight - 72, y)
      });
    };

    const stop = () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', stop);
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', stop);
  }

  function resolveActionLabel(action: ChatAction) {
    return resolveText(action.label, locale);
  }

  function pushExchange(input: string, displayText = input) {
    if (!input.trim()) return;

    const userMessage: ChatMessage = {
      id: createMessageId('user'),
      role: 'user',
      text: displayText.trim()
    };

    const intent = findBestIntent(input.trim());
    const assistantMessage = intent
      ? getIntentResponse(intent)
      : createAssistantMessage(resolveText(knowledgeData.fallback, locale), [
          quickPrompts[0],
          quickRoutes[1],
          quickRoutes[2]
        ]);

    setMessages((current) => [...current, userMessage, assistantMessage]);
    setMessage('');
  }

  function handleAction(action: ChatAction) {
    const label = resolveActionLabel(action);

    switch (action.type) {
      case 'prompt':
        pushExchange(action.value ?? label, label);
        break;
      case 'route':
        if (!action.href) return;
        router.push(action.href);
        setOpen(false);
        break;
      case 'external':
        if (!action.href) return;
        window.open(action.href, '_blank', 'noopener,noreferrer');
        break;
      case 'copy':
        if (!action.value) return;
        if (typeof navigator !== 'undefined' && navigator.clipboard) {
          void navigator.clipboard.writeText(action.value);
        }
        setMessages((current) => [...current, createAssistantMessage(t('copied'))]);
        break;
    }
  }

  return (
    <div ref={rootRef} className="fixed z-[60]" style={style}>
      {open ? (
        <div
          ref={panelRef}
          className="mb-3 flex w-[min(26rem,calc(100vw-1rem))] max-h-[min(calc(100dvh-5.5rem),40rem)] flex-col overflow-hidden rounded-[24px] border backdrop-blur-xl sm:mb-4 sm:w-[min(26rem,calc(100vw-2rem))] sm:rounded-[28px]"
          style={{
            background: 'var(--elevated)',
            borderColor: 'var(--border-1)',
            boxShadow: '0 24px 80px rgba(2,6,23,0.20)'
          }}
        >
          <div className="flex shrink-0 items-center justify-between border-b px-3 py-3 sm:px-4" style={{borderColor: 'var(--border-1)'}}>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" style={{color: 'var(--accent)'}} />
              <div>
                <p className="text-sm font-semibold" style={{color: 'var(--text-1)'}}>{t('title')}</p>
                <p className="hidden text-[11px] sm:block" style={{color: 'var(--text-4)'}}>{t('subtitle')}</p>
              </div>
            </div>
            <button
              type="button"
              aria-label={t('closeAssistant')}
              className="cursor-pointer rounded-full p-2 transition hover:bg-white/10"
              style={{color: 'var(--text-3)'}}
              onClick={() => setOpen(false)}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="shrink-0 border-b px-3 py-2 sm:px-4" style={{borderColor: 'var(--border-1)'}}>
            <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em]" style={{color: 'var(--accent)'}}>
              <Compass className="h-3.5 w-3.5" />
              <span>{t('suggestedActions')}</span>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {compactActions.map((action) => (
                <button
                  key={`${action.type}-${action.value ?? action.href ?? resolveActionLabel(action)}`}
                  type="button"
                  onClick={() => handleAction(action)}
                  className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-medium transition hover:-translate-y-0.5"
                  style={
                    action.type === 'route'
                      ? {
                          borderColor: 'rgba(8,145,178,0.25)',
                          background: 'var(--accent-m)',
                          color: 'var(--accent)'
                        }
                      : {
                          borderColor: 'var(--border-1)',
                          background: 'var(--surface-1)',
                          color: 'var(--text-2)'
                        }
                  }
                >
                  {resolveActionLabel(action)}
                  {action.type === 'route' ? <ArrowUpRight className="h-3.5 w-3.5" /> : null}
                </button>
              ))}
            </div>
          </div>

          <div ref={scrollRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto px-3 py-3 sm:px-4 sm:py-4">
            {messages.map((item) => (
              <div key={item.id} className={cn('space-y-2', item.role === 'user' ? 'ml-auto max-w-[86%]' : 'max-w-[88%]')}>
                <div
                  className={cn('rounded-2xl px-3 py-2 text-sm leading-6', item.role === 'user' ? 'ml-auto' : '')}
                  style={
                    item.role === 'assistant'
                      ? {background: 'var(--surface-2)', color: 'var(--text-1)'}
                      : {background: 'var(--accent)', color: 'var(--accent-fg)'}
                  }
                >
                  {item.text}
                </div>

                {item.role === 'assistant' && item.actions?.length ? (
                  <div className="flex flex-wrap gap-2">
                    {item.actions.map((action) => (
                      <button
                        key={`${item.id}-${action.type}-${action.value ?? action.href ?? resolveActionLabel(action)}`}
                        type="button"
                        onClick={() => handleAction(action)}
                        className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition hover:-translate-y-0.5"
                        style={{
                          borderColor: 'var(--border-1)',
                          background: 'var(--surface-1)',
                          color: 'var(--text-2)'
                        }}
                      >
                        {action.type === 'copy' ? <Copy className="h-3.5 w-3.5" /> : <ArrowUpRight className="h-3.5 w-3.5" />}
                        {resolveActionLabel(action)}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </div>

          <div className="shrink-0 border-t p-3 sm:p-4" style={{borderColor: 'var(--border-1)'}}>
            <div className="flex items-center gap-2 rounded-2xl border px-3 py-2" style={{borderColor: 'var(--border-1)', background: 'var(--surface-1)'}}>
              <input
                className="w-full bg-transparent text-sm outline-none"
                style={{color: 'var(--text-1)'}}
                placeholder={t('placeholder')}
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    pushExchange(message);
                  }
                }}
              />
              <button
                type="button"
                aria-label={t('send')}
                onClick={() => pushExchange(message)}
                className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full transition hover:opacity-90"
                style={{background: 'var(--accent)', color: 'var(--accent-fg)'}}
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-2 hidden text-[11px] sm:block" style={{color: 'var(--text-4)'}}>{t('hint')}</p>
          </div>
        </div>
      ) : null}

      <button
        ref={bubbleRef}
        type="button"
        onPointerDown={onPointerDown}
        onClick={() => setOpen((prev) => !prev)}
        className="group flex h-14 w-14 cursor-grab items-center justify-center rounded-full border transition hover:scale-[1.03] active:cursor-grabbing sm:h-16 sm:w-16"
        style={{
          borderColor: 'rgba(8,145,178,0.28)',
          background: 'var(--accent)',
          color: 'var(--accent-fg)',
          boxShadow: '0 12px 40px rgba(8,145,178,0.24)'
        }}
        aria-label={open ? t('closeAssistant') : t('openAssistant')}
      >
        <div className="relative">
          <MessageCircle className="h-7 w-7 transition group-hover:rotate-6" />
          <Move
            className="absolute -right-2 -top-2 h-3.5 w-3.5 rounded-full p-0.5"
            style={{background: 'rgba(2,6,23,0.12)', color: 'currentColor'}}
          />
        </div>
      </button>
    </div>
  );
}
