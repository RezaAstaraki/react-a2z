"use client";
import { useState } from "react";
import { Select } from "./components/ui/select";

const options = [{ value: "starter", label: "Starter", description: "Personal projects" }, { value: "pro", label: "Pro", description: "Growing teams" }, { value: "enterprise", label: "Enterprise", description: "Coming soon", disabled: true }];
export default function Demo() {
  const [plan, setPlan] = useState("starter");
  return <main className="min-h-screen bg-bg text-fg p-8 sm:p-12">
    <div className="mx-auto max-w-2xl">
      <p className="text-xs uppercase tracking-widest text-fg-muted">React A2Z · CLI starter</p>
      <h1 className="mt-3 text-3xl font-semibold">Choose your workspace plan</h1>
      <p className="mt-3 text-fg-muted">Open the menu or use arrow keys. Enterprise is disabled.</p>
      <section className="mt-8 space-y-6 rounded-2xl border border-border bg-surface p-6 shadow-sm">
        <Select label="Workspace plan" description="Your selected plan appears below." options={options} value={plan} onValueChange={value => setPlan(String(value))} required />
        <p role="status" className="rounded-xl bg-muted p-4 text-sm">Selected plan: <strong>{plan}</strong></p>
        <Select label="Locked plan" options={options} value="starter" disabled />
        <Select label="Billing plan" options={options} placeholder="Choose a plan" error="Choose a billing plan to continue." required />
        <Select label="Custom plan" options={options} defaultValue="pro" classNames={{ control: "rounded-full border-violet-300 bg-violet-50 text-violet-950", popover: "rounded-2xl border-violet-200", option: "rounded-xl", label: "text-violet-800" }} />
      </section>
      <footer className="mt-6 text-xs text-fg-muted">next-app-src-tw4 · Tailwind 4 · TypeScript · src layout</footer>
    </div>
  </main>;
}
