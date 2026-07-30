# Landing Page RFQ Agent — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and deploy a 4-section landing page (Hero, Cómo funciona, Beneficios, Formulario) that captures demo leads via email and gives credibility for LinkedIn prospecting.

**Architecture:** Server Component page with one extracted Client Component for the form. A Next.js Server Action handles form submission and sends the lead email via Resend. No database needed for Sprint 1.

**Tech Stack:** Next.js 14 App Router, TypeScript, Tailwind CSS, Resend SDK, Zod (already in dependencies)

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `src/app/(landing)/layout.tsx` | Create | Minimal layout wrapper (no dashboard nav) |
| `src/app/(landing)/page.tsx` | Create | Full page: Hero + Cómo funciona + Beneficios + Formulario sections |
| `src/components/ContactForm.tsx` | Create | Client Component: controlled form + success/error state |
| `src/app/actions/contact.ts` | Create | Server Action: validates input, sends lead email via Resend |

---

## Task 1: Prerequisite check — install dependencies

**Files:** none (verification only)

- [ ] **Step 1: Verify Node.js is installed**

Run in the project directory (`c:\Users\esteb\Desktop\claude code curso\rfq-agent-final`):
```bash
node --version
```
Expected: `v18.x.x` or higher. If missing, download from nodejs.org.

- [ ] **Step 2: Install project dependencies**

```bash
npm install
```
Expected: finishes without errors. Creates/updates `node_modules/`.

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npm run typecheck
```
Expected: no errors (may show warnings, that's ok).

- [ ] **Step 4: Create .env.local with minimum required variables**

Create the file `c:\Users\esteb\Desktop\claude code curso\rfq-agent-final\.env.local` with this content (replace the value after getting your Resend API key from resend.com/api-keys):

```
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_APP_URL=http://localhost:3000
INTERNAL_SECRET=placeholder_for_sprint1
NEXT_PUBLIC_SUPABASE_URL=https://placeholder.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder
SUPABASE_SERVICE_ROLE_KEY=placeholder
RESEND_FROM_DOMAIN=placeholder.com
GOOGLE_GEMINI_API_KEY=placeholder
ANTHROPIC_API_KEY=placeholder
```

> **Note:** The Supabase and AI keys are placeholders for now — they are only needed for Sprint 2. The only real key needed for Sprint 1 is `RESEND_API_KEY`.

---

## Task 2: Landing layout wrapper

**Files:**
- Create: `src/app/(landing)/layout.tsx`

- [ ] **Step 1: Create the layout file**

```tsx
// src/app/(landing)/layout.tsx
export default function LandingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
```

- [ ] **Step 2: Verify TypeScript still compiles**

```bash
npm run typecheck
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git init
git add src/app/\(landing\)/layout.tsx
git commit -m "feat: add landing layout wrapper"
```

> **Note:** If the repo already has `git init`, skip the `git init` line.

---

## Task 3: Server Action for contact form

**Files:**
- Create: `src/app/actions/contact.ts`

- [ ] **Step 1: Create the Server Action file**

```typescript
// src/app/actions/contact.ts
'use server'

import { resend } from '@/lib/resend'
import { z } from 'zod'

const ContactSchema = z.object({
  nombre: z.string().min(2, 'El nombre es demasiado corto'),
  email: z.string().email('Email inválido'),
  taller: z.string().min(2, 'El nombre del taller es requerido'),
  volumen: z.enum(['1-5', '5-20', '+20'], {
    errorMap: () => ({ message: 'Selecciona un volumen' }),
  }),
})

export type ContactState = {
  success: boolean
  error: string
}

export async function submitContactForm(
  _prevState: ContactState,
  formData: FormData
): Promise<ContactState> {
  const raw = {
    nombre: formData.get('nombre'),
    email: formData.get('email'),
    taller: formData.get('taller'),
    volumen: formData.get('volumen'),
  }

  const result = ContactSchema.safeParse(raw)
  if (!result.success) {
    return { success: false, error: result.error.errors[0].message }
  }

  const { nombre, email, taller, volumen } = result.data

  try {
    await resend.emails.send({
      from: 'RFQ Agent <onboarding@resend.dev>',
      to: 'estebanpinillaalva@gmail.com',
      subject: `Nueva solicitud de demo — ${taller}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1e293b;">Nueva solicitud de demo 🎉</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px 0; color: #64748b;">Nombre</td><td style="padding: 8px 0; font-weight: 600;">${nombre}</td></tr>
            <tr><td style="padding: 8px 0; color: #64748b;">Email</td><td style="padding: 8px 0; font-weight: 600;">${email}</td></tr>
            <tr><td style="padding: 8px 0; color: #64748b;">Taller</td><td style="padding: 8px 0; font-weight: 600;">${taller}</td></tr>
            <tr><td style="padding: 8px 0; color: #64748b;">Presupuestos/mes</td><td style="padding: 8px 0; font-weight: 600;">${volumen}</td></tr>
          </table>
          <p style="margin-top: 24px; color: #64748b; font-size: 14px;">Contacta en menos de 24h para no perder el lead.</p>
        </div>
      `,
    })
    return { success: true, error: '' }
  } catch (err) {
    console.error('Error enviando email de contacto:', err)
    return { success: false, error: 'Error al enviar. Inténtalo de nuevo.' }
  }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npm run typecheck
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/actions/contact.ts
git commit -m "feat: add contact form Server Action with Zod validation"
```

---

## Task 4: ContactForm client component

**Files:**
- Create: `src/components/ContactForm.tsx`

- [ ] **Step 1: Create the client component**

```tsx
// src/components/ContactForm.tsx
'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { submitContactForm, type ContactState } from '@/app/actions/contact'

const initialState: ContactState = { success: false, error: '' }

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full py-3 px-6 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-xl text-base transition-colors cursor-pointer disabled:cursor-not-allowed"
    >
      {pending ? 'Enviando...' : 'Quiero mi demo gratuita'}
    </button>
  )
}

export function ContactForm() {
  const [state, formAction] = useFormState(submitContactForm, initialState)

  if (state.success) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-4">✅</div>
        <p className="text-green-400 text-lg font-semibold mb-2">
          ¡Recibido! Te contactamos antes de 24h.
        </p>
        <p className="text-slate-400 text-sm">
          Revisa también tu carpeta de spam si no recibes noticias.
        </p>
      </div>
    )
  }

  return (
    <form action={formAction} className="space-y-5">
      <div>
        <label htmlFor="nombre" className="block text-sm font-medium text-slate-300 mb-1.5">
          Nombre completo *
        </label>
        <input
          id="nombre"
          name="nombre"
          type="text"
          required
          autoComplete="name"
          className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
          placeholder="Ej: Antonio García"
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-1.5">
          Email *
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
          placeholder="antonio@tallergarcia.com"
        />
      </div>

      <div>
        <label htmlFor="taller" className="block text-sm font-medium text-slate-300 mb-1.5">
          Nombre del taller *
        </label>
        <input
          id="taller"
          name="taller"
          type="text"
          required
          className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
          placeholder="Mecanizados García S.L."
        />
      </div>

      <div>
        <label htmlFor="volumen" className="block text-sm font-medium text-slate-300 mb-1.5">
          ¿Cuántos presupuestos haces al mes? *
        </label>
        <select
          id="volumen"
          name="volumen"
          required
          defaultValue=""
          className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
        >
          <option value="" disabled>
            Selecciona una opción
          </option>
          <option value="1-5">1–5 presupuestos</option>
          <option value="5-20">5–20 presupuestos</option>
          <option value="+20">Más de 20</option>
        </select>
      </div>

      {state.error && (
        <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-2">
          {state.error}
        </p>
      )}

      <SubmitButton />
    </form>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npm run typecheck
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/ContactForm.tsx
git commit -m "feat: add ContactForm client component with useFormState"
```

---

## Task 5: Main landing page

**Files:**
- Create: `src/app/(landing)/page.tsx`

- [ ] **Step 1: Create the page**

```tsx
// src/app/(landing)/page.tsx
import { ContactForm } from '@/components/ContactForm'

const steps = [
  {
    icon: '📧',
    step: '01',
    title: 'Tu cliente manda los planos',
    desc: 'PDF, STEP o DXF al email de tu taller. Exactamente como hace ahora.',
  },
  {
    icon: '⚙️',
    step: '02',
    title: 'El agente los analiza',
    desc: 'En 5–15 min procesa materiales, tolerancias, operaciones y calcula tiempos automáticamente.',
  },
  {
    icon: '📄',
    step: '03',
    title: 'Recibes el borrador listo',
    desc: 'Análisis técnico + presupuesto en PDF en tu bandeja. Solo revísalo y envíalo.',
  },
]

const benefits = [
  {
    title: 'De 2 días a 15 minutos',
    desc: 'Responde a clientes antes que tu competencia. La velocidad cierra pedidos.',
  },
  {
    title: 'Menos errores en los precios',
    desc: 'El sistema calcula tiempos y materiales sin descuidos. Sin sorpresas al fabricar.',
  },
  {
    title: 'Más tiempo para cerrar ventas',
    desc: 'Delega lo mecánico, tú te centras en el cliente y en los pedidos más rentables.',
  },
  {
    title: 'Sin suscripciones caras',
    desc: 'Pagas solo por lo que procesas. Sin costes fijos cuando hay menos trabajo.',
  },
]

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-slate-900 text-white">
      {/* ── HERO ──────────────────────────────────────────────────── */}
      <section className="relative flex flex-col items-center justify-center min-h-screen px-4 text-center">
        <div className="max-w-3xl mx-auto">
          <div className="inline-block px-3 py-1 mb-8 text-xs font-semibold tracking-wide text-blue-400 bg-blue-400/10 border border-blue-400/20 rounded-full uppercase">
            Para talleres mecánicos españoles
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-tight mb-6">
            De planos a presupuesto{' '}
            <span className="text-blue-400">en 15 minutos</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Envíanos los planos de tu cliente y recibe el análisis técnico + borrador de
            presupuesto antes de que acabes el café. Sin esperas. Sin errores de cálculo.
          </p>
          <a
            href="#formulario"
            className="inline-block px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-lg transition-colors"
          >
            Solicita una demo gratuita →
          </a>
        </div>
      </section>

      {/* ── CÓMO FUNCIONA ─────────────────────────────────────────── */}
      <section className="py-24 px-4 bg-slate-800/40 border-y border-slate-800">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-3">
            Así de simple
          </h2>
          <p className="text-slate-400 text-center mb-16">
            Sin cambiar cómo trabajas. Sin instalar nada.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {steps.map((item) => (
              <div
                key={item.step}
                className="p-6 bg-slate-800 border border-slate-700 rounded-2xl"
              >
                <div className="text-3xl mb-4">{item.icon}</div>
                <div className="text-xs font-mono text-blue-400 mb-2 tracking-widest">
                  PASO {item.step}
                </div>
                <h3 className="text-base font-semibold mb-2">{item.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BENEFICIOS ────────────────────────────────────────────── */}
      <section className="py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-3">
            Por qué los talleres lo usan
          </h2>
          <p className="text-slate-400 text-center mb-16">
            Resultados concretos desde el primer RFQ.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {benefits.map((item) => (
              <div
                key={item.title}
                className="p-6 bg-slate-800 border border-slate-700 rounded-2xl"
              >
                <h3 className="text-base font-semibold text-blue-400 mb-2">{item.title}</h3>
                <p className="text-slate-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FORMULARIO ────────────────────────────────────────────── */}
      <section
        id="formulario"
        className="py-24 px-4 bg-slate-800/40 border-y border-slate-800"
      >
        <div className="max-w-lg mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-3">
            Empieza gratis
          </h2>
          <p className="text-slate-400 text-center mb-10">
            Cuéntanos tu taller y te contactamos en menos de 24h.
          </p>
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8">
            <ContactForm />
          </div>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────── */}
      <footer className="py-8 px-4 text-center text-slate-500 text-sm">
        © 2026 RFQ Agent · Automatización de presupuestos para talleres mecánicos
      </footer>
    </main>
  )
}
```

- [ ] **Step 2: Run the dev server**

```bash
npm run dev
```
Expected: output includes `Local: http://localhost:3000`. Keep this running.

- [ ] **Step 3: Verify the page in the browser**

Open `http://localhost:3000` in your browser. Check:
- Hero section visible with blue "en 15 minutos" text
- CTA button present
- "Así de simple" section with 3 cards
- "Por qué los talleres lo usan" with 4 cards
- Form at the bottom with 4 fields + submit button

- [ ] **Step 4: Test scroll from CTA**

Click "Solicita una demo gratuita →". The page should scroll smoothly to the form section.

- [ ] **Step 5: Stop the dev server and run TypeScript check**

Press `Ctrl+C` to stop the server, then:

```bash
npm run typecheck
```
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/app/\(landing\)/page.tsx
git commit -m "feat: build landing page with hero, steps, benefits, and form sections"
```

---

## Task 6: End-to-end form test

**Prerequisite:** You have a real `RESEND_API_KEY` in `.env.local`. If not, get one at resend.com (free, no credit card needed for testing).

- [ ] **Step 1: Start the dev server**

```bash
npm run dev
```

- [ ] **Step 2: Submit the form with test data**

Go to `http://localhost:3000`, scroll to the form, fill in:
- Nombre: `Test Demo`
- Email: `estebanpinillaalva@gmail.com`
- Taller: `Taller Prueba S.L.`
- Volumen: `5-20 presupuestos`

Click "Quiero mi demo gratuita".

Expected:
- Button shows "Enviando..." briefly
- Form disappears and shows "¡Recibido! Te contactamos antes de 24h."

- [ ] **Step 3: Check your email**

Open `estebanpinillaalva@gmail.com`. You should receive an email with subject "Nueva solicitud de demo — Taller Prueba S.L." with all the form fields.

> **If you don't receive it:** Resend free tier requires the recipient email to be verified. Go to resend.com → Emails → Audiences and verify `estebanpinillaalva@gmail.com`. Alternatively, check if the API key is correct in `.env.local`.

- [ ] **Step 4: Test mobile layout**

In Chrome, open DevTools (F12) → Toggle device toolbar (Ctrl+Shift+M). Select "iPhone 12 Pro" (390px). Check:
- All sections stack vertically
- Text readable
- Form usable

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "feat: landing page Sprint 1 complete — form sends lead email via Resend"
```

---

## Task 7: Deploy to Vercel

- [ ] **Step 1: Push the repo to GitHub**

If you haven't created a GitHub repo yet:
1. Go to github.com → New repository → name: `rfq-agent` → Private → Create
2. Run:
```bash
git remote add origin https://github.com/TU_USUARIO/rfq-agent.git
git branch -M main
git push -u origin main
```

- [ ] **Step 2: Connect to Vercel**

1. Go to vercel.com and log in with GitHub
2. Click "Add New Project" → Import your `rfq-agent` repo
3. Framework: Next.js (auto-detected)
4. Click "Deploy" — it will fail because env vars are missing (expected)

- [ ] **Step 3: Add environment variables in Vercel**

In your Vercel project → Settings → Environment Variables, add:
```
RESEND_API_KEY          = re_xxxxxxxxxxxxxxxxxxxxxxxx  (your real key)
NEXT_PUBLIC_APP_URL     = https://your-project.vercel.app  (your Vercel URL)
INTERNAL_SECRET         = (generate: openssl rand -base64 32)
```
The Supabase, Gemini, and Anthropic keys can stay as placeholders for now.

- [ ] **Step 4: Redeploy**

In Vercel → Deployments → click "Redeploy" on the latest deployment.
Expected: build succeeds, URL is live.

- [ ] **Step 5: Test the live URL**

Open your Vercel URL. Submit the form. Verify you receive the lead email.

---

## Self-Review

**Spec coverage check:**
- ✅ Hero with "De planos a presupuesto en 15 minutos" + CTA — Task 5
- ✅ Cómo funciona (3 pasos) — Task 5
- ✅ Beneficios (4 tarjetas 2×2) — Task 5
- ✅ Formulario (4 campos + Server Action) — Tasks 3, 4, 5
- ✅ Mensaje post-envío "¡Recibido!" — Task 4
- ✅ Scroll suave CTA → formulario — Task 5 (`href="#formulario"`)
- ✅ Fondo oscuro / estética industrial — Task 5 (slate-900)
- ✅ Responsive mobile — Task 5 + Task 6 verification
- ✅ TypeScript estricto sin `any` — all tasks
- ✅ API key desde `.env.local` — Task 3 (no hardcoding)
- ✅ Deploy Vercel — Task 7

**No placeholders found.**

**Type consistency:** `ContactState` defined in `contact.ts`, imported in `ContactForm.tsx` — consistent. `submitContactForm` signature matches `useFormState` expectations.
