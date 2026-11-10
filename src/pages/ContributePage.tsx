import { useTranslation } from "react-i18next"
import {
  ArrowRight,
  ClipboardPaste,
  ExternalLink,
  GitPullRequest,
  Sparkles,
} from "lucide-react"
import { motion, useReducedMotion } from "motion/react"

const REPO_URL = "https://github.com/jonasN5/jonasN5.github.io"
// Opens the "Recette (texte)" form directly (.github/ISSUE_TEMPLATE/recette.yml).
const NEW_RECIPE_URL = `${REPO_URL}/issues/new?template=recette.yml`
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
          href={NEW_RECIPE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 gradient-primary text-primary-foreground rounded-full px-5 py-2.5 text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          <ExternalLink className="h-4 w-4" />
          {t("contribute.step1Cta")}
          <ArrowRight className="h-4 w-4" />
        </a>
      </Step>

      <Step
        number={2}
        title={t("contribute.step2Title")}
        body={t("contribute.step2Body")}
        fadeUp={fadeUp}
        icon={<ClipboardPaste className="h-5 w-5 text-primary" />}
      />

      <Step
        number={3}
        title={t("contribute.step3Title")}
        body={t("contribute.step3Body")}
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
        number={4}
        title={t("contribute.step4Title")}
        body={t("contribute.step4Body")}
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
