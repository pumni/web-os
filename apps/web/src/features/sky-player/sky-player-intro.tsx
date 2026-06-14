"use client";

import * as React from "react";
import { Download, GitFork, HelpCircle, AlertTriangle, Play, BookOpen, Layers } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, motion, recipes, useReducedMotion } from "@pumni/ui";
import { PreviewWindow } from "./preview-window";

// FAQ Items
const FAQ_ITEMS = [
  {
    question: "Is Sky Player free?",
    answer: "Yes. Sky Player is open-source and free. The source code is hosted on GitHub, and pre-packaged releases can be downloaded for free from the GitHub Releases section.",
  },
  {
    question: "What file formats does Sky Player support?",
    answer: "Sky Player supports three main formats: standard JSON music sheets, native .skysheet files, and JSON-compatible TXT song files from popular Sky Music sheet editors.",
  },
  {
    question: "How do I add songs to Sky Player?",
    answer: "Simply download or save your Sky Music sheets in JSON, .skysheet, or TXT format. In the Sky Player app, click the open/load song button, select your song file, and you are ready to play.",
  },
];

export function SkyPlayerIntro() {
  const [activeFaqIndex, setActiveFaqIndex] = React.useState<number | null>(null);
  const shouldReduce = useReducedMotion();

  const toggleFaq = (index: number) => {
    setActiveFaqIndex((prev) => (prev === index ? null : index));
  };

  return (
    <motion.div
      {...(shouldReduce ? {} : recipes.staggerContainer)}
      className="space-y-16 pb-20"
    >
      {/* 1. Hero Section */}
      <motion.section 
        {...(shouldReduce ? {} : recipes.staggerItem)}
        className="grid gap-10 lg:grid-cols-12 lg:items-center"
      >
        <div className="space-y-6 lg:col-span-7">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <span className="h-2 w-2 rounded-full bg-warning animate-pulse" />
            Open-source Sky COTL music tool for Windows PC
          </div>

          <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl lg:text-6xl">
            Play Sky music sheets on PC{" "}
            <span className="bg-gradient-to-r from-(--brand-gradient-from) via-(--brand-gradient-via) to-(--brand-gradient-to) bg-clip-text text-transparent">
              with Sky Player.
            </span>
          </h1>

          <p className="text-lg text-muted-foreground">
            Sky Player is an automatic PC music sheet player for <strong>Sky: Children of the Light</strong> on Windows. Load JSON, skysheet, or TXT song files, then enjoy simulated keyboard playback with a streamlined desktop workflow.
          </p>

          <div className="flex flex-wrap gap-4">
            <Button asChild className="rounded-full px-6 py-5 font-semibold">
              <a
                href="https://github.com/pumni/Sky-Player/releases/latest"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Download className="mr-2 h-4 w-4" />
                Download latest release
              </a>
            </Button>
            <Button asChild variant="outline" className="rounded-full px-6 py-5 font-semibold">
              <a
                href="https://github.com/pumni/Sky-Player"
                target="_blank"
                rel="noopener noreferrer"
              >
                <GitFork className="mr-2 h-4 w-4" />
                View source on GitHub
              </a>
            </Button>
          </div>
        </div>

        <div className="flex justify-center lg:col-span-5">
          <PreviewWindow />
        </div>
      </motion.section>

      {/* 2. Trust Highlight Ribbon */}
      <motion.section 
        {...(shouldReduce ? {} : recipes.staggerItem)}
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        {[
          { title: "Windows PC", desc: "Tailored specifically for desktop gameplay." },
          { title: "JSON / skysheet / TXT", desc: "Reuses standard Sky sheet formats." },
          { title: "Open Source", desc: "Auditable and free source on GitHub." },
          { title: "Fast Setup", desc: "No installer needed. Extract and play." },
        ].map((item, index) => (
          <Card key={index} interactive={true} variant="solid">
            <CardHeader className="p-4">
              <CardTitle className="text-sm font-bold text-foreground">{item.title}</CardTitle>
              <CardDescription className="text-xs text-muted-foreground">{item.desc}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </motion.section>

      {/* 3. Features Section */}
      <motion.section 
        {...(shouldReduce ? {} : recipes.staggerItem)}
        className="space-y-8"
      >
        <div className="space-y-2 text-center">
          <span className="text-xs font-bold tracking-widest text-primary uppercase">Features</span>
          <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            A focused player for Sky music sheets.
          </h2>
          <p className="mx-auto max-w-2xl text-muted-foreground text-sm">
            Sky Player keeps your setup simple: select your song file, align the window, and trigger clean playback simulation inside your game screen.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              icon: Play,
              title: "Automatic Playback",
              desc: "Automates keyboard inputs simulating natural presses to trigger notes in real-time.",
            },
            {
              icon: Layers,
              title: "Format Compatibility",
              desc: "Supports JSON, native skysheet, and standard TXT sheet files out-of-the-box.",
            },
            {
              icon: BookOpen,
              title: "Made for Desktop",
              desc: "Designed for PC gamers with visual overlay alignment and hotkey control support.",
            },
          ].map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <Card
                key={idx}
                interactive={true}
                className="transition-all duration-300 hover:border-primary/40 hover:[box-shadow:var(--shadow-glass-glow)]"
              >
                <CardHeader>
                  <div className="mb-2 inline-flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-lg font-bold">{feat.title}</CardTitle>
                  <CardDescription className="text-sm text-muted-foreground">
                    {feat.desc}
                  </CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </motion.section>

      {/* 4. Quick Start Section */}
      <motion.section 
        {...(shouldReduce ? {} : recipes.staggerItem)}
        className="grid gap-8 lg:grid-cols-2 lg:items-start"
      >
        <div className="space-y-4">
          <span className="text-xs font-bold tracking-widest text-primary uppercase">Quick start</span>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            Download and play in a few steps.
          </h2>
          <p className="text-muted-foreground text-sm">
            Follow this basic workflow: get the latest ZIP bundle, extract it anywhere on your Windows PC, open Sky: Children of the Light, and launch Sky Player.
          </p>
          <Button asChild className="rounded-full mt-2">
            <a
              href="https://github.com/pumni/Sky-Player/releases/latest"
              target="_blank"
              rel="noopener noreferrer"
            >
              Get latest release
            </a>
          </Button>
        </div>

        <div className="space-y-3">
          {[
            "Download the release package (ZIP) from GitHub.",
            "Extract the files to an easily accessible folder.",
            "Launch Sky: Children of the Light PC client first.",
            "Run Sky Player, select your song, and start playback.",
          ].map((step, idx) => (
            <Card key={idx} interactive={true} variant="inset">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-(--brand-gradient-from) to-(--brand-gradient-via) text-xs font-bold text-primary-foreground">
                  {idx + 1}
                </div>
                <p className="text-sm font-medium text-foreground">{step}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </motion.section>

      {/* 5. Formats Section */}
      <motion.section 
        {...(shouldReduce ? {} : recipes.staggerItem)}
        className="space-y-8"
      >
        <div className="space-y-2 text-center">
          <span className="text-xs font-bold tracking-widest text-primary uppercase">Supported formats</span>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            Bring your Sky Music sheets.
          </h2>
          <p className="mx-auto max-w-xl text-muted-foreground text-sm">
            Compatible with common music editors so you don&apos;t have to rebuild or convert your library.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-3">
          {[
            { ext: ".json", title: "JSON Sheets", desc: "Structured key lists with timestamp offsets." },
            { ext: ".skysheet", title: "skysheet files", desc: "Native format built specifically for SkyCOT." },
            { ext: ".txt", title: "Compatible TXT", desc: "JSON-compatible plain text song exports." },
          ].map((item, idx) => (
            <Card key={idx} interactive={true} className="text-center transition-all duration-300 hover:border-primary/20">
              <CardHeader className="space-y-2">
                <div className="mx-auto w-fit rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                  {item.ext}
                </div>
                <CardTitle className="text-lg font-bold">{item.title}</CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  {item.desc}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </motion.section>

      {/* 6. Responsible Use Callout */}
      <motion.section {...(shouldReduce ? {} : recipes.staggerItem)}>
        <Card className="border-warning/20 bg-warning/5">
          <CardContent className="flex items-start gap-4 p-5">
            <AlertTriangle className="h-5 w-5 shrink-0 text-warning" />
            <div className="space-y-1">
              <h4 className="font-bold text-foreground text-sm">Responsible Use Guidance</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Sky Player is a community-driven desktop music playback simulator. Simulating keystrokes might be regulated differently across game updates. Please review the official game rules and terms for Sky: Children of the Light and play responsibly.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.section>

      {/* 7. FAQ Section */}
      <motion.section 
        {...(shouldReduce ? {} : recipes.staggerItem)}
        className="space-y-6"
      >
        <div className="space-y-2">
          <span className="text-xs font-bold tracking-widest text-primary uppercase">FAQ</span>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Common questions.</h2>
        </div>

        <div className="space-y-3">
          {FAQ_ITEMS.map((faq, idx) => {
            const isOpen = activeFaqIndex === idx;
            return (
              <Card key={idx} className="overflow-hidden">
                <button
                  onClick={() => toggleFaq(idx)}
                  className="flex w-full items-center justify-between p-4 text-left font-bold text-sm text-foreground hover:bg-muted/30 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <HelpCircle className="h-4 w-4 text-primary" />
                    {faq.question}
                  </span>
                  <span className="text-xs text-muted-foreground">{isOpen ? "Hide" : "Show"}</span>
                </button>
                 {isOpen && (
                  <CardContent className="border-t border-border bg-muted p-4 text-xs text-muted-foreground leading-relaxed animate-in fade-in slide-in-from-top-1 duration-200">
                    {faq.answer}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      </motion.section>

      {/* 8. Final CTA Section */}
      <motion.section {...(shouldReduce ? {} : recipes.staggerItem)}>
        <div className="relative overflow-hidden rounded-2xl bg-card border border-border p-8 md:p-12">
          <div className="absolute right-0 top-0 -z-10 h-72 w-72 rounded-full bg-primary/5 blur-3xl" />
          <div className="space-y-6 max-w-2xl">
            <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              Ready to try Sky Player?
            </h2>
            <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
              Grab the latest executable, prepare your instrument inside the game client, and experience automatic song playback.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild className="rounded-full">
                <a
                  href="https://github.com/pumni/Sky-Player/releases/latest"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download latest release
                </a>
              </Button>
              <Button asChild variant="outline" className="rounded-full">
                <a
                  href="https://github.com/pumni/Sky-Player"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View GitHub repository
                </a>
              </Button>
            </div>
          </div>
        </div>
      </motion.section>
    </motion.div>
  );
}
