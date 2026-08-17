"use client";

import { AutomationToolList } from "./automation-tools";
import { HeroVisual3D } from "./hero-visual-3d";
import { useLocale } from "./locale-provider";
import { PageMotion } from "./page-motion";
import { RoleAccordion } from "./role-accordion";
import { SiteHeader } from "./site-header";
import { StoryRetell } from "./story-retell";
import { WorkflowMap } from "./workflow-map";
import { ZoomableImage } from "./zoomable-image";

const TEAM_PAGE = "https://dcmvn.com/meet-the-team-huys-team/";
const DCMVN = "https://dcmvn.com/";
const PRODUCTIVITY =
  "https://huydamdcmvn.github.io/digital-lead-dashboards/annotation_digital_productivity_dashboard.html?v=20260812143800";

function SectionHeading({
  eyebrow,
  title,
  text,
}: {
  eyebrow: string;
  title: string;
  text?: string;
}) {
  return (
    <div className="section-heading">
      <p className="eyebrow">{eyebrow}</p>
      <h2>{title}</h2>
      {text ? <p className="section-intro">{text}</p> : null}
    </div>
  );
}

export function HomeView() {
  const { t } = useLocale();

  return (
    <PageMotion id="top">
      <SiteHeader />

      <main id="content">

        <section className="hero">
          <div className="hero-grid" />
          <div className="hero-copy">
            <p className="kicker">
              <span /> {t.hero.kicker}
            </p>
            <h1>{t.hero.title}</h1>
            <p className="hero-lede">{t.hero.lede}</p>
            <div className="hero-actions">
              <a className="button button-primary" href="#capabilities">
                {t.hero.explore}
              </a>
              <a className="button button-ghost" href="/welcome">
                {t.nav.welcome}
              </a>
              <a
                className="button button-ghost"
                href={TEAM_PAGE}
                target="_blank"
                rel="noopener noreferrer"
              >
                {t.hero.meet} <span aria-hidden="true">↗</span>
              </a>
            </div>
            <div className="hero-tags" aria-label={t.capabilities.eyebrow}>
              <a href="#capabilities">{t.hero.tags.standards}</a>
              <a href="#training">{t.hero.tags.training}</a>
              <a href="#automation">{t.hero.tags.automation}</a>
              <a href="#visualization">{t.hero.tags.visualization}</a>
            </div>
          </div>
          <div className="hero-visual" aria-label={t.hero.visual}>
            <HeroVisual3D />
          </div>
          <div className="hero-index" aria-hidden="true">
            01
          </div>
        </section>

        <section className="story section" id="story">
          <div className="section-shell">
            <SectionHeading eyebrow={t.story.eyebrow} title={t.story.title} text={t.story.text} />
            <div className="story-layout">
              <StoryRetell />
            </div>
          </div>
        </section>

        <section className="coordinator section section-dark" id="coordinator">
          <div className="section-shell coordinator-layout">
            <div>
              <SectionHeading
                eyebrow={t.coordinator.eyebrow}
                title={t.coordinator.title}
                text={t.coordinator.text}
              />
              <div data-animate>
                <RoleAccordion
                  items={t.coordinator.roles.map(([number, title, text]) => ({
                    number,
                    title,
                    text,
                  }))}
                  label={t.coordinator.rolesLabel}
                  expandLabel={t.coordinator.expand}
                  collapseLabel={t.coordinator.collapse}
                />
              </div>
            </div>
            <div className="coordinator-visuals" data-animate-stagger>
              <figure className="coordinator-visual">
                <img src="/images/coordinator-role.png" alt={t.coordinator.img1} loading="lazy" />
              </figure>
              <figure className="coordinator-visual">
                <img src="/images/digital-coordinator.png" alt={t.coordinator.img2} loading="lazy" />
              </figure>
            </div>
          </div>
        </section>

        <section className="capabilities section" id="capabilities">
          <div className="section-shell">
            <SectionHeading
              eyebrow={t.capabilities.eyebrow}
              title={t.capabilities.title}
              text={t.capabilities.text}
            />
            <div className="capability-grid" data-animate-stagger>
              {t.capabilities.items.map((item) => {
                const featured = "href" in item && item.href;
                const body = (
                  <>
                    <span className="capability-code">{item.code}</span>
                    <h3>{item.title}</h3>
                    <p>{item.text}</p>
                    {"cta" in item && item.cta ? <span className="card-cta">{item.cta}</span> : null}
                    <span className="card-line" />
                  </>
                );
                if (featured && "external" in item && item.external) {
                  return (
                    <a
                      className="capability-card is-featured"
                      key={item.code}
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {body}
                    </a>
                  );
                }
                if (featured) {
                  return (
                    <a className="capability-card is-featured" key={item.code} href={item.href}>
                      {body}
                    </a>
                  );
                }
                return (
                  <article className="capability-card" key={item.code}>
                    {body}
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="training section" id="training">
          <div className="section-shell">
            <SectionHeading eyebrow={t.training.eyebrow} title={t.training.title} text={t.training.text} />
            <div className="training-grid" data-animate-stagger>
              <article className="training-feature">
                <div className="training-title">
                  <span>D</span>
                  <div>
                    <p>{t.training.dynamo}</p>
                    <h3>Dynamo</h3>
                  </div>
                </div>
                <ol>
                  {t.training.dynamoSteps.map((step, index) => (
                    <li key={step}>
                      <span>{String(index + 1).padStart(2, "0")}</span>
                      {step}
                    </li>
                  ))}
                </ol>
              </article>
              <article className="training-feature training-feature-light">
                <div className="training-title">
                  <span className="training-mark" aria-hidden="true">
                    R
                  </span>
                  <div>
                    <p>{t.training.skillsLabel}</p>
                    <h3>Revit</h3>
                  </div>
                </div>
                <div className="training-links">
                  <a href="https://rfa.dcm-vn.com/home" target="_blank" rel="noopener noreferrer">
                    {t.familyApp} <span aria-hidden="true">↗</span>
                  </a>
                  <a href="/skills-survey">{t.skillsSurvey}</a>
                </div>
                <div className="skill-cloud">
                  {t.training.skillTags.map((skill) => (
                    <span key={skill}>{skill}</span>
                  ))}
                </div>
                <p className="training-note">{t.training.revitNote}</p>
              </article>
              <article className="training-guides">
                <p className="mini-label">{t.training.guidesLabel}</p>
                <h3>{t.training.guidesTitle}</h3>
                <ul>
                  {t.training.guides.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>
            </div>
          </div>
        </section>

        <section className="automation section section-dark" id="automation">
          <div className="section-shell automation-layout">
            <div>
              <SectionHeading
                eyebrow={t.automation.eyebrow}
                title={t.automation.title}
                text={t.automation.text}
              />
              <AutomationToolList />
            </div>
            <figure className="automation-visual" data-animate>
              <ZoomableImage
                className="automation-visual-zoom"
                src="/images/automation-tools.png"
                alt={t.automation.visualAlt}
                title={t.automation.visualTitle}
                closeLabel={t.close}
                viewLabel={`${t.viewFullImage}: ${t.automation.visualAlt}`}
              />
              <figcaption>
                <span>Python</span>
                <span>C#</span>
                <span>Revit</span>
              </figcaption>
            </figure>
          </div>
        </section>

        <section className="visualization section" id="visualization">
          <div className="section-shell">
            <SectionHeading
              eyebrow={t.visualization.eyebrow}
              title={t.visualization.title}
              text={t.visualization.text}
            />
            <div className="visual-gallery" data-animate-stagger>
              <figure className="visual-card visual-card-wide">
                <ZoomableImage
                  className="visual-card-zoom"
                  src="/images/tableau-overview.png"
                  alt={t.visualization.tableau.alt}
                  title={t.visualization.tableau.title}
                  code="01"
                  closeLabel={t.close}
                  viewLabel={`${t.viewFullImage}: ${t.visualization.tableau.alt}`}
                />
                <figcaption>
                  <span>01</span>
                  <div>
                    <strong>{t.visualization.tableau.title}</strong>
                    <p>
                      {t.visualization.tableau.text} · {t.snapshot}
                    </p>
                  </div>
                </figcaption>
              </figure>
              <figure className="visual-card">
                <a
                  href={PRODUCTIVITY}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={t.visualization.productivity.aria}
                >
                  <img src="/images/productivity-report.png" alt={t.visualization.productivity.alt} loading="lazy" />
                </a>
                <figcaption>
                  <span>02</span>
                  <div>
                    <strong>{t.visualization.productivity.title}</strong>
                    <p>
                      {t.visualization.productivity.text} · {t.liveDashboard}
                    </p>
                  </div>
                </figcaption>
              </figure>
              <figure className="visual-card">
                <ZoomableImage
                  className="visual-card-zoom"
                  src="/images/revit-dashboard.png"
                  alt={t.visualization.revit.alt}
                  title={t.visualization.revit.title}
                  code="03"
                  closeLabel={t.close}
                  viewLabel={`${t.viewFullImage}: ${t.visualization.revit.alt}`}
                />
                <figcaption>
                  <span>03</span>
                  <div>
                    <strong>{t.visualization.revit.title}</strong>
                    <p>
                      {t.visualization.revit.text} · {t.snapshot}
                    </p>
                  </div>
                </figcaption>
              </figure>
            </div>
          </div>
        </section>

        <section className="workflow section" id="workflow">
          <div className="section-shell">
            <SectionHeading eyebrow={t.workflow.eyebrow} title={t.workflow.title} text={t.workflow.text} />
            <div data-animate>
              <WorkflowMap />
            </div>
          </div>
        </section>

        <section className="case-study section section-dark" id="case-study">
          <div className="section-shell">
            <div className="case-intro" data-animate>
              <div>
                <p className="eyebrow">{t.caseStudy.eyebrow}</p>
                <h2>{t.caseStudy.title}</h2>
              </div>
              <p>{t.caseStudy.text}</p>
            </div>
            <figure className="case-workflow" data-animate>
              <ZoomableImage
                className="case-workflow-zoom"
                src="/images/munich-workflow.png"
                alt={t.caseStudy.workflowAlt}
                title={t.caseStudy.workflowTitle}
                closeLabel={t.close}
                viewLabel={`${t.viewFullImage}: ${t.caseStudy.workflowAlt}`}
              />
            </figure>
            <ol className="case-steps" data-animate-stagger>
              {t.caseStudy.steps.map((step, index) => (
                <li key={step}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  {step}
                </li>
              ))}
            </ol>
            <div className="case-gallery" data-animate-stagger>
              <figure className="case-gallery-large">
                <img src="/images/munich-models.png" alt={t.caseStudy.modelsAlt} loading="lazy" />
                <figcaption>{t.caseStudy.modelsCap}</figcaption>
              </figure>
              <figure>
                <img src="/images/munich-comparison.png" alt={t.caseStudy.comparisonAlt} loading="lazy" />
                <figcaption>{t.caseStudy.comparisonCap}</figcaption>
              </figure>
              <figure>
                <img src="/images/munich-validation.png" alt={t.caseStudy.validationAlt} loading="lazy" />
                <figcaption>{t.caseStudy.validationCap}</figcaption>
              </figure>
            </div>
            <div className="case-note">
              <p className="mini-label">{t.caseStudy.noteLabel}</p>
              <p>{t.caseStudy.note}</p>
            </div>
          </div>
        </section>

        <section className="contact section" id="contact">
          <div className="contact-glow" />
          <div className="section-shell contact-inner" data-animate>
            <p className="eyebrow">{t.contact.eyebrow}</p>
            <h2>{t.contact.title}</h2>
            <p>{t.contact.text}</p>
            <div className="contact-actions">
              <a
                className="button button-primary"
                href={TEAM_PAGE}
                target="_blank"
                rel="noopener noreferrer"
              >
                {t.contact.message} <span aria-hidden="true">↗</span>
              </a>
              <a className="text-link" href="#workflow">
                {t.contact.workflow}
              </a>
              <a className="text-link" href="#top">
                {t.contact.backTop} ↑
              </a>
            </div>
          </div>
        </section>

        <footer>
          <a href="#top" aria-label={t.brandHome}>
            <img src="/images/bkw-dcm-logo.svg" alt={t.brandAlt} />
          </a>
          <p>{t.footer.line}</p>
          <p>
            <a href={DCMVN} target="_blank" rel="noopener noreferrer">
              {t.dcmvn} ↗
            </a>
            {" · "}
            {t.footer.internal}
          </p>
        </footer>
      </main>
    </PageMotion>
  );
}
