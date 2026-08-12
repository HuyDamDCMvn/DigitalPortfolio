const capabilities = [
  {
    code: "01",
    title: "Standards & setup",
    text: "Naming conventions, data requirements, clash settings and project setup documents that create a shared starting point.",
  },
  {
    code: "02",
    title: "QA/QC & libraries",
    text: "Family audit workflows, checklists, QA templates and a managed Revit family library for consistent project use.",
  },
  {
    code: "03",
    title: "Training & enablement",
    text: "Structured learning paths for Dynamo, Revit and the digital tools used across project delivery.",
  },
  {
    code: "04",
    title: "Automation tools",
    text: "Python and C# tools that support repeatable Revit tasks, model checks and project-specific workflows.",
  },
  {
    code: "05",
    title: "Visualization & reporting",
    text: "Tableau, productivity reporting and model dashboards that turn project data into a clearer working view.",
  },
  {
    code: "06",
    title: "Data & IFC workflows",
    text: "Model extraction, PostgreSQL, analysis, IFC health checks and IDS validation in a connected process.",
  },
];

const timeline = [
  {
    step: "Embedded expertise",
    text: "Digital support begins close to day-to-day project delivery.",
  },
  {
    step: "Team formation",
    text: "BIM knowledge and coding capability grow into a shared team function.",
  },
  {
    step: "Broader contribution",
    text: "Coordinators and technical contributors expand the team’s coverage.",
  },
  {
    step: "Connected leadership",
    text: "Digital leadership aligns the team with MEP and datasheet workstreams.",
  },
];

const automationTools = [
  "Auto-connect and size sprinkler systems",
  "Create grid dimensions",
  "Toggle grid bubbles",
  "Manage and visualize spaces",
  "Create sections by element",
  "Assess model performance",
];

const munichSteps = [
  "Set up working model",
  "Run delivery workshop",
  "Create ARC comparison report",
  "Link the revised model",
  "Create or revise TBZ massing",
  "Validate quantity",
  "Validate tolerance",
  "Clean up and submit",
];

const storyChapters = [
  {
    code: "01",
    title: "Close to delivery",
    line: "Operations reviews and manual checks still sat next to day-to-day project work.",
    cue: "Manual → Digital",
    image: "/images/story-01-delivery.png",
    imageAlt: "A digital coordinator reviewing operations and manual tests at a desk",
  },
  {
    code: "02",
    title: "A team takes shape",
    line: "BIM knowledge and coding skill gather into a shared Digital Team practice.",
    cue: "Learn · BIM · Code",
    image: "/images/story-02-team.png",
    imageAlt: "The Digital Team learning BIM and coding together",
  },
  {
    code: "03",
    title: "More voices join",
    line: "Coordinators and technical contributors widen coverage across projects.",
    cue: "Capability grows",
    image: "/images/story-03-voices.png",
    imageAlt: "More team members joining the growing Digital Team",
  },
  {
    code: "04",
    title: "Connected leadership",
    line: "Digital Lead aligns MEP, structure and architecture through one working view.",
    cue: "MEP · Structure · Architecture",
    image: "/images/story-04-lead.png",
    imageAlt: "Digital Lead connecting MEP, structure and architecture in one view",
  },
];

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

export default function Home() {
  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Digital Team home">
          <img src="/images/bkw-dcm-logo.svg" alt="BKW Engineering — Digital Construction Management" />
        </a>
        <nav aria-label="Primary navigation">
          <a href="#story">Story</a>
          <a href="#capabilities">Capabilities</a>
          <a href="#workflow">Workflow</a>
          <a href="#case-study">Case study</a>
        </nav>
        <a className="header-cta" href="#contact">Work with us</a>
      </header>

      <section className="hero" id="top">
        <div className="hero-grid" />
        <div className="hero-copy">
          <p className="kicker"><span /> Digital Team · Engineering</p>
          <h1>Engineering better ways to work.</h1>
          <p className="hero-lede">
            We connect project standards, people, automation and data so digital delivery is easier to set up,
            support and review.
          </p>
          <div className="hero-actions">
            <a className="button button-primary" href="#capabilities">Explore our work <span aria-hidden="true">↗</span></a>
            <a className="button button-ghost" href="#story">Meet the team story</a>
          </div>
          <div className="hero-tags" aria-label="Team focus areas">
            <span>Standards</span><span>Training</span><span>Automation</span><span>Visualization</span>
          </div>
        </div>
        <div className="hero-visual" aria-label="Connected digital engineering system">
          <div className="hero-image-frame">
            <img src="/images/hero-system.png" alt="Connected building-services system visual from the team presentation" />
          </div>
        </div>
        <div className="hero-index" aria-hidden="true">01</div>
      </section>

      <section className="story section" id="story">
        <div className="section-shell">
          <SectionHeading
            eyebrow="Team story"
            title="From an embedded digital role to a connected team."
            text="The presentation traces a simple evolution: start close to project delivery, build shared capability, and connect that capability through digital leadership."
          />
          <div className="story-layout">
            <div className="story-retell" aria-label="Team growth told as four connected chapters">
              <p className="story-retell-kicker">Story retelling</p>
              <ol className="story-retell-path">
                {storyChapters.map((chapter, index) => (
                  <li key={chapter.code} className="story-retell-chapter">
                    <div className="story-retell-mark" aria-hidden="true">
                      <span>{chapter.code}</span>
                      {index < storyChapters.length - 1 ? <i /> : null}
                    </div>
                    <article>
                      <div className="story-retell-figure">
                        <img src={chapter.image} alt={chapter.imageAlt} loading="lazy" />
                      </div>
                      <p className="story-retell-cue">{chapter.cue}</p>
                      <h3>{chapter.title}</h3>
                      <p>{chapter.line}</p>
                    </article>
                  </li>
                ))}
              </ol>
              <p className="story-retell-end">From one embedded role to a connected Digital Lead view.</p>
            </div>
            <ol className="timeline">
              {timeline.map((item, index) => (
                <li key={item.step}>
                  <span className="timeline-number">0{index + 1}</span>
                  <div>
                    <h3>{item.step}</h3>
                    <p>{item.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="coordinator section section-dark">
        <div className="section-shell coordinator-layout">
          <div>
            <SectionHeading
              eyebrow="Digital Coordinator"
              title="The bridge between project needs and repeatable digital delivery."
              text="The coordinator keeps the digital layer practical: setting up the project, auditing quality, supporting automation and helping teams solve special cases."
            />
            <div className="role-list">
              {[
                ["01", "Initial setup", "Translate requirements into a usable project starting point."],
                ["02", "QA/QC audit", "Review models and families against agreed rules and checklists."],
                ["03", "Automation support", "Connect repeatable tasks with the right script or tool."],
                ["04", "Special-case support", "Work with delivery teams when a standard path is not enough."],
              ].map(([number, title, text]) => (
                <article key={number}>
                  <span>{number}</span>
                  <div><h3>{title}</h3><p>{text}</p></div>
                </article>
              ))}
            </div>
          </div>
          <div className="coordinator-visuals">
            <figure className="coordinator-visual">
              <img src="/images/coordinator-role.png" alt="Digital Coordinator roles: initial setup, QA/QC audit, automation support and special-case support" loading="lazy" />
            </figure>
            <figure className="coordinator-visual">
              <img src="/images/digital-coordinator.png" alt="Digital Coordinator connecting data across building-services systems" loading="lazy" />
            </figure>
          </div>
        </div>
      </section>

      <section className="capabilities section" id="capabilities">
        <div className="section-shell">
          <SectionHeading
            eyebrow="Capabilities"
            title="A practical digital layer across the project lifecycle."
            text="Our work spans standards, learning, tools and data—designed to stay connected to real delivery needs."
          />
          <div className="capability-grid">
            {capabilities.map((item) => (
              <article className="capability-card" key={item.code}>
                <span className="capability-code">{item.code}</span>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
                <span className="card-line" />
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="training section" id="training">
        <div className="section-shell">
          <SectionHeading
            eyebrow="Training"
            title="Build capability, then make it reusable."
            text="The team’s training material combines structured sessions, working examples and focused user guides."
          />
          <div className="training-grid">
            <article className="training-feature">
              <div className="training-title"><span>D</span><div><p>Learning path</p><h3>Dynamo</h3></div></div>
              <ol>
                <li><span>01</span>Overview and fundamentals</li>
                <li><span>02</span>Data operations in Dynamo</li>
                <li><span>03</span>Dynamo and Revit interaction</li>
                <li><span>04</span>Revit and spreadsheet data transfer</li>
                <li><span>05</span>Expanded scripts, DesignScript and UI</li>
              </ol>
            </article>
            <article className="training-feature training-feature-light">
              <div className="training-title"><span>R</span><div><p>Skills matrix</p><h3>Revit</h3></div></div>
              <div className="skill-cloud">
                {['Documentation','Worksharing','Families','Management','Modeling','Parameters','Views'].map((skill) => <span key={skill}>{skill}</span>)}
              </div>
              <p className="training-note">Training is organized around practical project skills and supporting material.</p>
            </article>
            <article className="training-guides">
              <p className="mini-label">Digital guides</p>
              <h3>Reference material for the tools around the model.</h3>
              <ul>
                <li>Autodesk Construction Cloud</li>
                <li>Linear dynamic cooling load</li>
                <li>SQL data queries</li>
                <li>AutoCAD Plant 3D</li>
                <li>AI essentials and prompt engineering for developers</li>
              </ul>
            </article>
          </div>
        </div>
      </section>

      <section className="automation section section-dark" id="automation">
        <div className="section-shell automation-layout">
          <div>
            <SectionHeading
              eyebrow="Automation"
              title="Tools shaped around repeatable project tasks."
              text="The presentation covers Python automation for sprinkler-system work and a C# toolset for model production, space workflows and performance review."
            />
            <div className="tool-list">
              {automationTools.map((tool, index) => (
                <div key={tool}><span>{String(index + 1).padStart(2, '0')}</span><p>{tool}</p></div>
              ))}
            </div>
          </div>
          <figure className="automation-visual">
            <img src="/images/automation-tools.png" alt="C# automation tools shown in the presentation" loading="lazy" />
            <figcaption><span>Python</span><span>C#</span><span>Revit</span></figcaption>
          </figure>
        </div>
      </section>

      <section className="visualization section" id="visualization">
        <div className="section-shell">
          <SectionHeading
            eyebrow="Data visualization"
            title="Turn project data into a working view."
            text="The source deck shows three reporting layers: team and task views in Tableau, digital productivity reporting, and Revit model dashboards."
          />
          <div className="visual-gallery">
            <figure className="visual-card visual-card-wide">
              <img src="/images/tableau-overview.png" alt="Tableau time tracking dashboard from the presentation" loading="lazy" />
              <figcaption><span>01</span><div><strong>Tableau overview</strong><p>Time and project activity in one view.</p></div></figcaption>
            </figure>
            <figure className="visual-card">
              <img src="/images/productivity-report.png" alt="Digital productivity report from the presentation" loading="lazy" />
              <figcaption><span>02</span><div><strong>Productivity report</strong><p>Annotation and workflow status.</p></div></figcaption>
            </figure>
            <figure className="visual-card">
              <img src="/images/revit-dashboard.png" alt="Revit model status dashboard from the presentation" loading="lazy" />
              <figcaption><span>03</span><div><strong>Revit dashboard</strong><p>Model status, QA/QC and level analysis.</p></div></figcaption>
            </figure>
          </div>
        </div>
      </section>

      <section className="workflow section" id="workflow">
        <div className="section-shell">
          <SectionHeading
            eyebrow="Workflow"
            title="A connected path from project setup to validated information."
            text="The presentation frames digital delivery as a sequence of reviewable processes, each with clear inputs, tasks and outputs."
          />
          <div className="workflow-map" aria-label="Digital workflow stages">
            {[
              ["01", "Initial setup", "Brief · review · validate · confirm · set up"],
              ["02", "Data scanning", "Export · store · prepare · analyze · visualize"],
              ["03", "IFC validation", "Health check · IDS compliance · quality report"],
            ].map(([number, title, text], index) => (
              <article key={number}>
                <span className="workflow-number">{number}</span>
                <div><h3>{title}</h3><p>{text}</p></div>
                {index < 2 ? <span className="workflow-arrow" aria-hidden="true">→</span> : null}
              </article>
            ))}
          </div>
          <div className="workflow-sources">
            <figure><img src="/images/initial-setup.png" alt="Initial setup process diagram" loading="lazy" /><figcaption>Initial setup process</figcaption></figure>
            <figure><img src="/images/data-scanning.png" alt="Data scanning process diagram" loading="lazy" /><figcaption>Data scanning process</figcaption></figure>
            <figure><img src="/images/ifc-platform.png" alt="IFC health check platform view" loading="lazy" /><figcaption>IFC health and validation</figcaption></figure>
          </div>
        </div>
      </section>

      <section className="case-study section section-dark" id="case-study">
        <div className="section-shell">
          <div className="case-intro">
            <div>
              <p className="eyebrow">Case study · Munich RE</p>
              <h2>Taboo Zone validation as a coordinated, reviewable workflow.</h2>
            </div>
            <p>
              The case study brings the team’s approach together: working-model setup, a delivery workshop,
              comparison reporting, Taboo Zone massing, quantity and tolerance checks, feedback loops and final submission.
            </p>
          </div>
          <figure className="case-workflow">
            <img src="/images/munich-workflow.png" alt="Munich RE Taboo Zone validation workflow" loading="lazy" />
          </figure>
          <ol className="case-steps">
            {munichSteps.map((step, index) => <li key={step}><span>{String(index + 1).padStart(2, '0')}</span>{step}</li>)}
          </ol>
          <div className="case-gallery">
            <figure className="case-gallery-large"><img src="/images/munich-models.png" alt="Munich RE model views for existing and new construction" loading="lazy" /><figcaption>Coordinated model views</figcaption></figure>
            <figure><img src="/images/munich-comparison.png" alt="ARC comparison views used in the Munich RE case study" loading="lazy" /><figcaption>Comparison setup</figcaption></figure>
            <figure><img src="/images/munich-validation.png" alt="IDS validation summary shown in the presentation" loading="lazy" /><figcaption>Validation summary</figcaption></figure>
          </div>
          <div className="case-note">
            <p className="mini-label">What the presentation shows</p>
            <p>A documented handoff between Digital and MEP teams, with defined exchanges, checks and feedback paths.</p>
          </div>
        </div>
      </section>

      <section className="contact section" id="contact">
        <div className="contact-glow" />
        <div className="section-shell contact-inner">
          <p className="eyebrow">Start a conversation</p>
          <h2>Bring the Digital Team in early.</h2>
          <p>For project setup, workflow reviews, training or automation support, connect with the team through your existing project channel.</p>
          <div className="contact-actions">
            <a className="button button-primary" href="#workflow">Review our workflow <span aria-hidden="true">↗</span></a>
            <a className="text-link" href="#top">Back to top ↑</a>
          </div>
        </div>
      </section>

      <footer>
        <img src="/images/bkw-dcm-logo.svg" alt="BKW Engineering — Digital Construction Management" />
        <p>Digital Team portfolio · Content adapted from “Digital, Introduction, Workflow”.</p>
        <p>Internal presentation</p>
      </footer>
    </main>
  );
}
