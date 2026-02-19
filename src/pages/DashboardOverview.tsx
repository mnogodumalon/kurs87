import { useEffect, useState } from 'react';
import { BookOpen, ClipboardList, DoorOpen, GraduationCap, Users, TrendingUp, CheckCircle2, Clock, Euro } from 'lucide-react';
import { LivingAppsService } from '@/services/livingAppsService';
import type { Kurse, Anmeldungen, Dozenten, Teilnehmer, Raeume } from '@/types/app';
import { format, parseISO, isAfter, isBefore } from 'date-fns';
import { de } from 'date-fns/locale';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function DashboardOverview() {
  const [kurse, setKurse] = useState<Kurse[]>([]);
  const [anmeldungen, setAnmeldungen] = useState<Anmeldungen[]>([]);
  const [dozenten, setDozenten] = useState<Dozenten[]>([]);
  const [teilnehmer, setTeilnehmer] = useState<Teilnehmer[]>([]);
  const [raeume, setRaeume] = useState<Raeume[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      LivingAppsService.getKurse(),
      LivingAppsService.getAnmeldungen(),
      LivingAppsService.getDozenten(),
      LivingAppsService.getTeilnehmer(),
      LivingAppsService.getRaeume(),
    ]).then(([k, a, d, t, r]) => {
      setKurse(k);
      setAnmeldungen(a);
      setDozenten(d);
      setTeilnehmer(t);
      setRaeume(r);
    }).finally(() => setLoading(false));
  }, []);

  const today = new Date();
  const aktiveKurse = kurse.filter(k =>
    k.fields.startdatum && k.fields.enddatum &&
    !isAfter(parseISO(k.fields.startdatum), today) &&
    !isBefore(parseISO(k.fields.enddatum), today)
  );
  const kommendeKurse = kurse.filter(k =>
    k.fields.startdatum && isAfter(parseISO(k.fields.startdatum), today)
  );
  const bezahltCount = anmeldungen.filter(a => a.fields.bezahlt === true).length;
  const unbezahltCount = anmeldungen.filter(a => a.fields.bezahlt !== true).length;
  const gesamtUmsatz = kurse.reduce((sum, k) => {
    const kursAnmeldungen = anmeldungen.filter(a => a.fields.kurs?.includes(k.record_id));
    return sum + (k.fields.preis ?? 0) * kursAnmeldungen.length;
  }, 0);

  const kursChartData = kurse
    .map(k => ({
      name: k.fields.titel ? (k.fields.titel.length > 16 ? k.fields.titel.slice(0, 14) + '\u2026' : k.fields.titel) : '\u2013',
      anmeldungen: anmeldungen.filter(a => a.fields.kurs?.includes(k.record_id)).length,
    }))
    .sort((a, b) => b.anmeldungen - a.anmeldungen)
    .slice(0, 6);

  const nextKurse = [...kommendeKurse]
    .sort((a, b) => (a.fields.startdatum ?? '').localeCompare(b.fields.startdatum ?? ''))
    .slice(0, 4);

  const recentAnmeldungen = [...anmeldungen]
    .sort((a, b) => (b.fields.anmeldedatum ?? '').localeCompare(a.fields.anmeldedatum ?? ''))
    .slice(0, 5);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
          <p className="text-sm text-muted-foreground font-medium">Daten werden geladen...</p>
        </div>
      </div>
    );
  }

  const hour = today.getHours();
  const greeting = hour < 12 ? 'Morgen' : hour < 18 ? 'Tag' : 'Abend';

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl p-7 text-white" style={{ background: 'var(--gradient-hero)', boxShadow: 'var(--shadow-hero)' }}>
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, white 0%, transparent 60%)' }} />
        <div className="relative z-10 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-white/60 text-xs font-semibold uppercase tracking-widest mb-1">KursManager Übersicht</p>
            <h1 className="text-3xl font-extrabold tracking-tight">
              Guten {greeting}! 👋
            </h1>
            <p className="text-white/70 mt-1.5 text-sm">{format(today, "EEEE, d. MMMM yyyy", { locale: de })}</p>
          </div>
          <div className="flex gap-3 flex-wrap">
            {[
              { label: 'Aktive Kurse', value: aktiveKurse.length },
              { label: 'Kommende', value: kommendeKurse.length },
              { label: 'Offen', value: unbezahltCount },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-xl px-4 py-3 text-center min-w-[80px]" style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)' }}>
                <p className="text-2xl font-bold">{value}</p>
                <p className="text-white/60 text-xs mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { icon: BookOpen, label: 'Kurse', value: kurse.length, color: 'oklch(0.42 0.19 264)', bg: 'oklch(0.95 0.015 264)' },
          { icon: GraduationCap, label: 'Dozenten', value: dozenten.length, color: 'oklch(0.50 0.16 200)', bg: 'oklch(0.95 0.012 200)' },
          { icon: Users, label: 'Teilnehmer', value: teilnehmer.length, color: 'oklch(0.58 0.16 85)', bg: 'oklch(0.97 0.012 85)' },
          { icon: DoorOpen, label: 'Räume', value: raeume.length, color: 'oklch(0.52 0.18 30)', bg: 'oklch(0.97 0.012 30)' },
          { icon: ClipboardList, label: 'Anmeldungen', value: anmeldungen.length, color: 'oklch(0.52 0.16 320)', bg: 'oklch(0.96 0.012 320)' },
        ].map(({ icon: Icon, label, value, color, bg }) => (
          <div key={label} className="bg-card rounded-xl p-4 border border-border flex items-center gap-3 transition-smooth hover:shadow-md" style={{ boxShadow: 'var(--shadow-card)' }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: bg }}>
              <Icon size={18} style={{ color }} />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground leading-none">{value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar chart */}
        <div className="lg:col-span-2 bg-card rounded-2xl border border-border p-6" style={{ boxShadow: 'var(--shadow-card)' }}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-bold text-foreground text-base">Anmeldungen pro Kurs</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Top-Kurse nach Teilnehmerzahl</p>
            </div>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--gradient-hero)' }}>
              <TrendingUp size={14} color="white" />
            </div>
          </div>
          {kursChartData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
              Noch keine Daten vorhanden
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={kursChartData} barSize={28}>
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'oklch(0.52 0.01 264)', fontFamily: 'Plus Jakarta Sans' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'oklch(0.52 0.01 264)', fontFamily: 'Plus Jakarta Sans' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: '10px', border: '1px solid oklch(0.91 0.006 264)', fontSize: 12, fontFamily: 'Plus Jakarta Sans' }} cursor={{ fill: 'oklch(0.95 0.010 264)' }} />
                <Bar dataKey="anmeldungen" name="Anmeldungen" radius={[6, 6, 0, 0]}>
                  {kursChartData.map((_, i) => (
                    <Cell key={i} fill={['oklch(0.42 0.19 264)', 'oklch(0.50 0.19 264)', 'oklch(0.58 0.17 264)', 'oklch(0.64 0.15 264)', 'oklch(0.70 0.13 264)', 'oklch(0.76 0.10 264)'][i] ?? 'oklch(0.76 0.10 264)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Payment status */}
        <div className="bg-card rounded-2xl border border-border p-6" style={{ boxShadow: 'var(--shadow-card)' }}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-bold text-foreground text-base">Zahlungsstatus</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Alle Anmeldungen</p>
            </div>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'oklch(0.97 0.012 85)' }}>
              <Euro size={14} style={{ color: 'oklch(0.58 0.16 85)' }} />
            </div>
          </div>
          <div className="space-y-5">
            {[
              { label: 'Bezahlt', count: bezahltCount, color: 'oklch(0.50 0.16 200)', bg: 'oklch(0.50 0.16 200)', icon: CheckCircle2 },
              { label: 'Ausstehend', count: unbezahltCount, color: 'oklch(0.58 0.16 85)', bg: 'oklch(0.58 0.16 85)', icon: Clock },
            ].map(({ label, count, color, bg, icon: Icon }) => (
              <div key={label}>
                <div className="flex justify-between text-sm mb-2">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <Icon size={13} style={{ color }} />
                    {label}
                  </span>
                  <span className="font-bold text-foreground">{count}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: anmeldungen.length > 0 ? `${(count / anmeldungen.length) * 100}%` : '0%',
                      background: bg,
                      transition: 'width 0.6s ease'
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 pt-5 border-t border-border">
            <p className="text-xs text-muted-foreground">Erwarteter Gesamtumsatz</p>
            <p className="text-2xl font-bold text-foreground mt-1">{gesamtUmsatz.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</p>
            <p className="text-xs text-muted-foreground mt-0.5">bei vollständiger Zahlung</p>
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming courses */}
        <div className="bg-card rounded-2xl border border-border p-6" style={{ boxShadow: 'var(--shadow-card)' }}>
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-foreground text-base">Kommende Kurse</h2>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: 'oklch(0.95 0.015 264)', color: 'oklch(0.42 0.19 264)' }}>
              {kommendeKurse.length} geplant
            </span>
          </div>
          {nextKurse.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">Keine kommenden Kurse</p>
          ) : (
            <div className="space-y-2">
              {nextKurse.map(kurs => (
                <div key={kurs.record_id} className="flex items-center gap-3 p-3 rounded-xl transition-smooth hover:bg-muted/60">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'var(--gradient-hero)' }}>
                    <BookOpen size={15} color="white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{kurs.fields.titel ?? '\u2013'}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {kurs.fields.startdatum ? format(parseISO(kurs.fields.startdatum), 'd. MMM yyyy', { locale: de }) : '\u2013'}
                      {kurs.fields.max_teilnehmer != null ? ` \u00b7 max. ${kurs.fields.max_teilnehmer} TN` : ''}
                    </p>
                  </div>
                  {kurs.fields.preis != null && (
                    <span className="text-xs font-bold shrink-0" style={{ color: 'oklch(0.42 0.19 264)' }}>
                      {kurs.fields.preis.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent registrations */}
        <div className="bg-card rounded-2xl border border-border p-6" style={{ boxShadow: 'var(--shadow-card)' }}>
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-foreground text-base">Neueste Anmeldungen</h2>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: 'oklch(0.95 0.012 200)', color: 'oklch(0.40 0.16 200)' }}>
              {anmeldungen.length} gesamt
            </span>
          </div>
          {recentAnmeldungen.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">Noch keine Anmeldungen</p>
          ) : (
            <div className="space-y-2">
              {recentAnmeldungen.map(anm => {
                const tnId = anm.fields.teilnehmer?.split('/').pop();
                const tn = teilnehmer.find(t => t.record_id === tnId);
                const tnName = tn?.fields.name ?? '\u2013';
                const kursId = anm.fields.kurs?.split('/').pop();
                const kurs = kurse.find(k => k.record_id === kursId);
                const kursTitle = kurs?.fields.titel ?? '\u2013';
                return (
                  <div key={anm.record_id} className="flex items-center gap-3 p-3 rounded-xl transition-smooth hover:bg-muted/60">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-sm font-bold text-white" style={{ background: 'oklch(0.50 0.16 200)' }}>
                      {tnName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{tnName}</p>
                      <p className="text-xs text-muted-foreground truncate">{kursTitle}</p>
                    </div>
                    <div className="text-right shrink-0">
                      {anm.fields.anmeldedatum && (
                        <p className="text-xs text-muted-foreground">{format(parseISO(anm.fields.anmeldedatum), 'd. MMM', { locale: de })}</p>
                      )}
                      <span
                        className="text-xs font-semibold px-2 py-0.5 rounded-full mt-0.5 inline-block"
                        style={anm.fields.bezahlt
                          ? { background: 'oklch(0.93 0.06 160)', color: 'oklch(0.35 0.14 160)' }
                          : { background: 'oklch(0.96 0.06 80)', color: 'oklch(0.48 0.14 80)' }
                        }
                      >
                        {anm.fields.bezahlt ? 'Bezahlt' : 'Offen'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
