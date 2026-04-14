/**
 * Generate a PDF of the CV.
 * Spins up the preview server, navigates Puppeteer to it, then exports PDF.
 * Usage: node generate-pdf.mjs [output-path]
 * Example: node generate-pdf.mjs output/pedro-amaral-cv.pdf
 */

import http from "http";
import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import yaml from "js-yaml";
import nunjucks from "nunjucks";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const CHROME_PATH =
  process.env.CHROME_PATH ||
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const PORT = 4001;
const outputArg = process.argv[2] || "assets/cv.pdf";
const outputPath = path.resolve(__dirname, outputArg);

fs.mkdirSync(path.dirname(outputPath), { recursive: true });

// ── Shared render logic (same as preview.mjs) ─────────────────
function loadData() {
  const dataDir = path.join(__dirname, "_data");
  return {
    profile:        yaml.load(fs.readFileSync(path.join(dataDir, "profile.yaml"), "utf8")),
    experience:     yaml.load(fs.readFileSync(path.join(dataDir, "experience.yaml"), "utf8")),
    skills:         yaml.load(fs.readFileSync(path.join(dataDir, "skills.yaml"), "utf8")),
    education:      yaml.load(fs.readFileSync(path.join(dataDir, "education.yaml"), "utf8")),
    certifications: yaml.load(fs.readFileSync(path.join(dataDir, "certifications.yaml"), "utf8")),
  };
}

// Import the template string from preview.mjs by reading the file
// Instead, share a common template module — for now inline it identically.
const TEMPLATE = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/assets/css/cv.css">
</head>
<body>
<div class="cv">

  <header class="cv-header">
    <div class="cv-header__identity">
      <h1>{{ data.profile.name }}</h1>
      <p class="cv-header__title">{{ data.profile.title }}</p>
    </div>
    <div class="cv-header__contact">
      <span>{{ data.profile.contact.email }}</span>
      <span>{{ data.profile.contact.location }}</span>
    </div>
  </header>

  <div class="cv-body">
    <aside class="cv-sidebar">

      <section class="cv-section">
        <h2>Skills</h2>
        <div class="cv-skills">
          <h3>Leadership</h3>
          <ul>{% for skill in data.skills.leadership %}<li>{{ skill }}</li>{% endfor %}</ul>
          <h3>Engineering</h3>
          <ul>{% for skill in data.skills.engineering %}<li>{{ skill }}</li>{% endfor %}</ul>
        </div>
      </section>

      <section class="cv-section">
        <h2>Education</h2>
        {% for edu in data.education %}
        <div class="cv-education">
          <strong>{{ edu.degree }}</strong>
          <span class="cv-meta">{{ edu.institution }}</span>
          <span class="cv-meta">{{ edu.start }}–{{ edu.end }}</span>
          {% if edu.thesis %}<span class="cv-meta cv-thesis">Thesis: {{ edu.thesis }}</span>{% endif %}
        </div>
        {% endfor %}
      </section>

      <section class="cv-section">
        <h2>Languages</h2>
        <ul>
          {% for lang in data.profile.languages %}
          <li>{{ lang.name }} <span class="cv-meta">({{ lang.level }})</span></li>
          {% endfor %}
        </ul>
      </section>

      <section class="cv-section">
        <h2>Certifications</h2>
        <ul>
          {% for cert in data.certifications %}{% if cert.type != "Publication" %}
          <li>{{ cert.name }}<span class="cv-meta">{% if cert.issuer %} · {{ cert.issuer }}{% endif %}{% if cert.type %} · {{ cert.type }}{% endif %}</span></li>
          {% endif %}{% endfor %}
        </ul>
      </section>

      <section class="cv-section">
        <h2>Interests</h2>
        <p class="cv-interests">{{ data.profile.interests | join(" · ") }}</p>
      </section>

    </aside>

    <main class="cv-main">

      <section class="cv-section">
        <h2>Summary</h2>
        <p>{{ data.profile.summary }}</p>
      </section>

      <section class="cv-section">
        <h2>Experience</h2>
        {% for job in data.experience %}
        <div class="cv-job">
          <div class="cv-job__header">
            <div>
              <span class="cv-job__company">{{ job.company }}</span>
              {% if job.client %}<span class="cv-job__client"> · {{ job.client }}</span>{% endif %}
              {% if job.note %}<span class="cv-meta"> ({{ job.note }})</span>{% endif %}
            </div>
            <div class="cv-job__meta">
              <span class="cv-job__role">{{ job.role }}</span>
              <span class="cv-job__dates">{{ job.start | replace("-", "/") }} – {{ job.end | replace("-", "/") }}</span>
            </div>
          </div>
          <p class="cv-job__summary">{{ job.summary }}</p>
          {% if job.technologies %}
          <p class="cv-job__tech">{% for tech in job.technologies %}<span class="cv-tag">{{ tech }}</span>{% endfor %}</p>
          {% endif %}
          {% if job.projects %}
          <ul class="cv-projects">
            {% for project in job.projects %}
            <li>
              <strong>{{ project.name }}</strong>
              {% if project.role %}<span class="cv-meta"> · {{ project.role }}</span>{% endif %}
              — {{ project.description }}
              {% if project.technologies %}
              <span class="cv-project-tech">{% for tech in project.technologies %}<span class="cv-tag">{{ tech }}</span>{% endfor %}</span>
              {% endif %}
            </li>
            {% endfor %}
          </ul>
          {% endif %}
        </div>
        {% endfor %}
      </section>

      {% set pub = data.certifications | selectattr("type", "equalto", "Publication") | first %}
      {% if pub %}
      <section class="cv-section">
        <h2>Publication</h2>
        <p class="cv-publication">{{ pub.authors }} "{{ pub.name }}". {{ pub.venue }}, {{ pub.year }}.</p>
      </section>
      {% endif %}

    </main>
  </div>
</div>
</body>
</html>`;

// ── Spin up a local server so Puppeteer has a real origin ──────
function startServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      if (req.url === "/assets/css/cv.css") {
        const css = fs.readFileSync(path.join(__dirname, "assets/css/cv.css"), "utf8");
        res.writeHead(200, { "Content-Type": "text/css" });
        return res.end(css);
      }
      const data = loadData();
      const html = nunjucks.renderString(TEMPLATE, { data });
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(html);
    });
    server.listen(PORT, () => resolve(server));
  });
}

async function generate() {
  const server = await startServer();

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ["--no-sandbox"],
  });

  try {
    const page = await browser.newPage();
    await page.emulateMediaType("screen");
    await page.goto(`http://localhost:${PORT}`, { waitUntil: "networkidle0" });

    await page.pdf({
      path: outputPath,
      format: "A4",
      printBackground: true,
      margin: { top: "12mm", bottom: "12mm", left: "10mm", right: "10mm" },
    });

    console.log(`PDF generated: ${outputPath}`);
  } finally {
    await browser.close();
    server.close();
  }
}

generate().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
