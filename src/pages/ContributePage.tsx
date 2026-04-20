import { useTranslation } from "react-i18next"
import {
  ArrowRight,
  Image as ImageIcon,
  Link as LinkIcon,
  ExternalLink,
  ListChecks,
  GitPullRequest,
  Sparkles,
} from "lucide-react"
import { motion, useReducedMotion } from "motion/react"

const BASE = import.meta.env.BASE_URL
const REPO_URL = "https://github.com/jonasN5/jonasN5.github.io"
const NEW_ISSUE_URL = `${REPO_URL}/issues/new/choose`
const ACTIONS_URL = `${REPO_URL}/actions`
const ISSUES_URL = `${REPO_URL}/issues`

export function ContributePage() {
  const { t } = useTranslation()
  const reduceMotion = useReducedMotion()
  const fadeUp = reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }

  return (
    <div className="pb-16">
      <section className="px-6 sm:px-10 pt-10 max-w-3xl lg:max-w-5xl mx-auto">
        <p className="text-[10px] uppercase tracking-[0.25em] text-outline font-body mb-3">
          {t("contribute.heroKicker")}
        </p>
        <h1 className="font-headline text-4xl sm:text-5xl text-primary font-bold tracking-[-0.02em] leading-[1.05] mb-5">
          {t("contribute.heroTitle")}
        </h1>
        <p className="text-sm sm:text-base text-foreground/80 leading-relaxed max-w-2xl">
          {t("contribute.intro")}
        </p>
      </section>

      <Step
        number={1}
        title={t("contribute.step1Title")}
        body={t("contribute.step1Body")}
        fadeUp={fadeUp}
      >
        <a
          href={NEW_ISSUE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 gradient-primary text-primary-foreground rounded-full px-5 py-2.5 text-sm font-semibold hover:opacity-90 transition-opacity mb-5"
        >
          <ExternalLink className="h-4 w-4" />
          {t("contribute.step1Cta")}
          <ArrowRight className="h-4 w-4" />
        </a>
        <Screenshot
          src={`${BASE}images/contribute/01-issues-tab.png`}
          alt="GitHub Issues tab with the New issue button highlighted"
        />
      </Step>

      <Step
        number={2}
        title={t("contribute.step2Title")}
        body={t("contribute.step2Body")}
        fadeUp={fadeUp}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
          <TemplateCard
            icon={<ListChecks className="h-5 w-5" />}
            label={t("contribute.templateFormLabel")}
            title={t("contribute.templateFormTitle")}
            description={t("contribute.templateFormDesc")}
          />
          <TemplateCard
            icon={<ImageIcon className="h-5 w-5" />}
            label={t("contribute.templateFileLabel")}
            title={t("contribute.templateFileTitle")}
            description={t("contribute.templateFileDesc")}
          />
          <TemplateCard
            icon={<LinkIcon className="h-5 w-5" />}
            label={t("contribute.templateUrlLabel")}
            title={t("contribute.templateUrlTitle")}
            description={t("contribute.templateUrlDesc")}
          />
        </div>
        <Screenshot
          src={`${BASE}images/contribute/02-template-picker.png`}
          alt="GitHub issue template picker showing the three recipe templates"
        />
      </Step>

      <Step
        number={3}
        title={t("contribute.step3Title")}
        body={t("contribute.step3Body")}
        fadeUp={fadeUp}
      >
        <div className="space-y-6">
          <Screenshot
            src={`${BASE}images/contribute/03-form-filled.png`}
            alt="Structured recipe form filled with the apple tart example"
            caption={t("contribute.exampleFormTitle")}
          />
          <Screenshot
            src={`${BASE}images/contribute/04-file-filled.png`}
            alt="File submission form filled with the lasagne example"
            caption={t("contribute.exampleFileTitle")}
          />
          <Screenshot
            src={`${BASE}images/contribute/05-url-filled.png`}
            alt="URL submission form filled with the clafoutis example"
            caption={t("contribute.exampleUrlTitle")}
          />
        </div>
      </Step>

      <Step
        number={4}
        title={t("contribute.step4Title")}
        body={t("contribute.step4Body")}
        fadeUp={fadeUp}
        icon={<Sparkles className="h-5 w-5 text-primary" />}
      >
        <a
          href={ACTIONS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm text-primary font-semibold hover:underline"
        >
          {t("contribute.linkActions")}
          <ArrowRight className="h-3.5 w-3.5" />
        </a>
      </Step>

      <Step
        number={5}
        title={t("contribute.step5Title")}
        body={t("contribute.step5Body")}
        fadeUp={fadeUp}
        icon={<GitPullRequest className="h-5 w-5 text-primary" />}
      />

      <motion.section
        className="px-6 sm:px-10 pt-10 max-w-3xl lg:max-w-5xl mx-auto"
        initial={fadeUp}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <h2 className="font-headline text-xl font-bold text-primary tracking-[-0.02em] mb-4">
          {t("contribute.linksTitle")}
        </h2>
        <ul className="space-y-2 text-sm">
          <li>
            <a href={REPO_URL} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1.5">
              <ExternalLink className="h-3.5 w-3.5" /> {t("contribute.linkRepo")}
            </a>
          </li>
          <li>
            <a href={ISSUES_URL} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              → {t("contribute.linkIssues")}
            </a>
          </li>
          <li>
            <a href={ACTIONS_URL} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              → {t("contribute.linkActions")}
            </a>
          </li>
        </ul>
        <p className="text-xs text-muted-foreground mt-8">
          {t("contribute.thanks")}{" "}
          <a
            href="https://github.com/PierrickMartos/Cucina-Mia"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            PierrickMartos/Cucina-Mia
          </a>{" "}
          {t("contribute.thanksDetail")}
        </p>
      </motion.section>
    </div>
  )
}

interface StepProps {
  number: number
  title: string
  body: string
  children?: React.ReactNode
  icon?: React.ReactNode
  fadeUp: { opacity: number; y: number }
}

function Step({ number, title, body, children, icon, fadeUp }: StepProps) {
  return (
    <motion.section
      className="px-6 sm:px-10 pt-10 max-w-3xl lg:max-w-5xl mx-auto"
      initial={fadeUp}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div className="flex items-start gap-4 mb-4">
        <div className="shrink-0 w-9 h-9 rounded-full gradient-primary text-primary-foreground flex items-center justify-center font-headline font-bold text-lg">
          {number}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-headline text-xl sm:text-2xl font-bold text-primary tracking-[-0.02em] flex items-center gap-2">
            {icon}
            {title}
          </h2>
          <p className="text-sm sm:text-base text-foreground/80 leading-relaxed mt-2">{body}</p>
        </div>
      </div>
      {children && <div>{children}</div>}
    </motion.section>
  )
}

function TemplateCard({
  icon,
  label,
  title,
  description,
}: {
  icon: React.ReactNode
  label: string
  title: string
  description: string
}) {
  return (
    <article className="bg-surface-high rounded-2xl p-5 flex flex-col gap-2 border border-outline/10">
      <div className="flex items-center gap-2 text-primary">
        {icon}
        <span className="text-[10px] uppercase tracking-widest font-semibold">{label}</span>
      </div>
      <h3 className="font-headline text-lg font-bold text-foreground tracking-[-0.02em]">{title}</h3>
      <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
    </article>
  )
}

function Screenshot({
  src,
  alt,
  caption,
}: {
  src: string
  alt: string
  caption?: string
}) {
  return (
    <figure className="bg-surface-high rounded-2xl overflow-hidden border border-outline/10 shadow-ambient">
      {caption && (
        <figcaption className="bg-surface-container/60 px-5 py-3 border-b border-outline/10 flex items-center gap-2">
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-400/60" />
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-400/60" />
            <span className="w-2.5 h-2.5 rounded-full bg-green-400/60" />
          </div>
          <span className="text-xs font-semibold text-foreground/70 ml-2">{caption}</span>
        </figcaption>
      )}
      <a href={src} target="_blank" rel="noopener noreferrer" className="block">
        <img
          src={src}
          alt={alt}
          loading="lazy"
          className="w-full h-auto block bg-white"
        />
      </a>
    </figure>
  )
}
