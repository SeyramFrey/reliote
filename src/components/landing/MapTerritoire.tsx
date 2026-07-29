"use client";
import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { SectionHead } from "./SectionHead";

type Feed = { t: string; label: string; place: string };

// Monde ⇄ Afrique cartography corridor (V7-adapted) with a live UTC chart.
export function MapTerritoire() {
  const locale = useLocale();
  const t = useTranslations("landing.territoire");
  const feed = t.raw("feed") as Feed[];

  const [utc, setUtc] = useState("--:--");
  useEffect(() => {
    const tick = () => {
      const d = new Date();
      const h = String(d.getUTCHours()).padStart(2, "0");
      const m = String(d.getUTCMinutes()).padStart(2, "0");
      setUtc(`${h}:${m}`);
    };
    tick();
    const id = setInterval(tick, 30 * 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="sect territoire-sect" id="territoire">
      <SectionHead
        num={t("eyebrow")}
        titlePre={t("titlePre")}
        titleItalic={t("titleItalic")}
        titleRest={t("titleRest")}
        kicker={t("kicker")}
      />
      <div className="territoire-frame">
        <div className="territoire-map">
          <span className="t-coord tl">
            A · MONDE
            <br />
            <b>PORTEUR DE PROJET</b>
          </span>
          <span className="t-coord tr">
            B · AFRIQUE
            <br />
            <b>CHANTIER</b>
          </span>
          <span className="t-coord bl">
            CANAL · A → B
            <br />
            <b>MONDE → AFRIQUE</b>
          </span>
          <span className="t-coord br">
            {t("liveChart")}
            <br />
            <b>UTC {utc}</b>
          </span>

          <svg viewBox="0 0 800 600" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
            <defs>
              <linearGradient id="t-route" x1="0" x2="1">
                <stop offset="0%" stopColor="#b89968" stopOpacity="0.85" />
                <stop offset="55%" stopColor="#f3f1ec" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#b89968" stopOpacity="0.45" />
              </linearGradient>
              <radialGradient id="t-parisGlow">
                <stop offset="0%" stopColor="#b89968" stopOpacity="0.32" />
                <stop offset="100%" stopColor="#b89968" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="t-abidjanGlow">
                <stop offset="0%" stopColor="#f3f1ec" stopOpacity="0.22" />
                <stop offset="100%" stopColor="#f3f1ec" stopOpacity="0" />
              </radialGradient>
            </defs>

            <g stroke="rgba(243,241,236,0.06)" strokeWidth="0.5" fill="none">
              <ellipse cx="400" cy="300" rx="380" ry="280" />
              <ellipse cx="400" cy="300" rx="280" ry="220" />
              <ellipse cx="400" cy="300" rx="180" ry="150" />
              <line x1="0" y1="300" x2="800" y2="300" />
              <line x1="400" y1="0" x2="400" y2="600" />
            </g>

            <g fill="none" stroke="rgba(243,241,236,0.32)" strokeWidth="1.2">
              <path d="M 280 130 L 320 110 L 360 115 L 390 130 L 410 150 L 420 170 L 410 200 L 415 220 L 405 240 L 385 250 L 360 245 L 340 250 L 320 240 L 310 220 L 295 205 L 290 180 L 285 160 Z" />
            </g>
            <text x="338" y="195" fontFamily="Geist Mono, monospace" fontSize="10" letterSpacing="2" fill="#b89968">
              MONDE
            </text>
            <circle cx="345" cy="180" r="32" fill="url(#t-parisGlow)" />

            <g fill="none" stroke="rgba(243,241,236,0.32)" strokeWidth="1.2">
              <path d="M 470 380 L 510 385 L 535 395 L 555 410 L 565 430 L 555 455 L 540 470 L 510 480 L 485 478 L 465 470 L 455 450 L 460 425 L 465 405 Z" />
            </g>
            <text x="478" y="438" fontFamily="Geist Mono, monospace" fontSize="10" letterSpacing="1.5" fill="rgba(243,241,236,0.78)">
              AFRIQUE
            </text>
            <circle cx="510" cy="465" r="32" fill="url(#t-abidjanGlow)" />

            <path
              d="M 345 180 Q 380 320 510 465"
              fill="none"
              stroke="url(#t-route)"
              strokeWidth="1.8"
              strokeDasharray="3 4"
            >
              <animate attributeName="stroke-dashoffset" from="0" to="-28" dur="2.4s" repeatCount="indefinite" />
            </path>

            <g fill="rgba(243,241,236,0.55)" fontFamily="Geist Mono, monospace" fontSize="8" letterSpacing="1">
              <circle cx="380" cy="260" r="2" fill="#b89968" />
              <text x="386" y="263">+1 250 km</text>
              <circle cx="450" cy="375" r="2" fill="#f3f1ec" />
              <text x="456" y="378">+3 750 km</text>
            </g>

            <g transform="translate(40, 40)">
              <circle r="22" fill="none" stroke="rgba(243,241,236,0.32)" />
              <text x="0" y="-26" fontFamily="Geist Mono, monospace" fontSize="9" fill="rgba(243,241,236,0.55)" letterSpacing="2" textAnchor="middle">
                N
              </text>
              <path d="M0,-18 L4,4 L0,0 L-4,4 Z" fill="#b89968" />
            </g>

            <g transform="translate(36, 540)" fontFamily="Geist Mono, monospace" fontSize="9" fill="rgba(243,241,236,0.55)" letterSpacing="1.5">
              <text y="-6">{locale === "fr" ? "ÉCHELLE" : "SCALE"}</text>
              <line x1="0" y1="0" x2="80" y2="0" stroke="rgba(243,241,236,0.55)" strokeWidth="1" />
              <line x1="0" y1="-3" x2="0" y2="3" stroke="rgba(243,241,236,0.55)" strokeWidth="1" />
              <line x1="40" y1="-3" x2="40" y2="3" stroke="rgba(243,241,236,0.55)" strokeWidth="1" />
              <line x1="80" y1="-3" x2="80" y2="3" stroke="rgba(243,241,236,0.55)" strokeWidth="1" />
              <text y="14">0 — 2500 — 5000 KM</text>
            </g>

            <text x="760" y="60" textAnchor="end" fontFamily="Geist Mono, monospace" fontSize="9" letterSpacing="2" fill="rgba(243,241,236,0.5)">
              PROJ. ORTHOGRAPHIQUE · WGS84
            </text>
          </svg>

          <a className="t-pin major" style={{ left: "43%", top: "30%" }} href="#territoire">
            <span className="dot" />
            <span className="pin-label">
              <span className="id">A</span>Monde
            </span>
          </a>
          <a className="t-pin major" style={{ left: "64%", top: "78%" }} href="#territoire">
            <span className="dot" />
            <span className="pin-label">
              <span className="id">B</span>Afrique
            </span>
          </a>
          <a className="t-pin" style={{ left: "60%", top: "73%" }} href="#territoire">
            <span className="dot" />
            <span className="pin-label">
              <span className="id">01</span>Abidjan · <span className="city">CI</span>
            </span>
          </a>
          <a className="t-pin" style={{ left: "67%", top: "84%" }} href="#territoire">
            <span className="dot" />
            <span className="pin-label">
              <span className="id">02</span>Dakar · <span className="city">SN</span>
            </span>
          </a>
          <a className="t-pin" style={{ left: "62%", top: "88%" }} href="#territoire">
            <span className="dot" />
            <span className="pin-label">
              <span className="id">03</span>Accra · <span className="city">GH</span>
            </span>
          </a>
        </div>

        <aside className="territoire-side">
          <div className="t-panel">
            <div className="t-panel-head">
              <span>{t("offices")}</span>
              <span className="mono">02 / 02</span>
            </div>
            <div className="t-stat-row">
              <div>
                <div className="big">Monde</div>
                <div className="sub">{t("parisSub")}</div>
              </div>
              <div className="brass">A</div>
            </div>
            <div className="t-stat-row">
              <div>
                <div className="big">Afrique</div>
                <div className="sub">{t("abidjanSub")}</div>
              </div>
              <div className="brass">B</div>
            </div>
          </div>

          <div className="t-panel">
            <div className="t-panel-head">
              <span>{t("liveCorridor")}</span>
              <span className="mono">
                <span className="pulse-dot" /> {t("active")}
              </span>
            </div>
            <ul className="t-feed">
              {feed.map((f, i) => (
                <li key={i}>
                  <span className="mono">{f.t}</span>{" "}
                  <span>
                    {f.label} · <b>{f.place}</b>
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="t-meter">
            <div className="t-meter-num">
              54<small> pays</small>
            </div>
            <div className="t-meter-lbl">{t("meterLabel")}</div>
            <div className="t-meter-bar">
              <span style={{ width: "100%" }} />
            </div>
            <div className="t-meter-foot mono">
              <span>01</span>
              <span>27</span>
              <span>54</span>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
